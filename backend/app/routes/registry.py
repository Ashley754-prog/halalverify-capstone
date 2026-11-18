import datetime
import logging
from typing import Optional

from app.auth import extract_user_id, get_current_user, get_optional_current_user, is_admin_user, require_admin
from app.auto_verification_service import evaluate_establishment_submission
from app.notification_service import notify_admins, notify_user
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
    strip_private_fields,
)
from app.utils.geocoding import geocode_zamboanga_address
from fastapi import APIRouter, Depends, HTTPException, Query


logger = logging.getLogger(__name__)
router = APIRouter(tags=["registry"])

EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES = {
    "needs_review",
    "pending",
    "pending_review",
    "pending_verification",
    "flagged",
    "rejected",
    "suspended",
    "expired",
    "relocated",
    "permanently_closed",
    "demolished",
    "closed",
    "haram",
}

# Moderation states that must only be visible to authenticated administrators.
PRIVILEGED_ESTABLISHMENT_STATUSES = set(EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES)

# Status filters the public may request. This is an allowlist so that fuzzy or
# partial values (e.g. "review", "rej") cannot be used to reach privileged rows.
PUBLIC_ESTABLISHMENT_STATUS_FILTERS = {
    "all",
    "verified",
    "for_renewal",
    "halal_certified",
    "community",
    "muslim_owned",
    "muslim_friendly",
    "vegetarian_vegan",
    "vegetarian",
    "vegan",
    "plant_based",
    "pork_free",
}

TIER_STATUS_FILTER_MAP = {
    "verified": "halal_certified",
    "halal_certified": "halal_certified",
    "muslim_owned": "muslim_owned",
    "community": "muslim_owned",
    "muslim_friendly": "muslim_friendly",
    "vegetarian_vegan": "vegetarian_vegan",
    "vegetarian": "vegetarian_vegan",
    "vegan": "vegetarian_vegan",
    "plant_based": "vegetarian_vegan",
}

EXCLUDED_PUBLIC_PRODUCT_STATUSES = {
    "rejected",
    "pending_verification",
    "pending",
    "needs_review",
    "pending_review",
    "draft",
    "expired",
    "flagged",
    "suspended",
    "haram",
    "inactive",
}


def _is_admin_user(user: Optional[dict]) -> bool:
    """Resolve an optional bearer token to an admin profile without raising."""
    return is_admin_user(user)


def _manila_today() -> datetime.date:
    manila_tz = datetime.timezone(datetime.timedelta(hours=8))
    return datetime.datetime.now(manila_tz).date()


def _is_past_manila_date(value) -> bool:
    if not value:
        return False
    try:
        return datetime.date.fromisoformat(str(value).strip()[:10]) < _manila_today()
    except ValueError:
        return False


def _attach_establishment_products(rows: list, *, is_admin: bool) -> list:
    """Attach related products to establishments, hiding unapproved or expired products from non-admins."""
    if not rows:
        return rows
    est_ids = [d["id"] for d in rows if isinstance(d, dict) and d.get("id")]
    if not est_ids:
        return rows
    try:
        p_res = (
            supabase.table("products")
            .select("id, name, category, status, brand, certificate_no, expiry_date, establishment_id")
            .in_("establishment_id", est_ids)
            .execute()
        )
        products_by_est = {}
        for p in (p_res.data or []):
            p_status = (p.get("status") or "").strip().lower()
            if not is_admin and (
                p_status in EXCLUDED_PUBLIC_PRODUCT_STATUSES
                or (p_status in {"halal", "verified", "approved", "for renewal", "for_renewal"} and _is_past_manila_date(p.get("expiry_date")))
            ):
                continue
            eid = p.get("establishment_id")
            if eid:
                products_by_est.setdefault(eid, []).append(p)
        for d in rows:
            d["products"] = products_by_est.get(d.get("id"), [])
    except Exception as p_err:
        logger.warning("Failed to fetch products for establishments: %s", p_err)
    return rows


