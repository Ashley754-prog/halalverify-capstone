import logging
from typing import Optional

from app.auth import get_current_user, require_admin
from app.auto_verification_service import evaluate_establishment_submission
from app.schemas.registry import (
    AdditiveCreate,
    AdditiveUpdate,
    EstablishmentCreate,
    EstablishmentSubmissionRequest,
    EstablishmentUpdate,
)
from app.supabase_client import supabase
from app.utils.db_helpers import (
    ensure_deleted,
    ensure_updated,
    model_dump_without_none,
    normalize_additive_code,
    sanitize_postgrest_search,
)
from app.utils.geocoding import geocode_zamboanga_address
from fastapi import APIRouter, Depends, HTTPException, Query


logger = logging.getLogger(__name__)
router = APIRouter(tags=["registry"])

EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES = {
    "needs_review",
    "pending",
    "pending_review",
    "flagged",
    "rejected",
    "suspended",
}


def derive_establishment_tier(record: dict) -> str:
    """
    Deterministically resolves an establishment's verification tier:
    'halal_certified' | 'muslim_owned' | 'muslim_friendly' | 'vegetarian_vegan'
    Uses explicit tier fields, canonical [Tier: ...] tags in description, or admin_notes,
    preventing accidental promotion of self-declared community venues to 'halal_certified'.
    """
    if not record:
        return "halal_certified"

    explicit = (record.get("verification_tier") or record.get("halal_tier") or "").strip().lower()
    if explicit in ("halal_certified", "muslim_owned", "muslim_friendly", "vegetarian_vegan"):
        return explicit

    combined = f"{record.get('description') or ''} {record.get('admin_notes') or ''} {record.get('halal_status') or ''}".lower()
    if "[tier: muslim_owned]" in combined or "muslim-owned" in combined or "muslim_owned" in combined:
        return "muslim_owned"
    if "[tier: muslim_friendly]" in combined or "muslim-friendly" in combined or "muslim_friendly" in combined:
        return "muslim_friendly"
    if "[tier: vegetarian_vegan]" in combined or "vegetarian" in combined or "vegan" in combined or "plant-based" in combined:
        return "vegetarian_vegan"
    if "community listed" in combined and not (record.get("certifying_body_id") or record.get("certificate_number")):
        return "muslim_owned"
    return "halal_certified"


def enrich_establishment_tier(records: list) -> list:
    for item in records or []:
        if isinstance(item, dict):
            tier = derive_establishment_tier(item)
            item["halal_tier"] = tier
            item["verification_tier"] = tier
    return records


@router.get("/api/v1/additives")
@router.get("/registry/additives")
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


@router.post("/registry/additives")
@router.post("/api/v1/registry/additives")
def create_additive(additive: AdditiveCreate, user: dict = Depends(require_admin)):
    payload = model_dump_without_none(additive)
    if "code" in payload and payload["code"]:
        payload["code"] = normalize_additive_code(payload["code"])
    if payload.get("status"):
        st = payload["status"].strip().lower()
        if st in ["halal", "permissible"]:
            payload["status"] = "Halal"
        elif st in ["haram", "prohibited"]:
            payload["status"] = "Haram"
        else:
            payload["status"] = "Doubtful"

    response = (
        supabase
        .table("additives")
        .insert(payload)
        .execute()
    )

    return {
        "success": True,
        "data": response.data[0] if response.data else None,
    }


@router.patch("/registry/additives/{additive_id}")
@router.patch("/api/v1/registry/additives/{additive_id}")
@router.patch("/api/v1/admin/additives/{additive_id}")
@router.put("/registry/additives/{additive_id}")
@router.put("/api/v1/registry/additives/{additive_id}")
@router.put("/api/v1/admin/additives/{additive_id}")
def update_additive(additive_id: str, additive: AdditiveUpdate, user: dict = Depends(require_admin)):
    payload = model_dump_without_none(additive)

    if not payload:
        raise HTTPException(status_code=400, detail="No additive fields to update")

    if "code" in payload and payload["code"]:
        payload["code"] = normalize_additive_code(payload["code"])

    if payload.get("status"):
        st = payload["status"].strip().lower()
        if st in ["halal", "permissible"]:
            payload["status"] = "Halal"
        elif st in ["haram", "prohibited"]:
            payload["status"] = "Haram"
        else:
            payload["status"] = "Doubtful"

    response = (
        supabase
        .table("additives")
        .update(payload)
        .eq("id", additive_id)
        .execute()
    )

    return ensure_updated(response, "Additive")


