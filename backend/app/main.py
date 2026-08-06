from typing import Optional

from app.scan_service import (
    analyze_label_image,
    certificate_demo_result,
    save_scan_history,
)
from app.supabase_client import supabase
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="HalalVerify API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    imageBase64: str
    mode: str = "label"


class IssueReportCreate(BaseModel):
    issue_type: str
    related_to: Optional[str] = None
    subject_name: Optional[str] = None
    description: str


@app.get("/health")
def health_check() -> dict:
    return {
        "status": "ok",
        "service": "HalalVerify API",
    }


@app.get("/test-supabase")
def test_supabase():
    response = supabase.table("additives").select("*").limit(5).execute()

    return {
        "success": True,
        "data": response.data,
    }


@app.post("/analyze/label")
def analyze_label(request: AnalyzeRequest) -> dict:
    result = analyze_label_image(request.imageBase64)
    save_scan_history("label", result)
    return result


@app.post("/analyze/certificate")
def analyze_certificate(request: AnalyzeRequest) -> dict:
    result = certificate_demo_result()
    save_scan_history("certificate", result)
    return result


@app.get("/registry/additives")
def get_additives():
    response = (
        supabase
        .table("additives")
        .select("*")
        .order("code")
        .execute()
    )

    return {
        "success": True,
        "data": response.data,
    }


@app.get("/registry/establishments")
def get_establishments():
    response = (
        supabase
        .table("establishments")
        .select("*, certifying_bodies(*)")
        .order("name")
        .execute()
    )

    return {
        "success": True,
        "data": response.data,
    }


@app.post("/issue-reports")
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


@app.get("/scan-history")
def get_scan_history():
    response = (
        supabase
        .table("scan_history")
        .select("*, scan_flagged_items(*)")
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "success": True,
        "data": response.data,
    }
