import io
import base64
import logging
from pathlib import Path
from typing import Dict, List, Optional
from PIL import Image

logger = logging.getLogger(__name__)

# Human-readable labels for Sea Halal Logo v3 classes
CLASS_LABEL_MAPPING = {
    "Philippines1": "IDCP Halal (Philippines)",
    "Philippines2": "HDIP Halal (Philippines)",
    "Philippines3": "Accredited Halal Mark (Philippines)",
    "Malaysia": "JAKIM Halal (Malaysia)",
    "Singapore": "MUIS Halal (Singapore)",
    "Indonesia_new": "BPJPH Halal (Indonesia)",
    "Indonesia_old": "MUI Halal (Indonesia)",
    "Brunei": "MUIB Halal (Brunei)",
    "Thailand": "CICOT Halal (Thailand)",
    "Vietnam": "Hao Halal (Vietnam)",
    "Cambodia": "Halal Cambodia",
    "Invalid_logo": "Unrecognized / Suspected Counterfeit Logo",
}

_yolo_model = None


def get_model_path() -> Optional[Path]:
    primary_path = Path(__file__).resolve().parent / "models" / "halal_logo_yolov8n.pt"
    if primary_path.exists():
        return primary_path

    # Fallback to Spike S2 run output
    repo_root = Path(__file__).resolve().parents[2]
    fallback_path = repo_root / "runs" / "detect" / "runs" / "spike_s2" / "halal_logo_yolov8n" / "weights" / "best.pt"
    if fallback_path.exists():
        return fallback_path

    return None


def get_yolo_model():
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    model_path = get_model_path()
    if not model_path:
        logger.warning("YOLOv8 Halal Logo model weights not found. Logo detection will be disabled.")
        return None

    try:
        from ultralytics import YOLO
        logger.info(f"Loading YOLOv8 Halal Logo model from {model_path}...")
        _yolo_model = YOLO(str(model_path))
        return _yolo_model
    except Exception as e:
        logger.error(f"Failed to load YOLOv8 model: {e}")
        return None


def decode_image_base64(image_base64: str) -> Image.Image:
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes))
    return image.convert("RGB")


def detect_halal_logo(image_input) -> Dict:
    """
    Detects accredited Halal certification logos on product packaging using YOLOv8-Nano.
    Returns detected logo details, confidence score, certifying body, and counterfeit flags.
    """
    try:
        if isinstance(image_input, str):
            image = decode_image_base64(image_input)
        elif isinstance(image_input, Image.Image):
            image = image_input
        else:
            return _empty_logo_result("Invalid image input type")

        model = get_yolo_model()
        if model is None:
            return _empty_logo_result("YOLOv8 model not loaded")

        # Run inference (conf threshold 0.35)
        results = model(image, conf=0.35, imgsz=640, verbose=False)
        if not results or len(results) == 0:
            return _empty_logo_result("No detections returned")

        result = results[0]
        boxes = result.boxes

        if boxes is None or len(boxes) == 0:
            return {
                "logoDetected": False,
                "logoConfidence": 0.0,
                "logoBody": "No Halal Logo Detected",
                "isInvalidLogo": False,
                "detectedLogos": [],
            }

        detected_logos: List[Dict] = []
        highest_conf = 0.0
        best_logo_body = "Accredited Halal Logo"
        has_invalid = False

        for box in boxes:
            conf = float(box.conf[0].item())
            cls_id = int(box.cls[0].item())
            raw_class_name = model.names.get(cls_id, f"class_{cls_id}")
            formatted_name = CLASS_LABEL_MAPPING.get(raw_class_name, raw_class_name)
            is_invalid = raw_class_name == "Invalid_logo"

            xyxy = box.xyxy[0].tolist()
            normalized_box = [round(coord, 2) for coord in xyxy]

            if is_invalid:
                has_invalid = True

            if conf > highest_conf:
                highest_conf = conf
                best_logo_body = formatted_name

            detected_logos.append({
                "class_id": cls_id,
                "class_name": raw_class_name,
                "label": formatted_name,
                "confidence": round(conf * 100, 1),
                "is_invalid": is_invalid,
                "box": normalized_box,
            })

        # Sort detections by confidence descending
        detected_logos.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "logoDetected": True,
            "logoConfidence": round(highest_conf * 100, 1),
            "logoBody": best_logo_body,
            "isInvalidLogo": has_invalid,
            "detectedLogos": detected_logos,
        }

    except Exception as e:
        logger.error(f"Error during logo detection inference: {e}")
        return _empty_logo_result(f"Error: {str(e)}")


def _empty_logo_result(reason: str) -> Dict:
    return {
        "logoDetected": False,
        "logoConfidence": 0.0,
        "logoBody": "Not Detected",
        "isInvalidLogo": False,
        "detectedLogos": [],
        "note": reason,
    }
