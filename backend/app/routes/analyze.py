from app.auth import get_current_user
from app.scan_service import (
    analyze_certificate_image,
    analyze_label_image,
    save_scan_history,
)
from app.schemas.analyze import AnalyzeRequest
from fastapi import APIRouter, Depends

router = APIRouter(tags=["analyze"])


@router.post("/analyze/label")
def analyze_label(
    request: AnalyzeRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    result = analyze_label_image(request.imageBase64)
    save_scan_history("label", result)
    return result


@router.post("/analyze/certificate")
def analyze_certificate(
    request: AnalyzeRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    result = analyze_certificate_image(request.imageBase64)
    save_scan_history("certificate", result)
    return result
