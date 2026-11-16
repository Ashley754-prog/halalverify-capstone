import logging
from typing import Any, Dict, Optional
from pydantic import BaseModel

from app.auth import extract_user_id, get_current_user, is_admin_user
from app.scan_service import VERDICT_TO_STATUS
from app.supabase_client import supabase
from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)
router = APIRouter(tags=["scan-history"])


class ScanFusionRequest(BaseModel):
    primary_scan_id: str
    secondary_scan_id: Optional[str] = None
    merged_result: Dict[str, Any]


def _assert_scan_ownership(scan_id: str, user_id: str, is_admin: bool) -> None:
    """Ensure a scan_history row exists and belongs to the authenticated user (or an admin)."""
    res = (
        supabase.table("scan_history")
        .select("id, user_id")
        .eq("id", scan_id)
        .maybe_single()
        .execute()
    )
    row = res.data if res is not None else None
    if not row:
        raise HTTPException(status_code=404, detail="Scan history record not found")
    if not is_admin and str(row.get("user_id") or "") != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this scan record")


@router.get("/scan-history")
@router.get("/api/v1/scan-history")
def get_scan_history(user: dict = Depends(get_current_user)):
    user_id = extract_user_id(user)
    is_admin = is_admin_user(user_id)

    # Non-admins must have a valid user_id and can only view their own scan history
    if not is_admin:
        if not user_id:
            return {
                "success": True,
                "data": [],
            }
        builder = (
            supabase
            .table("scan_history")
            .select("*, scan_flagged_items(*)")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
        )
    else:
        builder = (
            supabase
            .table("scan_history")
            .select("*, scan_flagged_items(*)")
            .order("created_at", desc=True)
        )

    response = builder.execute()

    return {
        "success": True,
        "data": response.data or [],
    }


@router.post("/scan-history/fusion")
@router.post("/api/v1/scan-history/fusion")
def consolidate_fusion_scan(
    request: ScanFusionRequest,
    user=Depends(get_current_user),
):
    """
    Consolidates multi-panel packaging captures (e.g. Front seal + Rear ingredients panel)
    into a single unified scan record in scan_history.
    Overwrites the primary scan record with the fused verdict and removes the redundant secondary record.
    """
    user_id = extract_user_id(user)
    if not user_id:
        raise HTTPException(status_code=401, detail="Valid user credentials required")

    primary_id = request.primary_scan_id
    secondary_id = request.secondary_scan_id
    merged = request.merged_result

    if not primary_id or not merged:
        raise HTTPException(status_code=400, detail="primary_scan_id and merged_result are required")

    is_admin = is_admin_user(user_id)
    _assert_scan_ownership(primary_id, user_id, is_admin)
    if secondary_id:
        _assert_scan_ownership(secondary_id, user_id, is_admin)

    try:
        verdict = VERDICT_TO_STATUS.get(merged.get("verdict"), "Unknown")
        confidence = float(merged.get("logoConfidence", 0.0) or 0.0)
        detected_logo = merged.get("logoBody")
        extracted_text = merged.get("ocrText") or ", ".join(merged.get("ingredientsFound", []))

        total_panels = len(merged.get("images") or [])
        panel_label = f"Product Label Scan ({total_panels} Panels Fused)" if total_panels > 1 else "Product Label Scan (Multi-Panel Fused)"

        update_payload = {
            "verdict": verdict,
            "confidence": confidence,
            "image_name": panel_label,
            "detected_logo": detected_logo,
            "extracted_text": extracted_text,
            "raw_result": merged,
        }

        # 1. Update the primary scan record
        upd_res = (
            supabase
            .table("scan_history")
            .update(update_payload)
            .eq("id", primary_id)
            .execute()
        )

        if not upd_res.data:
            raise HTTPException(status_code=404, detail="Primary scan record not found or update failed")

        # 2. Synchronize scan_flagged_items for the unified primary record
        try:
            supabase.table("scan_flagged_items").delete().eq("scan_id", primary_id).execute()
            if secondary_id:
                supabase.table("scan_flagged_items").delete().eq("scan_id", secondary_id).execute()

            flagged_rows = [
                {
                    "scan_id": primary_id,
                    "additive_id": item.get("additive_id"),
                    "matched_text": item.get("matched_text") or item.get("ingredient"),
                    "status": item.get("status"),
                    "reason": item.get("reason"),
                }
                for item in merged.get("flaggedIngredients", [])
            ]
            if flagged_rows:
                supabase.table("scan_flagged_items").insert(flagged_rows).execute()
        except Exception as flagged_err:
            logger.warning("Error synchronizing flagged items in fusion: %s", flagged_err)

        # 3. Clean up the redundant secondary scan record to prevent ledger duplication
        if secondary_id and secondary_id != primary_id:
            try:
                supabase.table("scan_history").delete().eq("id", secondary_id).execute()
            except Exception as del_err:
                logger.warning("Error deleting redundant secondary scan record: %s", del_err)

        return {
            "success": True,
            "scan_id": primary_id,
            "message": "Scan fusion consolidated successfully.",
            "data": upd_res.data[0],
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Scan fusion consolidation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to consolidate scan fusion: {exc}")
