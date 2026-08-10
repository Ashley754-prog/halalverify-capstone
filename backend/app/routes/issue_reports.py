from app.schemas.issue_reports import IssueReportCreate
from app.supabase_client import supabase
from fastapi import APIRouter

router = APIRouter(tags=["issue-reports"])


@router.post("/issue-reports")
def create_issue_report(report: IssueReportCreate):
    response = (
        supabase
        .table("issue_reports")
        .insert({
            "issue_type": report.issue_type,
            "related_to": report.related_to,
            "subject_name": report.subject_name,
            "description": report.description,
            "status": "open",
        })
        .execute()
    )

    return {
        "success": True,
        "data": response.data,
    }
