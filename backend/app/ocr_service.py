import base64
import re
from io import BytesIO

import binascii
import easyocr
import numpy as np
from PIL import Image, ImageEnhance, ImageOps, UnidentifiedImageError
from fastapi import HTTPException


_reader = None


def get_reader():
    global _reader

    if _reader is None:
        _reader = easyocr.Reader(["en"], gpu=False)

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
    image = upscale_small_image(image)

    grayscale = ImageOps.grayscale(image)
    high_contrast = ImageEnhance.Contrast(grayscale).enhance(1.8)
    sharpened = ImageEnhance.Sharpness(high_contrast).enhance(1.5)

    return [
        np.array(image),
        np.array(sharpened),
    ]


def upscale_small_image(image: Image.Image) -> Image.Image:
    width, height = image.size
    longest_side = max(width, height)

    if longest_side >= 1200:
        return image

    scale = 1200 / longest_side
    new_size = (int(width * scale), int(height * scale))

    return image.resize(new_size, Image.Resampling.LANCZOS)


def extract_text_from_image(image_base64: str) -> str:
    reader = get_reader()
    text_parts = []

    for image in build_ocr_images(image_base64):
        results = reader.readtext(
            image,
            detail=0,
            paragraph=True,
        )
        text_parts.extend(results)

    return dedupe_text_parts(text_parts)


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