def _filter_establishment_rows(
    rows: list,
    *,
    is_admin: bool,
    requested_status: str,
    city: Optional[str] = None,
    category: Optional[str] = None,
    hcb: Optional[str] = None,
) -> list:
    """Enforce public moderation exclusions and requested tier/status/taxonomy filters."""
    filtered = []
    city_lower = city.strip().lower() if city and city.lower() != "all" else ""
    cat_lower = category.strip().lower() if category and category.lower() != "all" else ""
    hcb_lower = hcb.strip().lower() if hcb and hcb.lower() != "all" else ""

    for d in rows or []:
        if not isinstance(d, dict):
            continue
        est_status = (d.get("halal_status") or "").strip().lower()
        is_date_expired = _is_past_manila_date(d.get("expiry_date"))
        if not is_admin and (est_status in EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES or is_date_expired):
            continue

        tier = derive_establishment_tier(d)
        if requested_status and requested_status != "all":
            if requested_status in TIER_STATUS_FILTER_MAP:
                target_tier = TIER_STATUS_FILTER_MAP[requested_status]
                if tier != target_tier:
                    continue
                if requested_status == "verified" and (est_status not in {"verified", "for_renewal"} or is_date_expired):
                    continue
            elif requested_status == "for_renewal":
                if est_status != "for_renewal" or is_date_expired:
                    continue
            elif requested_status == "expired":
                if est_status != "expired" and not (est_status in {"verified", "for_renewal", "halal_certified", "halal"} and is_date_expired):
                    continue
            elif requested_status not in est_status.replace("-", "_").replace(" ", "_"):
                continue

        if city_lower and city_lower not in (d.get("city") or "").lower():
            continue
        if cat_lower and cat_lower not in (d.get("type") or "").lower():
            continue
        if hcb_lower:
            cb = d.get("certifying_bodies") or {}
            cb_code = (cb.get("code") or "").lower()
            cb_name = (cb.get("name") or "").lower()
            if hcb_lower not in cb_code and hcb_lower not in cb_name:
                continue

        filtered.append(d)

    return enrich_establishment_tier(filtered)


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
    user: Optional[dict] = Depends(get_optional_current_user),
):
    """
    Spatial query endpoint returning nearby or region-filtered verified establishments
    and geographic coordinates across the Philippines (Zamboanga City core).
    Executes PostGIS ST_DWithin proximity search when coordinates are supplied.
    """
    is_admin = _is_admin_user(user)
    requested_status = (status or "").strip().lower().replace(" ", "_").replace("-", "_")
    if requested_status and not is_admin:
        if (
            requested_status in PRIVILEGED_ESTABLISHMENT_STATUSES
            or requested_status not in PUBLIC_ESTABLISHMENT_STATUS_FILTERS
        ):
            # Do not disclose the existence of unapproved moderation records and
            # do not allow partial/fuzzy status probes.
            raise HTTPException(status_code=404, detail="Not found")

    try:
        if lat is not None and lng is not None:
            rpc_status_arg = (
                None
                if (not status or status == "all" or requested_status in TIER_STATUS_FILTER_MAP)
                else status
            )
            rpc_params = {
                "lat": float(lat),
                "lng": float(lng),
                "radius_meters": float(radius * 1000.0) if radius else 10000.0,
                "filter_status": rpc_status_arg,
                "filter_city": city if city and city != "all" else None,
                "filter_hcb": hcb if hcb and hcb != "all" else None,
            }
            rpc_res = supabase.rpc("get_nearby_establishments", rpc_params).execute()
            raw_data = rpc_res.data or []
            formatted_rows = []
            for item in raw_data:
                dist_m = item.get("distance_meters")
                dist_km = round(dist_m / 1000.0, 2) if dist_m is not None else None
                formatted_rows.append({
                    "id": item.get("id"),
                    "name": item.get("name"),
                    "type": item.get("type"),
                    "address": item.get("address"),
                    "city": item.get("city"),
                    "halal_status": item.get("halal_status"),
                    "halal_tier": item.get("halal_tier"),
                    "verification_tier": item.get("verification_tier") or item.get("halal_tier"),
                    "amenities": item.get("amenities") or [],
                    "menu_highlights": item.get("menu_highlights") or [],
                    "submitter_role": item.get("submitter_role"),
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
                    "source_url": item.get("source_url"),
                    "certifying_bodies": {
                        "code": item.get("hcb_code"),
                        "name": item.get("hcb_name"),
                    } if item.get("hcb_code") else None,
                })
            data = _filter_establishment_rows(
                formatted_rows,
                is_admin=is_admin,
                requested_status=requested_status,
                city=city,
                category=category,
                hcb=hcb,
            )
        else:
            query = supabase.table("establishments").select("*, certifying_bodies(*)")
            if not is_admin:
                query = query.not_.in_("halal_status", list(EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES))
            if city and city != "all":
                query = query.ilike("city", f"%{city}%")
            if category and category != "all":
                query = query.ilike("type", f"%{category}%")
            res = query.order("name").execute()
            data = _filter_establishment_rows(
                res.data or [],
                is_admin=is_admin,
                requested_status=requested_status,
                city=city,
                category=category,
                hcb=hcb,
            )

        _attach_establishment_products(data, is_admin=is_admin)
        clean_data = strip_private_fields(data, is_admin=is_admin)

        return {
            "success": True,
            "count": len(clean_data),
            "data": clean_data,
        }
    except Exception as e:
        logger.error("Error in map endpoint: %s", e)
        try:
            fb_query = supabase.table("establishments").select("*, certifying_bodies(*)")
            if not is_admin:
                fb_query = fb_query.not_.in_("halal_status", list(EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES))
            fallback_res = fb_query.order("name").execute()
            fallback_data = _filter_establishment_rows(
                fallback_res.data or [],
                is_admin=is_admin,
                requested_status=requested_status,
                city=city,
                category=category,
                hcb=hcb,
            )
            _attach_establishment_products(fallback_data, is_admin=is_admin)
            clean_fallback = strip_private_fields(fallback_data, is_admin=is_admin)
            return {
                "success": True,
                "count": len(clean_fallback),
                "data": clean_fallback,
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
            .not_.in_("halal_status", list(EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES))
        )
        if query_str:
            base_query = base_query.or_(
                f"name.ilike.%{query_str}%,city.ilike.%{query_str}%,address.ilike.%{query_str}%,type.ilike.%{query_str}%"
            )
        res = base_query.order("name").limit(30).execute()
        rows = strip_private_fields(enrich_establishment_tier(res.data or []), is_admin=False)
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
def get_establishments(user: Optional[dict] = Depends(get_optional_current_user)):
    is_admin = _is_admin_user(user)

    query = supabase.table("establishments").select("*, certifying_bodies(*)")
    if not is_admin:
        query = query.not_.in_("halal_status", list(EXCLUDED_UNVERIFIED_ESTABLISHMENT_STATUSES))
    response = query.order("name").execute()
    rows = strip_private_fields(enrich_establishment_tier(response.data or []), is_admin=is_admin)

    return {
        "success": True,
        "data": rows,
    }


