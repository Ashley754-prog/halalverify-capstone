from app.supabase_client import supabase
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.api_route("/health", methods=["GET", "HEAD"])
def health_check() -> dict:
    import os
    return {
        "status": "ok",
        "service": "HalalVerify API",
        "version": "onnx-cloud-v2",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY", "").strip()),
    }


@router.api_route("/", methods=["GET", "HEAD"])
def root_check() -> dict:
    return {
        "status": "ok",
        "service": "HalalVerify API",
    }



@router.get("/test-supabase")
def test_supabase():
    response = supabase.table("additives").select("*").limit(5).execute()

    return {
        "success": True,
        "data": response.data,
    }


@router.get("/test-ai")
def test_ai():
    import time
    from PIL import Image, ImageDraw
    import numpy as np

    t0 = time.time()
    img = Image.new("RGB", (300, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 30), "TEST E471 CITRIC ACID", fill=(0, 0, 0))

    t_yolo_start = time.time()
    yolo_err = None
    yolo_res = None
    try:
        from app.logo_service import detect_halal_logo
        yolo_res = detect_halal_logo(img)
    except Exception as e:
        yolo_err = str(e)
    yolo_ms = round((time.time() - t_yolo_start) * 1000, 1)

    t_ocr_start = time.time()
    ocr_err = None
    ocr_text = ""
    try:
        from app.ocr_service import get_rapid_ocr
        engine = get_rapid_ocr()
        if engine:
            res, _ = engine(np.array(img))
            if res:
                ocr_text = " ".join([line[1] for line in res])
    except Exception as e:
        ocr_err = str(e)
    ocr_ms = round((time.time() - t_ocr_start) * 1000, 1)

    return {
        "status": "ok",
        "yolo": {"ms": yolo_ms, "error": yolo_err, "detected": yolo_res.get("logoDetected") if yolo_res else False},
        "ocr": {"ms": ocr_ms, "error": ocr_err, "text": ocr_text},
        "total_ms": round((time.time() - t0) * 1000, 1),
    }


@router.get("/test-gemini")
def test_gemini_endpoint():
    import time
    from PIL import Image, ImageDraw
    import io, base64

    img = Image.new("RGB", (400, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 20), "TEST E471 CITRIC ACID", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode()

    t0 = time.time()
    try:
        from app.ocr_service import extract_text_with_gemini
        text = extract_text_with_gemini(f"data:image/jpeg;base64,{b64}")
        return {
            "status": "ok",
            "extracted": text,
            "latency_ms": round((time.time() - t0) * 1000, 1),
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "latency_ms": round((time.time() - t0) * 1000, 1),
        }


@router.get("/test-yolo")
def test_yolo_endpoint():
    import time
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (300, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 30), "TEST LOGO", fill=(0, 0, 0))

    t0 = time.time()
    try:
        from app.logo_service import detect_halal_logo
        res = detect_halal_logo(img)
        return {
            "status": "ok",
            "yolo_result": res,
            "latency_ms": round((time.time() - t0) * 1000, 1),
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "latency_ms": round((time.time() - t0) * 1000, 1),
        }
