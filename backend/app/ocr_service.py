import base64
import binascii
import gc
import logging
import re
from io import BytesIO

import numpy as np
from PIL import Image, ImageEnhance, ImageOps, UnidentifiedImageError
from fastapi import HTTPException

logger = logging.getLogger(__name__)

_rapid_ocr = None


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


def build_ocr_images(image_or_b64):
    if isinstance(image_or_b64, str):
        image = safe_load_pil_image(image_or_b64)
        image = normalize_ocr_image(image)
    else:
        image = normalize_ocr_image(image_or_b64)

    grayscale = ImageOps.grayscale(image)
    autocontrast = ImageOps.autocontrast(grayscale, cutoff=1)
    high_contrast = ImageEnhance.Contrast(autocontrast).enhance(1.6)
    sharpened = ImageEnhance.Sharpness(high_contrast).enhance(1.5)

    return [
        np.array(sharpened.convert("RGB")),
    ]


def _unwrap_polar_rim_strips(crop_rgb: Image.Image):
    """
    Unwraps the outer circular rim of a seal into two horizontal strips
    (top arc read clockwise, bottom arc read counter-clockwise) so RapidOCR
    can read curved perimeter organization names on circular Halal seals.
    """
    try:
        arr = np.array(crop_rgb)
        h, w = arr.shape[:2]
        if min(h, w) < 48:
            return []

        cx, cy = w / 2.0, h / 2.0
        r_max = min(cx, cy) * 0.98
        r_min = min(cx, cy) * 0.42
        out_h = max(48, int(round(r_max - r_min)))
        out_w = max(240, int(round(np.pi * r_max)))

        # 1. Top rim arc (-165 deg to -15 deg, where -90 deg is 12 o'clock)
        thetas_top = np.linspace(-np.pi * 0.92, -np.pi * 0.08, out_w)
        radii_top = np.linspace(r_min, r_max, out_h)
        theta_grid, r_grid = np.meshgrid(thetas_top, radii_top)
        map_x = np.clip(np.round(cx + r_grid * np.cos(theta_grid)).astype(int), 0, w - 1)
        map_y = np.clip(np.round(cy + r_grid * np.sin(theta_grid)).astype(int), 0, h - 1)
        top_strip = arr[map_y, map_x]

        # 2. Bottom rim arc (+165 deg to +15 deg, where +90 deg is 6 o'clock, upright radial direction)
        thetas_bot = np.linspace(np.pi * 0.92, np.pi * 0.08, out_w)
        radii_bot = np.linspace(r_max, r_min, out_h)
        theta_grid_b, r_grid_b = np.meshgrid(thetas_bot, radii_bot)
        map_xb = np.clip(np.round(cx + r_grid_b * np.cos(theta_grid_b)).astype(int), 0, w - 1)
        map_yb = np.clip(np.round(cy + r_grid_b * np.sin(theta_grid_b)).astype(int), 0, h - 1)
        bot_strip = arr[map_yb, map_xb]

        return [top_strip, bot_strip]
    except Exception:
        return []


