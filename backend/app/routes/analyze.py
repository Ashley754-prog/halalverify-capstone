from app.auth import get_optional_current_user
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
    user=Depends(get_optional_current_user),
) -> dict:
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    result = analyze_label_image(request.imageBase64)
    save_scan_history("label", result, user_id=str(user_id) if user_id else None)
    return result


@router.post("/analyze/certificate")
def analyze_certificate(
    request: AnalyzeRequest,
    user=Depends(get_optional_current_user),
) -> dict:
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    result = analyze_certificate_image(request.imageBase64)
    save_scan_history("certificate", result, user_id=str(user_id) if user_id else None)
    return result