ESTABLISHMENT_STATUS_NORMALIZATION = {
    "verified": ("verified", None),
    "halal": ("verified", None),
    "approved": ("verified", None),
    "active": ("verified", None),
    "published": ("verified", None),
    "halal_certified": ("verified", "halal_certified"),
    "muslim_owned": ("verified", "muslim_owned"),
    "muslim_friendly": ("verified", "muslim_friendly"),
    "vegetarian_vegan": ("verified", "vegetarian_vegan"),
    "community_listed": ("verified", "muslim_owned"),
    "community": ("verified", "muslim_owned"),
    "for_renewal": ("for_renewal", None),
    "renewal": ("for_renewal", None),
    "needs_review": ("needs_review", None),
    "pending": ("pending_verification", None),
    "pending_verification": ("pending_verification", None),
    "review": ("pending_review", None),
    "doubtful": ("pending_review", None),
    "pending_review": ("pending_review", None),
    "flagged": ("flagged", None),
    "warning": ("flagged", None),
    "suspended": ("suspended", None),
    "revoked": ("suspended", None),
    "rejected": ("rejected", None),
    "denied": ("rejected", None),
    "haram": ("rejected", None),
    "expired": ("expired", None),
    "relocated": ("relocated", None),
    "moved": ("relocated", None),
    "closed": ("closed", None),
    "permanently_closed": ("permanently_closed", None),
    "demolished": ("demolished", None),
}