@router.delete("/registry/additives/{additive_id}")
@router.delete("/api/v1/registry/additives/{additive_id}")
@router.delete("/api/v1/admin/additives/{additive_id}")
def delete_additive(additive_id: str, user: dict = Depends(require_admin)):
    try:
        supabase.table("scan_flagged_items").update({"additive_id": None}).eq("additive_id", additive_id).execute()
    except Exception as fk_err:
        logger.info("Cascade scan_flagged_items on additive delete: %s", fk_err)

    response = (
        supabase
        .table("additives")
        .delete()
        .eq("id", additive_id)
        .execute()
    )

    return ensure_deleted(response, "Additive")


@router.get("/api/v1/hcb-registry")
@router.get("/registry/hcb")
def get_public_hcb_registry(
    category: Optional[str] = Query(None, description="Filter by category (Accredited HCB, Government Oversight)"),
):
    """
    Public registry endpoint to inspect accredited Halal Certifying Bodies and oversight entities.
    """
    req = supabase.table("certifying_bodies").select("*").order("category").order("code")
    if category and category.lower() != "all":
        req = req.eq("category", category)
    response = req.execute()

    return {
        "success": True,
        "data": response.data or [],
    }


@router.get("/api/v1/establishments/map")
@router.get("/establishments/map")
def get_establishments_map(
    lat: Optional[float] = Query(None, description="User latitude for PostGIS proximity search"),
    lng: Optional[float] = Query(None, description="User longitude for PostGIS proximity search"),
    radius: Optional[float] = Query(10.0, description="Search radius in kilometers"),
    region: Optional[str] = Query(None, description="Region code or name"),
    city: Optional[str] = Query(None, description="City name (e.g. Zamboanga City)"),
    status: Optional[str] = Query(None, description="Status filter: verified, pending_review, flagged, etc."),
    hcb: Optional[str] = Query(None, description="Certifying body code or name (e.g. UCZP, IDCP, HDIP)"),
    category: Optional[str] = Query(None, description="Establishment type/category"),
):
    """
    Spatial query endpoint returning nearby or region-filtered verified establishments
    and geographic coordinates across the Philippines (Zamboanga City core).
    Executes PostGIS ST_DWithin proximity search when coordinates are supplied.
    """
    try:
        data = []
        if lat is not None and lng is not None:
            rpc_params = {
                "lat": float(lat),
                "lng": float(lng),
                "radius_meters": float(radius * 1000.0) if radius else 10000.0,
                "filter_status": status if status and status != "all" else None,
                "filter_city": city if city and city != "all" else None,
                "filter_hcb": hcb if hcb and hcb != "all" else None,
            }
            rpc_res = supabase.rpc("get_nearby_establishments", rpc_params).execute()
            raw_data = rpc_res.data or []

            for item in raw_data:
                item_status = (item.get("halal_status") or "").strip().lower()
                if (not status or status == "all") and item_status in EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES:
                    continue
                dist_m = item.get("distance_meters")
                dist_km = round(dist_m / 1000.0, 2) if dist_m is not None else None
                formatted_item = {
                    "id": item.get("id"),
                    "name": item.get("name"),
                    "type": item.get("type"),
                    "address": item.get("address"),
                    "city": item.get("city"),
                    "halal_status": item.get("halal_status"),
                    "certificate_number": item.get("certificate_number"),
                    "expiry_date": item.get("expiry_date"),
                    "latitude": float(item["latitude"]) if item.get("latitude") is not None else None,
                    "longitude": float(item["longitude"]) if item.get("longitude") is not None else None,
                    "certificate_url": item.get("certificate_url"),
                    "logo_url": item.get("logo_url"),
                    "distance_meters": dist_m,
                    "distance_km": dist_km,
                    "phone": item.get("phone"),
                    "email": item.get("email"),
                    "description": item.get("description"),
                    "admin_notes": item.get("admin_notes"),
                    "source_url": item.get("source_url"),
                    "certifying_bodies": {
                        "code": item.get("hcb_code"),
                        "name": item.get("hcb_name"),
                    } if item.get("hcb_code") else None,
                }
                if category and category != "all":
                    if category.lower() not in (item.get("type") or "").lower():
                        continue
                data.append(formatted_item)
        else:
            query = supabase.table("establishments").select("*, certifying_bodies(*)")
            if status and status != "all":
                st_lower = status.lower()
                if "muslim_owned" in st_lower or "muslim-owned" in st_lower or "community" in st_lower:
                    query = query.or_("halal_status.ilike.%muslim_owned%,description.ilike.%[Tier: muslim_owned]%,admin_notes.ilike.%Muslim-Owned%,admin_notes.ilike.%Community Listed%")
                elif "friendly" in st_lower:
                    query = query.or_("halal_status.ilike.%friendly%,description.ilike.%[Tier: muslim_friendly]%,admin_notes.ilike.%Muslim-Friendly%")
                elif "veg" in st_lower:
                    query = query.or_("halal_status.ilike.%veg%,description.ilike.%[Tier: vegetarian_vegan]%,admin_notes.ilike.%Vegetarian%,admin_notes.ilike.%Plant-Based%")
                elif "verified" in st_lower or "certified" in st_lower:
                    query = query.eq("halal_status", "verified")
                elif "needs_review" in st_lower or "pending" in st_lower:
                    query = query.or_("halal_status.ilike.%needs_review%,halal_status.ilike.%pending%")
                elif "flagged" in st_lower or "rejected" in st_lower:
                    query = query.or_("halal_status.ilike.%flagged%,halal_status.ilike.%rejected%,halal_status.ilike.%suspended%")
                else:
                    query = query.ilike("halal_status", f"%{status}%")
            if city and city != "all":
                query = query.ilike("city", f"%{city}%")
            if category and category != "all":
                query = query.ilike("type", f"%{category}%")
            res = query.order("name").execute()
            data = res.data or []

            if status and ("verified" in status.lower() or "certified" in status.lower()):
                data = [
                    d for d in data
                    if derive_establishment_tier(d) == "halal_certified"
                ]

            if not status or status == "all":
                data = [
                    d for d in data
                    if (d.get("halal_status") or "").strip().lower() not in EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES
                ]

            if hcb and hcb != "all":
                hcb_lower = hcb.lower()
                data = [
                    d for d in data
                    if (d.get("certifying_bodies") and (
                        hcb_lower in (d["certifying_bodies"].get("code") or "").lower() or
                        hcb_lower in (d["certifying_bodies"].get("name") or "").lower()
                    ))
                ]

        enrich_establishment_tier(data)

        # Attach associated compliant products/menu items for rich details
        if data:
            est_ids = [d["id"] for d in data if d.get("id")]
            if est_ids:
                try:
                    p_res = supabase.table("products").select("id, name, category, status, establishment_id").in_("establishment_id", est_ids).execute()
                    products_by_est = {}
                    for p in (p_res.data or []):
                        eid = p.get("establishment_id")
                        if eid:
                            if eid not in products_by_est:
                                products_by_est[eid] = []
                            products_by_est[eid].append(p)
                    for d in data:
                        d["products"] = products_by_est.get(d.get("id"), [])
                except Exception as p_err:
                    logger.warning("Failed to fetch products for establishments: %s", p_err)

        return {
            "success": True,
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        logger.error("Error in map endpoint: %s", e)
        try:
            fallback_res = supabase.table("establishments").select("*, certifying_bodies(*)").execute()
            raw_fallback = fallback_res.data or []
            # Security Guard: Never leak rejected, flagged, suspended, or pending_review rows in the fallback path
            fallback_data = [
                d for d in raw_fallback
                if (d.get("halal_status") or "").strip().lower() not in EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES
            ]
            enrich_establishment_tier(fallback_data)
            if fallback_data:
                fb_ids = [d["id"] for d in fallback_data if d.get("id")]
                if fb_ids:
                    try:
                        fb_prods = supabase.table("products").select("id, name, category, status, establishment_id").in_("establishment_id", fb_ids).execute()
                        fb_by_est = {}
                        for p in (fb_prods.data or []):
                            eid = p.get("establishment_id")
                            if eid:
                                if eid not in fb_by_est:
                                    fb_by_est[eid] = []
                                fb_by_est[eid].append(p)
                        for d in fallback_data:
                            d["products"] = fb_by_est.get(d.get("id"), [])
                    except Exception:
                        pass
            return {
                "success": True,
                "count": len(fallback_data),
                "data": fallback_data,
                "fallback": True,
            }
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to load establishments map data")


@router.get("/api/v1/establishments/search")
@router.get("/establishments/search")
def search_establishments(q: Optional[str] = Query(None, description="Search query string")):
    """
    Public query endpoint to search registered establishment profiles.
    Matches establishment name, city, address, or type.
    """
    query_str = sanitize_postgrest_search(q)
    try:
        base_query = (
            supabase.table("establishments")
            .select("*, certifying_bodies(*)")
            .not_("halal_status", "in", "(rejected,REJECTED,needs_review,NEEDS_REVIEW,pending,PENDING,pending_review,flagged,suspended)")
        )
        if query_str:
            base_query = base_query.or_(
                f"name.ilike.%{query_str}%,city.ilike.%{query_str}%,address.ilike.%{query_str}%,type.ilike.%{query_str}%"
            )
        res = base_query.order("name").limit(30).execute()
        rows = enrich_establishment_tier(res.data or [])
        return {
            "success": True,
            "count": len(rows),
            "data": rows,
        }
    except Exception as e:
        logger.error("Error in establishments search: %s", e)
        return {
            "success": False,
            "count": 0,
            "data": [],
            "error": "Failed to search establishments",
        }


@router.get("/registry/establishments")
def get_establishments():
    response = (
        supabase
        .table("establishments")
        .select("*, certifying_bodies(*)")
        .not_("halal_status", "in", "(rejected,REJECTED,flagged,suspended,needs_review,NEEDS_REVIEW,pending,PENDING,pending_review)")
        .order("name")
        .execute()
    )
    rows = enrich_establishment_tier(response.data or [])

    return {
        "success": True,
        "data": rows,
    }


@router.post("/registry/establishments")
@router.post("/api/v1/registry/establishments")
@router.post("/establishments")
def create_establishment(establishment: EstablishmentCreate, user: dict = Depends(require_admin)):
    payload = model_dump_without_none(establishment)
    if "certifying_body_id" in payload and not payload["certifying_body_id"]:
        payload["certifying_body_id"] = None

    if "address" in payload and (payload.get("latitude") is None or payload.get("longitude") is None):
        g_lat, g_lng = geocode_zamboanga_address(payload["address"], payload.get("city", "Zamboanga City"))
        if payload.get("latitude") is None:
            payload["latitude"] = g_lat
        if payload.get("longitude") is None:
            payload["longitude"] = g_lng

    if payload.get("halal_status"):
        st = payload["halal_status"].strip().lower()
        if st in ["verified", "halal", "approved"]:
            payload["halal_status"] = "verified"
        elif st in ["needs_review", "pending", "review", "doubtful"]:
            payload["halal_status"] = "needs_review"
        elif st in ["flagged", "warning"]:
            payload["halal_status"] = "flagged"
        elif st in ["suspended", "revoked"]:
            payload["halal_status"] = "suspended"
        elif st in ["rejected", "denied", "haram"]:
            payload["halal_status"] = "rejected"
        elif st in ["expired"]:
            payload["halal_status"] = "expired"
        else:
            payload["halal_status"] = "needs_review"

    response = (
        supabase
        .table("establishments")
        .insert(payload)
        .execute()
    )

    return {
        "success": True,
        "data": response.data[0] if response.data else None,
    }


@router.patch("/registry/establishments/{establishment_id}")
@router.patch("/api/v1/registry/establishments/{establishment_id}")
@router.put("/registry/establishments/{establishment_id}")
@router.put("/api/v1/registry/establishments/{establishment_id}")
@router.patch("/establishments/{establishment_id}")
@router.put("/establishments/{establishment_id}")
def update_establishment(establishment_id: str, establishment: EstablishmentUpdate, user: dict = Depends(require_admin)):
    payload = model_dump_without_none(establishment)

    if not payload:
        raise HTTPException(status_code=400, detail="No establishment fields to update")

    if "certifying_body_id" in payload and not payload["certifying_body_id"]:
        payload["certifying_body_id"] = None

    if "address" in payload and (payload.get("latitude") is None or payload.get("longitude") is None):
        g_lat, g_lng = geocode_zamboanga_address(payload["address"], payload.get("city", "Zamboanga City"))
        if payload.get("latitude") is None:
            payload["latitude"] = g_lat
        if payload.get("longitude") is None:
            payload["longitude"] = g_lng

    if payload.get("halal_status"):
        st = payload["halal_status"].strip().lower()
        if st in ["verified", "halal", "approved"]:
            payload["halal_status"] = "verified"
        elif st in ["needs_review", "pending", "review", "doubtful"]:
            payload["halal_status"] = "needs_review"
        elif st in ["flagged", "warning"]:
            payload["halal_status"] = "flagged"
        elif st in ["suspended", "revoked"]:
            payload["halal_status"] = "suspended"
        elif st in ["rejected", "denied", "haram"]:
            payload["halal_status"] = "rejected"
        elif st in ["expired"]:
            payload["halal_status"] = "expired"
        else:
            payload["halal_status"] = "needs_review"

    response = (
        supabase
        .table("establishments")
        .update(payload)
        .eq("id", establishment_id)
        .execute()
    )

    return ensure_updated(response, "Establishment")


@router.delete("/registry/establishments/{establishment_id}")
@router.delete("/api/v1/registry/establishments/{establishment_id}")
@router.delete("/establishments/{establishment_id}")
def delete_establishment(establishment_id: str, user: dict = Depends(require_admin)):
    try:
        supabase.table("products").update({"establishment_id": None}).eq("establishment_id", establishment_id).execute()
        supabase.table("issue_reports").update({"establishment_id": None}).eq("establishment_id", establishment_id).execute()
    except Exception as fk_err:
        logger.info("Cascade references on establishment delete: %s", fk_err)

    response = (
        supabase
        .table("establishments")
        .delete()
        .eq("id", establishment_id)
        .execute()
    )

    return ensure_deleted(response, "Establishment")


@router.post("/establishments/submit")
@router.post("/api/v1/establishments/submit")
def submit_establishment(
    submission: EstablishmentSubmissionRequest,
    user: dict = Depends(get_current_user),
):
    """
    Community user establishment submission endpoint with automated AI verification pipeline.
    """
    user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Valid user credentials required")

    selected_tier = (submission.halal_tier or "halal_certified").strip().lower()
    desc_parts = []
    if selected_tier != "halal_certified":
        desc_parts.append(f"[Tier: {selected_tier}]")
    if submission.amenities:
        desc_parts.append(f"Amenities: {' | '.join(submission.amenities)}")

    establishment_payload = {
        "name": submission.name.strip(),
        "type": submission.type or "Restaurant",
        "address": submission.address.strip(),
        "city": submission.city or "Zamboanga City",
        "halal_tier": selected_tier,
        "phone": submission.contact_number.strip() if submission.contact_number else None,
        "source_url": submission.social_media_url.strip() if submission.social_media_url else None,
        "submitter_role": submission.submitter_role or "community",
        "certifying_body_id": submission.certifying_body_id,
        "certificate_number": submission.certificate_number,
        "expiry_date": submission.expiry_date,
        "certificate_url": submission.certificate_url,
        "logo_url": submission.logo_url,
        "submitted_by": str(user_id),
        "amenities": submission.amenities or [],
        "description": " | ".join(desc_parts) if desc_parts else None,
        "source": "Business Owner Submission" if submission.submitter_role == "owner" else "Community User Submission",
    }

    # Execute Automated AI Verification Pipeline
    ai_eval = evaluate_establishment_submission(establishment_payload)

    # Apply AI decision and enriched metadata
    establishment_payload["halal_status"] = ai_eval["status"]
    establishment_payload["verified_at"] = ai_eval["verified_at"]
    establishment_payload["verified_by"] = ai_eval["verified_by"]
    establishment_payload["admin_notes"] = ai_eval["admin_notes"]

    if ai_eval.get("certificate_number"):
        establishment_payload["certificate_number"] = ai_eval["certificate_number"]
    if ai_eval.get("expiry_date"):
        establishment_payload["expiry_date"] = ai_eval["expiry_date"]
    if ai_eval.get("certifying_body_id") and not establishment_payload.get("certifying_body_id"):
        establishment_payload["certifying_body_id"] = ai_eval["certifying_body_id"]

    # Resolve GPS coordinates for interactive map pin placement
    lat = submission.latitude
    lng = submission.longitude
    if lat is None or lng is None:
        lat, lng = geocode_zamboanga_address(submission.address, submission.city or "Zamboanga City")

    establishment_payload["latitude"] = lat
    establishment_payload["longitude"] = lng

    # Whitelist valid Supabase table columns only
    valid_est_cols = {
        "name", "type", "address", "city", "halal_status", "certifying_body_id",
        "certificate_number", "expiry_date", "certificate_url", "logo_url",
        "submitted_by", "source", "source_url", "phone", "admin_notes",
        "verified_at", "verified_by", "latitude", "longitude", "description",
    }
    clean_payload = {k: v for k, v in establishment_payload.items() if k in valid_est_cols and v is not None}

    response = (
        supabase
        .table("establishments")
        .insert(clean_payload)
        .execute()
    )

    created_establishment = response.data[0] if response.data else None
    if not created_establishment:
        raise HTTPException(status_code=500, detail="Failed to record establishment submission")

    created_establishment["halal_tier"] = selected_tier
    created_establishment["verification_tier"] = selected_tier

    # If associated product names were submitted, insert them
    created_products = []
    if submission.product_names and created_establishment.get("id"):
        for p_name in submission.product_names:
            if not p_name.strip():
                continue
            prod_status = "VERIFIED" if ai_eval["is_auto_approved"] else "PENDING_VERIFICATION"
            prod_payload = {
                "name": p_name.strip(),
                "establishment_id": created_establishment["id"],
                "category": "Food & Beverage",
                "status": prod_status,
                "verified_at": ai_eval["verified_at"],
                "verified_by": ai_eval["verified_by"],
                "submitted_by": str(user_id),
                "source": "Community User Submission",
            }
            clean_prod = {k: v for k, v in prod_payload.items() if v is not None}
            p_res = supabase.table("products").insert(clean_prod).execute()
            if p_res.data:
                created_products.append(p_res.data[0])

    msg = (
        "Instant AI Verification Complete! Establishment authenticated and published live to directory."
        if ai_eval["is_auto_approved"]
        else "Establishment submitted successfully and queued for standard verification."
    )

    return {
        "success": True,
        "auto_approved": ai_eval["is_auto_approved"],
        "message": msg,
        "data": created_establishment,
        "associated_products": created_products,
        "audit_trail": ai_eval["audit_trail"],
    }


@router.get("/my-submissions")
@router.get("/api/v1/my-submissions")
def get_my_submissions(user: dict = Depends(get_current_user)):
    """
    Returns all establishments, products, and issue reports submitted by the authenticated user.
    """
    user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Valid user credentials required")

    uid = str(user_id)
    est_list = []
    prod_list = []
    rep_list = []

    try:
        res_est = (
            supabase.table("establishments")
            .select("id, name, type, address, description, halal_status, admin_notes, created_at, verified_at, certifying_body_id, certificate_number")
            .eq("submitted_by", uid)
            .order("created_at", desc=True)
            .execute()
        )
        est_list = enrich_establishment_tier(res_est.data or [])
    except Exception:
        pass

    try:
        res_prod = (
            supabase.table("products")
            .select("id, name, brand, category, status, admin_notes, created_at, verified_at")
            .eq("submitted_by", uid)
            .order("created_at", desc=True)
            .execute()
        )
        prod_list = res_prod.data or []
    except Exception:
        pass

    try:
        res_rep = (
            supabase.table("issue_reports")
            .select("id, issue_type, subject_name, related_to, status, resolution_notes, created_at")
            .eq("user_id", uid)
            .order("created_at", desc=True)
            .execute()
        )
        rep_list = res_rep.data or []
    except Exception:
        pass

    return {
        "establishments": est_list,
        "products": prod_list,
        "reports": rep_list,
    }
