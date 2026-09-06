from typing import Optional
from app.auth import get_current_user, require_admin
from app.schemas.issue_reports import IssueReportCreate
from app.supabase_client import supabase
from fastapi import APIRouter, Depends, HTTPException, Query

router = APIRouter(tags=["issue-reports"])


@router.post("/reports/submit")
@router.post("/api/v1/reports/submit")
@router.post("/issue-reports")
def submit_issue_report(
    report: IssueReportCreate,
    user: dict = Depends(get_current_user),
):
    """
    Authenticated issue reporting and non-compliance flagging endpoint.
    Restricted behind user authentication to prevent spam while tracking user submissions.
    """
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Valid user authentication required to submit a report")

    payload = {
        "user_id": str(user_id),
        "issue_type": report.issue_type.strip(),
        "related_to": report.related_to or "product",
        "subject_name": report.subject_name.strip() if report.subject_name else None,
        "product_id": report.product_id,
        "establishment_id": report.establishment_id,
        "evidence_url": report.evidence_url,
        "description": report.description.strip(),
        "status": "open",
    }
    clean_payload = {k: v for k, v in payload.items() if v is not None}

    response = (
        supabase
        .table("issue_reports")
        .insert(clean_payload)
        .execute()
    )

    created_report = response.data[0] if response.data else None
    if not created_report:
        raise HTTPException(status_code=500, detail="Failed to log issue report")

    return {
        "success": True,
        "message": "Report submitted successfully and queued for admin review.",
        "data": created_report,
    }


@router.get("/reports")
@router.get("/api/v1/reports")
@router.get("/issue-reports")
def get_issue_reports(
    status: Optional[str] = Query(None, description="Filter by report status ('open', 'resolved', 'dismissed')"),
    user: dict = Depends(require_admin),
):
    """
    Admin endpoint to inspect submitted community issue reports and flags.
    """
    builder = supabase.table("issue_reports").select("*").order("created_at", desc=True)
    if status:
        builder = builder.eq("status", status)

    response = builder.execute()
    return {
        "success": True,
        "data": response.data or [],
    }