def _prepare_establishment_payload(payload: dict, user_id: Optional[str], *, is_update: bool) -> dict:
    """Normalize status, tier, coordinates, and audit timestamps on admin establishment writes."""
    if "certifying_body_id" in payload and not payload["certifying_body_id"]:
        payload["certifying_body_id"] = None

    if "address" in payload and (payload.get("latitude") is None or payload.get("longitude") is None):
        g_lat, g_lng = geocode_zamboanga_address(payload["address"], payload.get("city", "Zamboanga City"))
        if payload.get("latitude") is None:
            payload["latitude"] = g_lat
        if payload.get("longitude") is None:
            payload["longitude"] = g_lng

    if payload.get("halal_tier"):
        tier = payload["halal_tier"].strip().lower()
        if tier in ("halal_certified", "muslim_owned", "muslim_friendly", "vegetarian_vegan"):
            payload["halal_tier"] = tier
            payload["verification_tier"] = tier

    if payload.get("halal_status"):
        st = payload["halal_status"].strip().lower().replace(" ", "_").replace("-", "_")
        mapped = ESTABLISHMENT_STATUS_NORMALIZATION.get(st)
        if not mapped:
            raise HTTPException(status_code=400, detail=f"Invalid halal_status: {payload['halal_status']}")
        canonical_status, inferred_tier = mapped
        payload["halal_status"] = canonical_status
        if inferred_tier and not payload.get("halal_tier"):
            payload["halal_tier"] = inferred_tier
            payload["verification_tier"] = inferred_tier

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if canonical_status == "verified":
            payload["verified_at"] = now_iso
            payload["verified_by"] = user_id
        elif is_update and canonical_status != "for_renewal":
            payload["verified_at"] = None
            payload["verified_by"] = None

    if "photo_url" in payload:
        if not payload.get("logo_url"):
            payload["logo_url"] = payload["photo_url"]
        del payload["photo_url"]

    return payload