def extract_roi_crop_text(crop_image: Image.Image) -> str:
    """
    Runs fast local RapidOCR on a high-resolution YOLOv8 logo bounding-box crop,
    combining upright enhanced OCR and polar-unwrapped rim strips for circular seals.
    """
    if crop_image is None:
        return ""
    try:
        engine = get_rapid_ocr()
        if engine is None:
            return ""

        crop_rgb = crop_image.convert("RGB")
        w, h = crop_rgb.size
        if min(w, h) < 12:
            return ""

        target_side = 320
        longest = max(w, h)
        if longest < target_side:
            scale = target_side / float(longest)
            crop_rgb = crop_rgb.resize(
                (max(1, int(round(w * scale))), max(1, int(round(h * scale)))),
                Image.Resampling.LANCZOS,
            )

        collected_lines = []

        for candidate_arr in [np.array(crop_rgb)] + build_ocr_images(crop_rgb):
            res, _ = engine(candidate_arr)
            if res:
                for line in res:
                    if line and len(line) > 1 and line[1]:
                        collected_lines.append(str(line[1]))

        for strip_arr in _unwrap_polar_rim_strips(crop_rgb):
            res_strip, _ = engine(strip_arr)
            if res_strip:
                for line in res_strip:
                    if line and len(line) > 1 and line[1]:
                        collected_lines.append(str(line[1]))

        return dedupe_text_parts(collected_lines)
    except Exception as err:
        logger.debug(f"ROI crop OCR skipped: {err}")
        return ""


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

        # Try gemini-flash-lite-latest first, fallback to gemini-2.5-flash and gemini-flash-latest
        for model_name in ["gemini-flash-lite-latest", "gemini-2.5-flash", "gemini-flash-latest"]:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = json.dumps({
                "contents": [{
                    "parts": [
                        {
                            "text": (
                                "Extract all readable text printed on this packaging or label verbatim. "
                                "Include brand name, ingredients, food additives, chemical E-numbers, "
                                "and text inside certification marks or logos. "
                                "Do NOT invent, assume, or hallucinate text not clearly visible on the image. "
                                "Output ONLY the exact visible text."
                            )
                        },
                        {"inline_data": {"mime_type": "image/jpeg", "data": raw_b64}}
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.0,
                    "maxOutputTokens": 600
                }
            }).encode()

            req = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=12) as resp:
                    data = json.loads(resp.read().decode())
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            extracted = parts[0].get("text", "").strip()
                            if extracted and len(extracted) > 3:
                                # Check if the response is conversational filler indicating no text was found
                                lower_text = extracted.lower()
                                no_text_phrases = [
                                    "no readable text",
                                    "no text visible",
                                    "no text found",
                                    "no text is visible",
                                    "no visible text",
                                    "there is no text",
                                    "there is no readable text",
                                    "there is no packaging",
                                    "no packaging",
                                    "nothing visible",
                                    "unable to read text",
                                    "cannot read any text",
                                    "no text could be",
                                ]
                                if any(phrase in lower_text for phrase in no_text_phrases) and len(extracted) < 160:
                                    logger.info("Cloud Vision indicated no readable text in image.")
                                    return ""

                                logger.info(f"Cloud Vision OCR succeeded with {model_name}.")
                                return extracted
            except Exception as model_err:
                logger.warning(f"Cloud Vision OCR attempt with {model_name} failed: {model_err}")
                continue
    except Exception as err:
        logger.warning(f"Cloud Vision OCR general error: {err}")

    return ""


def extract_text_with_metadata(image_base64: str) -> dict:
    """
    Extracts label text along with provenance metadata (engine used, mean line confidence, line count).
    """
    # 1. Primary Engine: High-Speed Cloud AI Vision (0MB RAM, fast cloud inference)
    cloud_text = extract_text_with_gemini(image_base64)
    if cloud_text:
        sanitized_cloud = sanitize_ocr_text(cloud_text)
        lines = [ln for ln in sanitized_cloud.splitlines() if ln.strip()]
        return {
            "text": sanitized_cloud,
            "engine": "Gemini Cloud Vision",
            "mean_confidence": 0.92,
            "line_count": len(lines),
        }

    # 2. Local Fallback Engine: RapidOCR (ONNX Runtime) with contrast-enhanced retry
    try:
        engine = get_rapid_ocr()
        if engine is not None:
            image = safe_load_pil_image(image_base64)
            norm_img = normalize_ocr_image(image)
            arr = np.array(norm_img)
            result, _ = engine(arr)

            text_parts = []
            confidences = []
            if result:
                for line in result:
                    if line and len(line) > 1 and line[1]:
                        line_conf = float(line[2]) if len(line) > 2 and line[2] is not None else 0.75
                        if line_conf >= 0.40:
                            text_parts.append(str(line[1]))
                            confidences.append(line_conf)

            mean_conf = float(np.mean(confidences)) if confidences else 0.0
            extracted = dedupe_text_parts(text_parts)

            # Retry with contrast/sharpness preprocessing if primary pass had sparse or low-confidence text
            if len(extracted) < 25 or mean_conf < 0.68:
                for enhanced_arr in build_ocr_images(norm_img):
                    res_enh, _ = engine(enhanced_arr)
                    if res_enh:
                        for line in res_enh:
                            if line and len(line) > 1 and line[1]:
                                line_conf = float(line[2]) if len(line) > 2 and line[2] is not None else 0.75
                                if line_conf >= 0.45:
                                    text_parts.append(str(line[1]))
                                    confidences.append(line_conf)
                extracted = dedupe_text_parts(text_parts)
                mean_conf = float(np.mean(confidences)) if confidences else 0.0

            gc.collect()
            if extracted and len(extracted.strip()) > 3:
                return {
                    "text": extracted,
                    "engine": "RapidOCR (ONNX Runtime)",
                    "mean_confidence": round(mean_conf, 3),
                    "line_count": len(text_parts),
                }
    except Exception as err:
        logger.warning(f"RapidOCR extraction warning: {err}")

    return {
        "text": "",
        "engine": "RapidOCR (ONNX Runtime)",
        "mean_confidence": 0.0,
        "line_count": 0,
    }


def extract_text_from_image(image_base64: str) -> str:
    meta = extract_text_with_metadata(image_base64)
    return meta.get("text", "")


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


_OCR_DIGIT_CONFUSIONS = str.maketrans({
    "I": "1",
    "L": "1",
    "|": "1",
    "O": "0",
    "S": "5",
    "Z": "2",
})

_FUNCTIONAL_ADDITIVE_CLASSES = (
    r"(?:emulsifiers?|colors?|colours?|colouring|coloring|antioxidants?|preservatives?|"
    r"stabilizers?|stabilisers?|thickeners?|acidity\s+regulators?|acidulants?|acids?|"
    r"flavou?r\s+enhancers?|humectants?|raising\s+agents?|glazing\s+agents?|"
    r"sweeteners?|firming\s+agents?|anti[-\s]?caking\s+agents?|bulking\s+agents?|"
    r"gelling\s+agents?|flour\s+treatment\s+agents?|sequestrants?)"
)


def _clean_ocr_ecode_token(raw_code: str) -> str:
    """
    Repairs OCR character-digit confusions inside E/INS numbers (e.g., '47I' -> '471', '12O' -> '120')
    while preserving valid trailing sub-letters (a-f, i, ii) such as E472e or E150d.
    """
    token = raw_code.strip().upper()
    if not token:
        return ""
    # If the first 3 characters contain OCR confusions, repair them; check if trailing char is a valid suffix or a misread digit
    if len(token) >= 3:
        prefix = token[:3].translate(_OCR_DIGIT_CONFUSIONS)
        suffix = token[3:]
        # In 3-digit E-numbers (e.g. E471 misread as E47I where token is '47I'), all 3 chars should be digits
        if len(token) == 3 and prefix.isdigit():
            return f"E{prefix}"
        if prefix.isdigit():
            # Valid trailing sub-letter on 3-digit E-code (e.g. 472E, 150A, 150D, 160A)
            if len(suffix) == 1 and suffix in "ABCDEF":
                return f"E{prefix}{suffix}"
            suffix_fixed = suffix.translate(_OCR_DIGIT_CONFUSIONS)
            if suffix_fixed.isdigit():
                return f"E{prefix}{suffix_fixed}"
    return ""


def find_e_numbers(text: str):
    if not text:
        return []

    cleaned = set()

    # 1. Explicit E-numbers and INS codes (including OCR-corrupted digits like E47I, E12O, INS-471)
    explicit_pattern = r"\b(?:E|INS)\s*[-]?\s*([0-9IL|OSZ]{3,4}[a-fA-F]?)\b"
    for match in re.findall(explicit_pattern, text, flags=re.IGNORECASE):
        fixed = _clean_ocr_ecode_token(match)
        if fixed:
            cleaned.add(fixed)

    # 2. Bare parenthesized or bracketed INS codes preceded by a functional additive class
    # e.g., "Emulsifier (471)", "Emulsifiers (471, 472e)", "Antioxidant (319)", "Color (120)"
    func_pattern = _FUNCTIONAL_ADDITIVE_CLASSES + r"\s*[:\-]?\s*[\(\[]([^\)\]]{3,35})[\)\]]"
    for group_content in re.findall(func_pattern, text, flags=re.IGNORECASE):
        for candidate in re.findall(r"\b(?:E|INS)?\s*[-]?\s*([0-9IL|OSZ]{3,4}[a-fA-F]?)\b", group_content, flags=re.IGNORECASE):
            fixed = _clean_ocr_ecode_token(candidate)
            if fixed:
                cleaned.add(fixed)

    return sorted(cleaned)


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
