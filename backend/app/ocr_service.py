import base64
import binascii
import gc
import logging
import re
from io import BytesIO

import numpy as np
from PIL import Image, ImageEnhance, ImageOps, UnidentifiedImageError
from fastapi import HTTPException
import torch

logger = logging.getLogger(__name__)

try:
    torch.set_num_threads(1)
except Exception:
    pass

_rapid_ocr = None
_reader = None


def get_rapid_ocr():
    global _rapid_ocr
    if _rapid_ocr is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _rapid_ocr = RapidOCR(intra_op_num_threads=1, inter_op_num_threads=1)
            logger.info("RapidOCR (ONNX Runtime, 1 thread) initialized.")
        except Exception as err:
            logger.warning(f"RapidOCR unavailable: {err}")
            _rapid_ocr = None
    return _rapid_ocr


def get_reader():
    global _reader
    if _reader is None:
        try:
            import easyocr
            _reader = easyocr.Reader(["en"], gpu=False, quantize=True)
            logger.info("EasyOCR initialized.")
        except Exception as err:
            logger.warning(f"EasyOCR unavailable: {err}")
            _reader = None
    return _reader


def safe_load_pil_image(image_base64: str) -> Image.Image:
    """Safely decode base64 string to PIL Image, catching malformed input, corruption, and invalid formats."""
    if not image_base64 or not isinstance(image_base64, str):
        raise HTTPException(status_code=400, detail="Missing or invalid image data")

    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_base64)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Malformed base64 image encoding")

    if len(image_bytes) < 16:
        raise HTTPException(status_code=400, detail="Image payload is too small to be a valid image")

    try:
        image = Image.open(BytesIO(image_bytes))
        image.load()  # Force decode to detect corrupted data or decompression bombs early
        return image.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError) as err:
        raise HTTPException(status_code=400, detail="Unsupported or corrupt image format") from err


def decode_base64_image(image_base64: str):
    image = safe_load_pil_image(image_base64)
    return np.array(image)


def build_ocr_images(image_base64: str):
    image = safe_load_pil_image(image_base64)
    image = normalize_ocr_image(image)

    grayscale = ImageOps.grayscale(image)
    high_contrast = ImageEnhance.Contrast(grayscale).enhance(1.6)

    return [
        np.array(high_contrast),
    ]


def normalize_ocr_image(image: Image.Image) -> Image.Image:
    width, height = image.size
    longest_side = max(width, height)

    if longest_side > 800:
        scale = 800 / longest_side
        new_size = (int(width * scale), int(height * scale))
        return image.resize(new_size, Image.Resampling.BILINEAR)
    elif longest_side < 400 and longest_side > 0:
        scale = 400 / longest_side
        new_size = (int(width * scale), int(height * scale))
        return image.resize(new_size, Image.Resampling.BILINEAR)

    return image


def upscale_small_image(image: Image.Image) -> Image.Image:
    return normalize_ocr_image(image)


def extract_text_with_gemini(image_base64: str) -> str:
    import json
    import os
    import urllib.request
    from io import BytesIO

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return ""

    try:
        pil_img = safe_load_pil_image(image_base64)
        w, h = pil_img.size
        longest = max(w, h)
        if longest > 800:
            scale = 800 / longest
            pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)

        buf = BytesIO()
        pil_img.save(buf, format="JPEG", quality=85)
        raw_b64 = base64.b64encode(buf.getvalue()).decode()

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
        payload = json.dumps({
            "contents": [{
                "parts": [
                    {
                        "text": (
                            "Extract all text from this product packaging label. "
                            "Focus on ingredients, food additives, chemical E-numbers, brand name, and certification markings. "
                            "Output ONLY the plain extracted text without commentary or formatting."
                        )
                    },
                    {"inline_data": {"mime_type": "image/jpeg", "data": raw_b64}}
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 600
            }
        }).encode()

        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode())
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    extracted = parts[0].get("text", "").strip()
                    if extracted and len(extracted) > 3:
                        logger.info("Gemini Cloud Vision OCR extraction succeeded.")
                        return extracted
    except Exception as err:
        logger.warning(f"Gemini Cloud Vision OCR error: {err}")

    return ""


def extract_text_from_image(image_base64: str) -> str:
    # 1. Primary Engine: High-Speed Cloud AI Vision (0MB RAM, fast cloud inference)
    gemini_text = extract_text_with_gemini(image_base64)
    if gemini_text:
        return gemini_text

    # 2. Local Fallback Engine: RapidOCR (ONNX Runtime, ~50MB RAM, ~1.5s CPU latency)
    try:
        engine = get_rapid_ocr()
        if engine is not None:
            image = safe_load_pil_image(image_base64)
            image = normalize_ocr_image(image)
            arr = np.array(image)
            result, _ = engine(arr)
            if result:
                text_parts = [line[1] for line in result if line and len(line) > 1]
                extracted = dedupe_text_parts(text_parts)
                if extracted and len(extracted.strip()) > 3:
                    gc.collect()
                    return extracted
    except Exception as err:
        logger.warning(f"RapidOCR extraction warning: {err}")

    # 2. Secondary Fallback Engine: EasyOCR (CRAFT + CRNN)
    try:
        reader = get_reader()
        if reader is not None:
            text_parts = []
            with torch.inference_mode():
                for image in build_ocr_images(image_base64):
                    results = reader.readtext(
                        image,
                        detail=0,
                        paragraph=True,
                        canvas_size=640,
                        mag_ratio=1.0,
                    )
                    text_parts.extend(results)
            gc.collect()
            return dedupe_text_parts(text_parts)
    except Exception as err:
        logger.warning(f"EasyOCR fallback warning: {err}")

    return ""


def sanitize_ocr_text(text: str) -> str:
    """
    Sanitize OCR extracted strings against potential XSS and control-character injection
    from adversarial camera inputs.
    """
    if not text:
        return ""
    # Strip any embedded HTML/XML tags
    clean = re.sub(r"<[^>]*>", "", str(text))
    # Neutralize dangerous characters and null bytes
    clean = clean.replace("<", "&lt;").replace(">", "&gt;").replace("\x00", "")
    return clean.strip()


def dedupe_text_parts(text_parts):
    seen = set()
    unique_parts = []

    for part in text_parts:
        sanitized = sanitize_ocr_text(part)
        normalized = normalize_text(sanitized)

        if not normalized or normalized in seen:
            continue

        seen.add(normalized)
        unique_parts.append(sanitized)

    return " ".join(unique_parts)


def find_e_numbers(text: str):
    pattern = r"\bE\s*[-]?\s*\d{3,4}[a-zA-Z]?\b"
    matches = re.findall(pattern, text, flags=re.IGNORECASE)

    cleaned = []
    for match in matches:
        code = re.sub(r"\s+|-", "", match).upper()
        cleaned.append(code)

    return sorted(set(cleaned))

def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