@router.post("/registry/establishments")
@router.post("/api/v1/registry/establishments")
@router.post("/establishments")
def create_establishment(establishment: EstablishmentCreate, user: dict = Depends(require_admin)):
    payload = _prepare_establishment_payload(
        model_dump_without_none(establishment),
        extract_user_id(user),
        is_update=False,
    )

    try:
        response = (
            supabase
            .table("establishments")
            .insert(payload)
            .execute()
        )
    except Exception as err:
        if "verification_tier" in str(err).lower() or "42703" in str(err):
            payload.pop("verification_tier", None)
            response = supabase.table("establishments").insert(payload).execute()
        else:
            raise

    created = enrich_establishment_tier(response.data or [])
    return {
        "success": True,
        "data": created[0] if created else None,
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

    payload = _prepare_establishment_payload(payload, extract_user_id(user), is_update=True)

    try:
        response = (
            supabase
            .table("establishments")
            .update(payload)
            .eq("id", establishment_id)
            .execute()
        )
    except Exception as err:
        if "verification_tier" in str(err).lower() or "42703" in str(err):
            payload.pop("verification_tier", None)
            response = (
                supabase
                .table("establishments")
                .update(payload)
                .eq("id", establishment_id)
                .execute()
            )
        else:
            raise

    res_obj = ensure_updated(response, "Establishment")
    if isinstance(res_obj, dict) and isinstance(res_obj.get("data"), dict):
        tier = derive_establishment_tier(res_obj["data"])
        res_obj["data"]["halal_tier"] = tier
        res_obj["data"]["verification_tier"] = tier
    return res_obj


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
    raw_dishes = submission.menu_highlights or submission.product_names or []
    menu_highlights = [d.strip() for d in raw_dishes if isinstance(d, str) and d.strip()]

    desc_parts = []
    if selected_tier != "halal_certified":
        desc_parts.append(f"[Tier: {selected_tier}]")
    if submission.amenities:
        desc_parts.append(f"Amenities: {', '.join(submission.amenities)}")
    if menu_highlights:
        desc_parts.append(f"Dishes: {', '.join(menu_highlights)}")

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
        "menu_highlights": menu_highlights,
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
        "name", "type", "address", "city", "halal_status", "halal_tier", "amenities",
        "menu_highlights", "submitter_role", "certifying_body_id",
        "certificate_number", "expiry_date", "certificate_url", "logo_url",
        "submitted_by", "source", "source_url", "phone", "admin_notes",
        "verified_at", "verified_by", "latitude", "longitude", "description",
    }
    clean_payload = {k: v for k, v in establishment_payload.items() if k in valid_est_cols and v is not None}

    try:
        response = (
            supabase
            .table("establishments")
            .insert(clean_payload)
            .execute()
        )
    except Exception as ins_err:
        err_msg = str(ins_err).lower()
        if "column" in err_msg or "42703" in err_msg or "halal_tier" in err_msg:
            logger.info("Live Supabase table has not run Migration 006 yet. Retrying with legacy column set.")
            legacy_cols = {
                "name", "type", "address", "city", "halal_status", "certifying_body_id",
                "certificate_number", "expiry_date", "certificate_url", "logo_url",
                "submitted_by", "source", "source_url", "phone", "admin_notes",
                "verified_at", "verified_by", "latitude", "longitude", "description",
            }
            legacy_payload = {k: v for k, v in clean_payload.items() if k in legacy_cols}
            response = (
                supabase
                .table("establishments")
                .insert(legacy_payload)
                .execute()
            )
        else:
            raise ins_err

    created_establishment = response.data[0] if response.data else None
    if not created_establishment:
        raise HTTPException(status_code=500, detail="Failed to record establishment submission")

    created_establishment["halal_tier"] = selected_tier
    created_establishment["verification_tier"] = selected_tier
    created_establishment["menu_highlights"] = menu_highlights
    created_establishment["amenities"] = submission.amenities or []

    # Format dishes as menu highlights without polluting public.products table
    created_products = [
        {
            "id": f"dish-{idx}",
            "name": p_name,
            "category": "Food & Beverage",
            "status": "VERIFIED" if ai_eval["is_auto_approved"] else "PENDING_VERIFICATION",
        }
        for idx, p_name in enumerate(menu_highlights)
    ]

    msg = (
        "Instant AI Verification Complete! Establishment authenticated and published live to directory."
        if ai_eval["is_auto_approved"]
        else "Establishment submitted successfully and queued for standard verification."
    )

    est_name = created_establishment.get("name") or "Your establishment"
    est_id = created_establishment.get("id")
    if ai_eval["is_auto_approved"]:
        notify_user(
            user_id,
            category="verification",
            title="Establishment approved",
            message=f'"{est_name}" was verified and published to the directory.',
            entity_type="establishment",
            entity_id=est_id,
            action_view="profile",
        )
        notify_admins(
            category="verification",
            title="New establishment auto-approved",
            message=f'"{est_name}" was auto-verified by AI and published.',
            entity_type="establishment",
            entity_id=est_id,
            action_view="map",
        )
    else:
        notify_user(
            user_id,
            category="submission",
            title="Establishment submitted",
            message=f'"{est_name}" is queued for verification. Track its status in My Contributions.',
            entity_type="establishment",
            entity_id=est_id,
            action_view="profile",
        )
        notify_admins(
            category="submission",
            title="New establishment submission",
            message=f'"{est_name}" is awaiting verification.',
            entity_type="establishment",
            entity_id=est_id,
            action_view="verification-queue",
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
