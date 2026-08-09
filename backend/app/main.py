from typing import Optional

from app.scan_service import (
    analyze_certificate_image,
    analyze_label_image,
    save_scan_history,
)
from app.supabase_client import supabase
from fastapi import FastAPI, HTTPException
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


class AdditiveCreate(BaseModel):
    code: str
    name: str
    status: str
    source_description: Optional[str] = None
    reason: Optional[str] = None


class AdditiveUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None
    source_description: Optional[str] = None
    reason: Optional[str] = None


class EstablishmentCreate(BaseModel):
    name: str
    type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    halal_status: str = "needs_review"
    certificate_number: Optional[str] = None
    expiry_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EstablishmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    halal_status: Optional[str] = None
    certificate_number: Optional[str] = None
    expiry_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


def model_dump_without_none(model: BaseModel):
    return model.model_dump(exclude_none=True)


def ensure_updated(response, record_type: str):
    if not response.data:
        raise HTTPException(status_code=404, detail=f"{record_type} not found")

    return {
        "success": True,
        "data": response.data[0],
    }


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
    result = analyze_certificate_image(request.imageBase64)
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


@app.post("/registry/additives")
def create_additive(additive: AdditiveCreate):
    response = (
        supabase
        .table("additives")
        .insert(model_dump_without_none(additive))
        .execute()
    )

    return {
        "success": True,
        "data": response.data[0] if response.data else None,
    }


@app.patch("/registry/additives/{additive_id}")
def update_additive(additive_id: str, additive: AdditiveUpdate):
    payload = model_dump_without_none(additive)

    if not payload:
        raise HTTPException(status_code=400, detail="No additive fields to update")

    response = (
        supabase
        .table("additives")
        .update(payload)
        .eq("id", additive_id)
        .execute()
    )

    return ensure_updated(response, "Additive")


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


@app.post("/registry/establishments")
def create_establishment(establishment: EstablishmentCreate):
    response = (
        supabase
        .table("establishments")
        .insert(model_dump_without_none(establishment))
        .execute()
    )

    return {
        "success": True,
        "data": response.data[0] if response.data else None,
    }


@app.patch("/registry/establishments/{establishment_id}")
def update_establishment(establishment_id: str, establishment: EstablishmentUpdate):
    payload = model_dump_without_none(establishment)

    if not payload:
        raise HTTPException(status_code=400, detail="No establishment fields to update")

    response = (
        supabase
        .table("establishments")
        .update(payload)
        .eq("id", establishment_id)
        .execute()
    )

    return ensure_updated(response, "Establishment")



def fetch_table_rows(table_name: str):
    response = supabase.table(table_name).select("*").execute()
    return response.data or []


def count_by_status(rows, field_name: str):
    counts = {}

    for row in rows:
        status = row.get(field_name) or "unknown"
        counts[status] = counts.get(status, 0) + 1

    return counts


@app.get("/dashboard-summary")
def get_dashboard_summary():
    additives = fetch_table_rows("additives")
    establishments = fetch_table_rows("establishments")
    scan_history = fetch_table_rows("scan_history")
    issue_reports = fetch_table_rows("issue_reports")

    label_scans = [scan for scan in scan_history if scan.get("mode") == "label"]
    certificate_scans = [scan for scan in scan_history if scan.get("mode") == "certificate"]
    flagged_additives = [item for item in additives if item.get("status") in ["Haram", "Doubtful", "Needs Review"]]
    open_reports = [report for report in issue_reports if report.get("status") in ["open", "reviewing"]]

    return {
        "success": True,
        "data": {
            "totals": {
                "scans": len(scan_history),
                "label_scans": len(label_scans),
                "certificate_scans": len(certificate_scans),
                "additives": len(additives),
                "flagged_additives": len(flagged_additives),
                "establishments": len(establishments),
                "open_reports": len(open_reports),
            },
            "breakdowns": {
                "scan_verdicts": count_by_status(scan_history, "verdict"),
                "additive_statuses": count_by_status(additives, "status"),
                "establishment_statuses": count_by_status(establishments, "halal_status"),
                "report_statuses": count_by_status(issue_reports, "status"),
            },
            "latest_scans": scan_history[:5],
        },
    }



@app.get("/analytics-summary")
def get_analytics_summary():
    additives = fetch_table_rows("additives")
    establishments = fetch_table_rows("establishments")
    scan_history = fetch_table_rows("scan_history")
    issue_reports = fetch_table_rows("issue_reports")

    total_scans = len(scan_history)
    average_confidence = 0

    if total_scans:
        confidence_total = sum(float(scan.get("confidence") or 0) for scan in scan_history)
        average_confidence = round((confidence_total / total_scans) * 100, 1)

    high_confidence_scans = [
        scan for scan in scan_history
        if float(scan.get("confidence") or 0) >= 0.8
    ]

    return {
        "success": True,
        "data": {
            "totals": {
                "scans": total_scans,
                "label_scans": len([scan for scan in scan_history if scan.get("mode") == "label"]),
                "certificate_scans": len([scan for scan in scan_history if scan.get("mode") == "certificate"]),
                "additives": len(additives),
                "establishments": len(establishments),
                "issue_reports": len(issue_reports),
            },
            "quality": {
                "average_confidence": average_confidence,
                "high_confidence_scans": len(high_confidence_scans),
            },
            "breakdowns": {
                "scan_verdicts": count_by_status(scan_history, "verdict"),
                "scan_modes": count_by_status(scan_history, "mode"),
                "additive_statuses": count_by_status(additives, "status"),
                "establishment_statuses": count_by_status(establishments, "halal_status"),
                "report_statuses": count_by_status(issue_reports, "status"),
            },
        },
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
