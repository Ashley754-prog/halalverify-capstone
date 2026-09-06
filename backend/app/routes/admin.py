import datetime
from typing import Optional

from app.auth import require_admin
from app.schemas.admin import (
    EstablishmentVerifyRequest,
    ProductVerifyRequest,
    ReportResolveRequest,
)
from app.supabase_client import supabase
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/pending-approvals")
def get_pending_approvals(user: dict = Depends(require_admin)):
    """
    Fetches pending establishment entries, community-submitted products,
    and open user-flagged issue reports for administrative anti-fraud review.
    """
    try:
        # 1. Fetch pending establishments
        est_res = (
            supabase.table("establishments")
            .select("*, certifying_bodies(*)")
            .or_("halal_status.ilike.%pending%,halal_status.ilike.%review%,halal_status.ilike.%needs_review%")
            .order("created_at", desc=True)
            .execute()
        )
        pending_establishments = est_res.data or []

        # If associated products exist, attach them
        if pending_establishments:
            est_ids = [e["id"] for e in pending_establishments if e.get("id")]
            if est_ids:
                try:
                    p_res = (
                        supabase.table("products")
                        .select("id, name, category, status, establishment_id")
                        .in_("establishment_id", est_ids)
                        .execute()
                    )
                    prod_map = {}
                    for p in (p_res.data or []):
                        eid = p.get("establishment_id")
                        if eid:
                            prod_map.setdefault(eid, []).append(p)
                    for e in pending_establishments:
                        e["associated_products"] = prod_map.get(e["id"], [])
                except Exception as p_err:
                    print(f"Warning: attaching products to pending establishments failed: {p_err}")

        # 2. Fetch pending standalone community products
        prod_res = (
            supabase.table("products")
            .select("*, establishments(id, name, city)")
            .ilike("status", "%pending%")
            .order("created_at", desc=True)
            .execute()
        )
        pending_products = prod_res.data or []

        # 3. Fetch open / reviewing user issue reports
        rep_res = (
            supabase.table("issue_reports")
            .select("*, products(id, name), establishments(id, name, city)")
            .or_("status.eq.open,status.eq.reviewing")
            .order("created_at", desc=True)
            .execute()
        )
        open_reports = rep_res.data or []

        return {
            "success": True,
            "counts": {
                "establishments": len(pending_establishments),
                "products": len(pending_products),
                "reports": len(open_reports),
                "total": len(pending_establishments) + len(pending_products) + len(open_reports),
            },
            "data": {
                "establishments": pending_establishments,
                "products": pending_products,
                "reports": open_reports,
            },
        }
    except Exception as e:
        print(f"Error fetching pending approvals: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending approvals: {str(e)}")


@router.patch("/establishments/{establishment_id}/verify")
def verify_establishment(
    establishment_id: str,
    payload: EstablishmentVerifyRequest,
    user: dict = Depends(require_admin),
):
    """
    Administrative audit action to approve (VERIFIED) or reject (REJECTED) an establishment.
    Cross-matches issuing HCB credentials and updates audit notes.
    """
    user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    status_clean = payload.status.strip().lower()
    if status_clean not in ["verified", "rejected", "suspended", "flagged"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Must be 'VERIFIED', 'REJECTED', or 'SUSPENDED'.",
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    update_fields = {
        "halal_status": status_clean,
        "admin_notes": payload.admin_notes or "",
        "verified_at": now_iso,
        "verified_by": str(user_id) if user_id else None,
    }

    if payload.certificate_number:
        update_fields["certificate_number"] = payload.certificate_number.strip()
    if payload.expiry_date:
        update_fields["expiry_date"] = payload.expiry_date.strip()
    if payload.certifying_body_id:
        update_fields["certifying_body_id"] = payload.certifying_body_id.strip()

    res = (
        supabase.table("establishments")
        .update(update_fields)
        .eq("id", establishment_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Establishment not found or update failed")

    # If approved, also approve linked pending products
    if status_clean == "verified":
        try:
            supabase.table("products").update({
                "status": "VERIFIED",
                "verified_at": now_iso,
                "verified_by": str(user_id) if user_id else None,
            }).eq("establishment_id", establishment_id).ilike("status", "%pending%").execute()
        except Exception as p_err:
            print(f"Warning: cascaded product approval notice: {p_err}")

    return {
        "success": True,
        "message": f"Establishment marked as {payload.status.upper()}.",
        "data": res.data[0],
    }


@router.patch("/products/{product_id}/verify")
def verify_product(
    product_id: str,
    payload: ProductVerifyRequest,
    user: dict = Depends(require_admin),
):
    """
    Administrative audit action to approve (VERIFIED) or reject (REJECTED) a community product.
    """
    user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    status_clean = payload.status.strip().upper()
    if status_clean not in ["VERIFIED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be 'VERIFIED' or 'REJECTED'")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    update_fields = {
        "status": status_clean,
        "admin_notes": payload.admin_notes or "",
        "verified_at": now_iso,
        "verified_by": str(user_id) if user_id else None,
    }

    res = (
        supabase.table("products")
        .update(update_fields)
        .eq("id", product_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Product not found or update failed")

    return {
        "success": True,
        "message": f"Product marked as {status_clean}.",
        "data": res.data[0],
    }


@router.patch("/reports/{report_id}/resolve")
def resolve_issue_report(
    report_id: str,
    payload: ReportResolveRequest,
    user: dict = Depends(require_admin),
):
    """
    Administrative moderation action to resolve or dismiss a user-flagged issue report.
    Optionally flags/suspends the establishment if violation is verified.
    """
    user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    status_clean = payload.status.strip().lower()
    if status_clean not in ["resolved", "dismissed", "reviewing"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be 'resolved', 'dismissed', or 'reviewing'",
        )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    update_fields = {
        "status": status_clean,
        "resolution_notes": payload.resolution_notes or "",
        "resolved_at": now_iso,
        "resolved_by": str(user_id) if user_id else None,
    }

    res = (
        supabase.table("issue_reports")
        .update(update_fields)
        .eq("id", report_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Issue report not found or update failed")

    resolved_report = res.data[0]

    # If the admin verified a critical violation and flagged/suspended the establishment
    if payload.suspend_establishment and resolved_report.get("establishment_id"):
        est_id = resolved_report["establishment_id"]
        try:
            supabase.table("establishments").update({
                "halal_status": "flagged",
                "admin_notes": f"Suspended via report #{report_id}: {payload.resolution_notes or ''}",
                "verified_at": now_iso,
                "verified_by": str(user_id) if user_id else None,
            }).eq("id", est_id).execute()
        except Exception as s_err:
            print(f"Warning: suspending establishment failed: {s_err}")

    return {
        "success": True,
        "message": f"Issue report marked as {status_clean.capitalize()}.",
        "data": resolved_report,
    }
