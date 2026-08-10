from app.utils.db_helpers import count_by_status, fetch_table_rows
from fastapi import APIRouter

router = APIRouter(tags=["summaries"])


@router.get("/dashboard-summary")
def get_dashboard_summary():
    additives = fetch_table_rows("additives")
    establishments = fetch_table_rows("establishments")
    scan_history = fetch_table_rows("scan_history")
    issue_reports = fetch_table_rows("issue_reports")

    label_scans = [scan for scan in scan_history if scan.get("mode") == "label"]
    certificate_scans = [scan for scan in scan_history if scan.get("mode") == "certificate"]
    flagged_additives = [
        item for item in additives
        if item.get("status") in ["Haram", "Doubtful", "Needs Review"]
    ]
    open_reports = [
        report for report in issue_reports
        if report.get("status") in ["open", "reviewing"]
    ]

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


@router.get("/analytics-summary")
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
