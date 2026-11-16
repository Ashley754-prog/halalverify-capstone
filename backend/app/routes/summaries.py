from app.auth import extract_user_id, get_current_user, is_admin_user, require_admin
from app.routes.products import EXCLUDED_UNVERIFIED_STATUSES_LOWER
from app.routes.registry import EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES
from app.utils.db_helpers import count_by_status, fetch_table_rows, strip_private_fields
from fastapi import APIRouter, Depends

router = APIRouter(tags=["summaries"])


@router.get("/dashboard-summary")
def get_dashboard_summary(user: dict = Depends(get_current_user)):
    user_id = extract_user_id(user)
    is_admin = is_admin_user(user_id)

    additives = fetch_table_rows("additives")
    establishments = fetch_table_rows("establishments")
    products = fetch_table_rows("products")
    manufacturers = fetch_table_rows("manufacturers")
    certifiers = fetch_table_rows("certifying_bodies")
    scan_history = fetch_table_rows("scan_history")
    issue_reports = fetch_table_rows("issue_reports") if is_admin else []

    visible_establishments = (
        establishments
        if is_admin
        else [
            e for e in establishments
            if (e.get("halal_status") or "").strip().lower() not in EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES
        ]
    )
    visible_products = (
        products
        if is_admin
        else [
            p for p in products
            if (p.get("status") or "").strip().lower() not in EXCLUDED_UNVERIFIED_STATUSES_LOWER
        ]
    )

    # Regular users only see their own scan history; admins view system-wide scans
    scoped_scans = scan_history if is_admin else [
        s for s in scan_history if str(s.get("user_id") or "") == str(user_id)
    ]

    label_scans = [scan for scan in scoped_scans if scan.get("mode") == "label"]
    certificate_scans = [scan for scan in scoped_scans if scan.get("mode") == "certificate"]
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
                "scans": len(scoped_scans),
                "label_scans": len(label_scans),
                "certificate_scans": len(certificate_scans),
                "additives": len(additives),
                "flagged_additives": len(flagged_additives),
                "establishments": len(visible_establishments),
                "products": len(visible_products),
                "manufacturers": len(manufacturers),
                "certifiers": len(certifiers),
                "open_reports": len(open_reports) if is_admin else 0,
            },
            "breakdowns": {
                "scan_verdicts": count_by_status(scoped_scans, "verdict"),
                "additive_statuses": count_by_status(additives, "status"),
                "establishment_statuses": count_by_status(visible_establishments, "halal_status"),
                "product_statuses": count_by_status(visible_products, "status"),
                "report_statuses": count_by_status(issue_reports, "status") if is_admin else {},
            },
            "latest_scans": strip_private_fields(scoped_scans[:5], is_admin=is_admin),
        },
    }


@router.get("/analytics-summary")
def get_analytics_summary(user: dict = Depends(require_admin)):
    additives = fetch_table_rows("additives")
    establishments = fetch_table_rows("establishments")
    products = fetch_table_rows("products")
    manufacturers = fetch_table_rows("manufacturers")
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
                "products": len(products),
                "manufacturers": len(manufacturers),
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
                "product_statuses": count_by_status(products, "status"),
                "report_statuses": count_by_status(issue_reports, "status"),
            },
        },
    }
