import io
import base64
import logging
from pathlib import Path
from typing import Dict, List, Optional
from PIL import Image

logger = logging.getLogger(__name__)

# Human-readable labels for Philippine Accredited Halal Certification Bodies & Seals
CLASS_LABEL_MAPPING = {
    # 15 Philippine-specific classes trained on NCMF, IDCP & accredited certifiers
    "IDCP": "IDCP (Islamic Da'wah Council of the Philippines)",
    "BUSC": "BUSC (Bangsamoro Unity Summit Consultative)",
    "BPCC": "BPCC (Bangsamoro Professional Certification)",
    "MMHCB": "MMHCB (Mindanao Muslim Halal Certification Board)",
    "PUCOI": "PUCOI (Philippine Ulama Congress Organization)",
    "AHIP": "AHIP (Alliance for Halal Integrity in the Phils)",
    "HICCIP": "HICCIP (Halal International Chamber of Commerce & Industries Phils)",
    "MinHA": "MinHA (Mindanao Halal Authority)",
    "PRIME": "PRIME Certification Asia",
    "FIQHI": "FIQHI Islamic Certification",
    "HDIP": "HDIP (Halal Development Institute of the Philippines)",
    "MASLAHA": "MASLAHA Halal Certification",
    "Philcosed": "PHILCOSED Halal Certification",
    "NCMF_General": "NCMF Official Halal Seal (Philippines)",
    "National_Halal_Logo": "Philippine National Halal Seal (DTI / NCMF)",
    "Thailand_CICOT": "Thailand Halal - CICOT (Recognized Foreign Certifier)",
    "Malaysia_JAKIM": "Malaysia Halal - JAKIM (Recognized Foreign Certifier)",
    "Indonesia_BPJPH": "Indonesia Halal - BPJPH / MUI (Recognized Foreign Certifier)",
    "Invalid_Logo": "Unrecognized / Suspected Counterfeit Logo",
    # Backward compatibility with legacy SEA classes
    "Philippines1": "Philippine National Halal Seal (DTI / NCMF)",
    "Philippines2": "IDCP Halal (Philippines)",
    "Philippines3": "HDIP Halal (Philippines)",
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
    from app.ocr_service import safe_load_pil_image
    return safe_load_pil_image(image_base64)


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
    except Exception as err:
        logger.warning(f"Image decode failed in logo detection: {err}")
        return _empty_logo_result(f"Invalid image format: {err}")

    try:
        model = get_yolo_model()
        if model is None:
            return _empty_logo_result("YOLOv8 model not loaded")

        # Run inference (standard YOLO conf threshold 0.25 for real-world phone scans)
        results = model(image, conf=0.25, imgsz=640, verbose=False)
        if not results or len(results) == 0:
            return _empty_logo_result("No detections returned")

        result = results[0]
        boxes = result.boxes

        img_w, img_h = image.size

        if boxes is None or len(boxes) == 0:
            return {
                "logoDetected": False,
                "logoConfidence": 0.0,
                "logoBody": "No Halal Logo Detected",
                "isInvalidLogo": False,
                "detectedLogos": [],
                "imageWidth": img_w,
                "imageHeight": img_h,
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
            is_invalid = raw_class_name.lower() in ("invalid_logo", "counterfeit")

            xyxy = box.xyxy[0].tolist()
            normalized_box = [round(coord, 2) for coord in xyxy]
            norm_pct_box = [
                max(0.0, min(1.0, round(xyxy[0] / img_w, 4))),
                max(0.0, min(1.0, round(xyxy[1] / img_h, 4))),
                max(0.0, min(1.0, round(xyxy[2] / img_w, 4))),
                max(0.0, min(1.0, round(xyxy[3] / img_h, 4))),
            ]

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
                "norm_box": norm_pct_box,
            })

        # Sort detections by confidence descending
        detected_logos.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "logoDetected": True,
            "logoConfidence": round(highest_conf * 100, 1),
            "logoBody": best_logo_body,
            "isInvalidLogo": has_invalid,
            "detectedLogos": detected_logos,
            "bestBox": detected_logos[0]["norm_box"] if detected_logos else None,
            "imageWidth": img_w,
            "imageHeight": img_h,
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
