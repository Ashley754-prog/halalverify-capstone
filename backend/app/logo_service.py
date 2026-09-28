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


def _run_yolo_onnx_pass(session, img_pil: Image.Image, offset_x: float = 0.0, offset_y: float = 0.0, conf_threshold: float = 0.20):
    """Executes a single letterboxed YOLOv8 ONNX pass on an image/ROI preserving aspect ratio."""
    # Read model input dimensions dynamically
    input_shape = session.get_inputs()[0].shape
    target_h = input_shape[2] if len(input_shape) > 2 and isinstance(input_shape[2], int) else 640
    target_w = input_shape[3] if len(input_shape) > 3 and isinstance(input_shape[3], int) else 640

    w, h = img_pil.size
    r = min(float(target_w) / max(w, 1), float(target_h) / max(h, 1))
    new_w = max(1, int(round(w * r)))
    new_h = max(1, int(round(h * r)))
    pad_w = (float(target_w) - new_w) / 2.0
    pad_h = (float(target_h) - new_h) / 2.0

    resized = img_pil.resize((new_w, new_h), Image.Resampling.BILINEAR)
    canvas = Image.new("RGB", (target_w, target_h), (114, 114, 114))
    canvas.paste(resized, (int(round(pad_w)), int(round(pad_h))))

    arr = np.transpose(np.array(canvas, dtype=np.float32) / 255.0, (2, 0, 1))
    input_tensor = np.expand_dims(arr, axis=0)

    outputs = session.run(["output0"], {"images": input_tensor})
    pred = outputs[0][0].T  # Shape: (8400, 23)

    cx = pred[:, 0]
    cy = pred[:, 1]
    box_w = pred[:, 2]
    box_h = pred[:, 3]

    # Invert letterbox and add ROI crop offsets back to original coordinate space
    x1 = (cx - box_w / 2.0 - pad_w) / r + offset_x
    y1 = (cy - box_h / 2.0 - pad_h) / r + offset_y
    x2 = (cx + box_w / 2.0 - pad_w) / r + offset_x
    y2 = (cy + box_h / 2.0 - pad_h) / r + offset_y

    scores = pred[:, 4:]
    best_c = np.argmax(scores, axis=1)
    best_s = np.max(scores, axis=1)

    mask = best_s >= conf_threshold
    boxes = np.stack([x1[mask], y1[mask], x2[mask], y2[mask]], axis=1) if np.any(mask) else np.empty((0, 4))
    filtered_scores = best_s[mask]
    filtered_cls = best_c[mask]
    return boxes, filtered_scores, filtered_cls


def detect_halal_logo(image_input) -> Dict:
    """
    Detects accredited Halal certification logos on product packaging using YOLOv8-Nano (pure ONNX Runtime).
    Uses aspect-ratio preserving letterboxing and multi-scale reticle ROI inspection.
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

        image = image.convert("RGB")
        orig_w, orig_h = image.size

        # Pass 1: Global Letterboxed Frame
        b1, s1, c1 = _run_yolo_onnx_pass(session, image, 0.0, 0.0, conf_threshold=0.20)
        max_conf1 = float(np.max(s1)) if len(s1) > 0 else 0.0

        b2, s2, c2 = np.empty((0, 4)), np.empty(0), np.empty(0)
        max_conf2 = 0.0
        # Pass 2: Context-Padded Macro Pass (for close-up captures or cropped logos)
        if max_conf1 < 0.75:
            scale = min(1.0, 500.0 / max(orig_w, orig_h))
            sw, sh = max(1, int(round(orig_w * scale))), max(1, int(round(orig_h * scale)))
            scaled_img = image.resize((sw, sh), Image.Resampling.BILINEAR) if scale < 1.0 else image
            pad_dim = int(max(sw, sh) * 2.2)
            bg = Image.new("RGB", (pad_dim, pad_dim), (230, 230, 230))
            px = (pad_dim - sw) // 2
            py = (pad_dim - sh) // 2
            bg.paste(scaled_img, (px, py))
            b2_raw, s2, c2 = _run_yolo_onnx_pass(session, bg, 0.0, 0.0, conf_threshold=0.20)
            if len(b2_raw) > 0:
                bx1 = (b2_raw[:, 0] - px) / scale
                by1 = (b2_raw[:, 1] - py) / scale
                bx2 = (b2_raw[:, 2] - px) / scale
                by2 = (b2_raw[:, 3] - py) / scale
                b2 = np.stack([bx1, by1, bx2, by2], axis=1)
                max_conf2 = float(np.max(s2))

        b3, s3, c3 = np.empty((0, 4)), np.empty(0), np.empty(0)
        # Pass 3: Center Reticle ROI (for wide packaging shots where logo is small inside reticle)
        if max(max_conf1, max_conf2) < 0.75 and max(orig_w, orig_h) >= 400:
            crop_dim = min(orig_w, orig_h) * 0.65
            crop_x = (orig_w - crop_dim) / 2.0
            crop_y = (orig_h - crop_dim) / 2.0
            center_roi = image.crop((crop_x, crop_y, crop_x + crop_dim, crop_y + crop_dim))
            b3, s3, c3 = _run_yolo_onnx_pass(session, center_roi, crop_x, crop_y, conf_threshold=0.20)

        # Select candidate detections based on best detection context
        if max_conf1 >= 0.75:
            candidate_boxes = [b1]
            candidate_scores = [s1]
            candidate_classes = [c1]
        elif max_conf2 >= 0.70:
            candidate_boxes = [b2]
            candidate_scores = [s2]
            candidate_classes = [c2]
        else:
            candidate_boxes = []
            candidate_scores = []
            candidate_classes = []
            for b, s, c in [(b1, s1, c1), (b2, s2, c2), (b3, s3, c3)]:
                if len(b) > 0:
                    candidate_boxes.append(b)
                    candidate_scores.append(s)
                    candidate_classes.append(c)

        if not candidate_boxes:
            return {
                "logoDetected": False,
                "logoConfidence": 0.0,
                "logoBody": "No Halal Logo Detected",
                "isInvalidLogo": False,
                "detectedLogos": [],
                "imageWidth": orig_w,
                "imageHeight": orig_h,
            }

        all_boxes = np.vstack(candidate_boxes)
        all_scores = np.concatenate(candidate_scores)
        all_class_ids = np.concatenate(candidate_classes)

        keep_indices = nms_numpy(all_boxes, all_scores, iou_threshold=0.45)
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
            box = all_boxes[idx]
            conf = float(all_scores[idx])
            cls_id = int(all_class_ids[idx])
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
