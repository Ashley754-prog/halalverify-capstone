import base64
import re
from io import BytesIO

import easyocr
import numpy as np
from PIL import Image


_reader = None


def get_reader():
    global _reader

    if _reader is None:
        _reader = easyocr.Reader(["en"], gpu=False)

    return _reader


def decode_base64_image(image_base64: str):
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    image_bytes = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_bytes)).convert("RGB")

    return np.array(image)


def extract_text_from_image(image_base64: str) -> str:
    image = decode_base64_image(image_base64)
    reader = get_reader()

    results = reader.readtext(image, detail=0)

    return " ".join(results)


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