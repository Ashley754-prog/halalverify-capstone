import ast
import base64
import gc
import logging
from pathlib import Path
from typing import Dict, List, Optional
import numpy as np
from PIL import Image

try:
    import onnxruntime as ort
except ImportError:
    ort = None

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
    "HICCIP": "HICCIP (Halal International Chamber of Commerce and Industries Phils)",
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

FALLBACK_CLASS_NAMES = {
    0: "IDCP",
    1: "HDIP",
    2: "National_Halal_Logo",
    3: "BUSC",
    4: "BPCC",
    5: "MMHCB",
    6: "PUCOI",
    7: "AHIP",
    8: "HICCIP",
    9: "MinHA",
    10: "PRIME",
    11: "FIQHI",
    12: "MASLAHA",
    13: "Philcosed",
    14: "NCMF_General",
    15: "Thailand_CICOT",
    16: "Malaysia_JAKIM",
    17: "Indonesia_BPJPH",
    18: "Invalid_Logo",
}

_onnx_session = None
_class_names = {}


def get_model_path() -> Optional[Path]:
    onnx_path = Path(__file__).resolve().parent / "models" / "halal_logo_yolov8n.onnx"
    if onnx_path.exists():
        return onnx_path

    pt_path = Path(__file__).resolve().parent / "models" / "halal_logo_yolov8n.pt"
    if pt_path.exists():
        return pt_path

    repo_root = Path(__file__).resolve().parents[2]
    fallback_path = repo_root / "runs" / "detect" / "runs" / "spike_s2" / "halal_logo_yolov8n" / "weights" / "best.pt"
    if fallback_path.exists():
        return fallback_path

    return None


def get_yolo_model():
    """Returns the loaded ONNX inference session (and cached class names)."""
    global _onnx_session, _class_names
    if _onnx_session is not None:
        return _onnx_session

    if ort is None:
        logger.warning("onnxruntime is not installed. Logo detection will be disabled.")
        return None

    model_path = get_model_path()
    if not model_path:
        logger.warning("Halal Logo model weights not found. Logo detection will be disabled.")
        return None

    try:
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        session = ort.InferenceSession(str(model_path), sess_options=opts, providers=["CPUExecutionProvider"])

        # Extract embedded class labels from metadata
        meta = session.get_modelmeta().custom_metadata_map
        if "names" in meta:
            try:
                parsed = ast.literal_eval(meta["names"])
                _class_names = {int(k): str(v) for k, v in parsed.items()}
            except Exception:
                _class_names = FALLBACK_CLASS_NAMES
        else:
            _class_names = FALLBACK_CLASS_NAMES

        _onnx_session = session
        logger.info(f"YOLOv8 ONNX model loaded from {model_path} with {len(_class_names)} classes.")
        return _onnx_session
    except Exception as e:
        logger.error(f"Failed to load ONNX model: {e}")
        return None


def decode_image_base64(image_base64: str) -> Image.Image:
    from app.ocr_service import safe_load_pil_image
    return safe_load_pil_image(image_base64)


def nms_numpy(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float = 0.45) -> List[int]:
    """Pure NumPy Non-Maximum Suppression (no torch dependency)."""
    if len(boxes) == 0:
        return []
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    areas = np.maximum(0.0, x2 - x1) * np.maximum(0.0, y2 - y1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(int(i))
        if order.size == 1:
            break
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        union = areas[i] + areas[order[1:]] - inter
        iou = inter / np.maximum(union, 1e-6)
        inds = np.where(iou <= iou_threshold)[0]
        order = order[inds + 1]
    return keep


def detect_halal_logo(image_input) -> Dict:
    """
    Detects accredited Halal certification logos on product packaging using YOLOv8-Nano (pure ONNX Runtime).
    Returns detected logo details, confidence score, certifying body, and counterfeit flags.
    Executes in under 15ms with ultra-low memory footprint.
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
        session = get_yolo_model()
        if session is None:
            return _empty_logo_result("YOLOv8 ONNX model not loaded")

        orig_w, orig_h = image.size

        # Preprocess: resize to 256x256, normalize [0, 1], transpose to (1, 3, 256, 256)
        resized = image.resize((256, 256), Image.Resampling.BILINEAR)
        arr = np.array(resized, dtype=np.float32) / 255.0
        arr = np.transpose(arr, (2, 0, 1))
        input_tensor = np.expand_dims(arr, axis=0)

        # Run ONNX inference
        outputs = session.run(["output0"], {"images": input_tensor})
        pred = outputs[0][0].T  # Shape: (1344, 23)

        # First 4 columns: cx, cy, w, h on 256x256 frame
        cx = pred[:, 0]
        cy = pred[:, 1]
        w = pred[:, 2]
        h = pred[:, 3]

        x1 = cx - w / 2.0
        y1 = cy - h / 2.0
        x2 = cx + w / 2.0
        y2 = cy + h / 2.0

        # Next 19 columns: class confidence scores
        class_scores = pred[:, 4:]
        best_class_ids = np.argmax(class_scores, axis=1)
        best_scores = np.max(class_scores, axis=1)

        # Filter by 0.25 confidence threshold
        mask = best_scores >= 0.25
        if not np.any(mask):
            return {
                "logoDetected": False,
                "logoConfidence": 0.0,
                "logoBody": "No Halal Logo Detected",
                "isInvalidLogo": False,
                "detectedLogos": [],
                "imageWidth": orig_w,
                "imageHeight": orig_h,
            }

        filtered_x1 = x1[mask]
        filtered_y1 = y1[mask]
        filtered_x2 = x2[mask]
        filtered_y2 = y2[mask]
        filtered_scores = best_scores[mask]
        filtered_class_ids = best_class_ids[mask]

        # Rescale coordinates to original image dimensions
        scale_x = orig_w / 256.0
        scale_y = orig_h / 256.0

        rescaled_boxes = np.stack([
            filtered_x1 * scale_x,
            filtered_y1 * scale_y,
            filtered_x2 * scale_x,
            filtered_y2 * scale_y
        ], axis=1)

        keep_indices = nms_numpy(rescaled_boxes, filtered_scores, iou_threshold=0.45)

        if not keep_indices:
            return {
                "logoDetected": False,
                "logoConfidence": 0.0,
                "logoBody": "No Halal Logo Detected",
                "isInvalidLogo": False,
                "detectedLogos": [],
                "imageWidth": orig_w,
                "imageHeight": orig_h,
            }

        detected_logos: List[Dict] = []
        highest_conf = 0.0
        best_logo_body = "Accredited Halal Logo"
        has_invalid = False

        for idx in keep_indices:
            box = rescaled_boxes[idx]
            conf = float(filtered_scores[idx])
            cls_id = int(filtered_class_ids[idx])
            raw_class_name = _class_names.get(cls_id, FALLBACK_CLASS_NAMES.get(cls_id, f"class_{cls_id}"))
            formatted_name = CLASS_LABEL_MAPPING.get(raw_class_name, raw_class_name)
            is_invalid = raw_class_name.lower() in ("invalid_logo", "counterfeit")

            bx1 = max(0.0, min(float(orig_w), float(box[0])))
            by1 = max(0.0, min(float(orig_h), float(box[1])))
            bx2 = max(0.0, min(float(orig_w), float(box[2])))
            by2 = max(0.0, min(float(orig_h), float(box[3])))

            normalized_box = [round(bx1, 2), round(by1, 2), round(bx2, 2), round(by2, 2)]
            norm_pct_box = [
                max(0.0, min(1.0, round(bx1 / orig_w, 4))),
                max(0.0, min(1.0, round(by1 / orig_h, 4))),
                max(0.0, min(1.0, round(bx2 / orig_w, 4))),
                max(0.0, min(1.0, round(by2 / orig_h, 4))),
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

        detected_logos.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "logoDetected": True,
            "logoConfidence": round(highest_conf * 100, 1),
            "logoBody": best_logo_body,
            "isInvalidLogo": has_invalid,
            "detectedLogos": detected_logos,
            "bestBox": detected_logos[0]["norm_box"] if detected_logos else None,
            "imageWidth": orig_w,
            "imageHeight": orig_h,
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
