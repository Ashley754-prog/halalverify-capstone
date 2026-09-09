from app.auth import get_current_user, require_admin
from app.schemas.registry import (
    AdditiveCreate,
    AdditiveUpdate,
    EstablishmentCreate,
    EstablishmentUpdate,
    EstablishmentSubmissionRequest,
)
from app.supabase_client import supabase
from typing import Optional
from app.utils.db_helpers import ensure_deleted, ensure_updated, model_dump_without_none
from fastapi import APIRouter, Depends, HTTPException, Query

router = APIRouter(tags=["registry"])


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
def create_additive(additive: AdditiveCreate, user: dict = Depends(require_admin)):
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


@router.patch("/registry/additives/{additive_id}")
def update_additive(additive_id: str, additive: AdditiveUpdate, user: dict = Depends(require_admin)):
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


@router.delete("/registry/additives/{additive_id}")
def delete_additive(additive_id: str, user: dict = Depends(require_admin)):
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
                query = query.ilike("halal_status", f"%{status}%")
            if city and city != "all":
                query = query.ilike("city", f"%{city}%")
            if category and category != "all":
                query = query.ilike("type", f"%{category}%")
            res = query.order("name").execute()
            data = res.data or []

            if hcb and hcb != "all":
                hcb_lower = hcb.lower()
                data = [
                    d for d in data
                    if (d.get("certifying_bodies") and (
                        hcb_lower in (d["certifying_bodies"].get("code") or "").lower() or
                        hcb_lower in (d["certifying_bodies"].get("name") or "").lower()
                    ))
                ]

        # Attach associated compliant products/menu items for rich details
        if data:
            est_ids = [d["id"] for d in data if d.get("id")]
            if est_ids:
                try:
                    p_res = supabase.table("products").select("id, name, category, status, establishment_id").in_("establishment_id", est_ids[:50]).execute()
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
                    print(f"Warning: Failed to fetch products for establishments: {p_err}")

        return {
            "success": True,
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        print(f"Error in map endpoint: {e}")
        try:
            fallback_res = supabase.table("establishments").select("*, certifying_bodies(*)").execute()
            return {
                "success": True,
                "count": len(fallback_res.data or []),
                "data": fallback_res.data or [],
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
    query_str = (q or "").strip()
    try:
        base_query = supabase.table("establishments").select("*, certifying_bodies(*)")
        if query_str:
            base_query = base_query.or_(
                f"name.ilike.%{query_str}%,city.ilike.%{query_str}%,address.ilike.%{query_str}%,type.ilike.%{query_str}%"
            )
        res = base_query.order("name").limit(30).execute()
        return {
            "success": True,
            "count": len(res.data or []),
            "data": res.data or [],
        }
    except Exception as e:
        print(f"Error in establishments search: {e}")
        return {
            "success": False,
            "count": 0,
            "data": [],
            "error": str(e),
        }


@router.get("/registry/establishments")
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


@router.post("/registry/establishments")
def create_establishment(establishment: EstablishmentCreate, user: dict = Depends(require_admin)):
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


@router.patch("/registry/establishments/{establishment_id}")
def update_establishment(establishment_id: str, establishment: EstablishmentUpdate, user: dict = Depends(require_admin)):
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


@router.delete("/registry/establishments/{establishment_id}")
def delete_establishment(establishment_id: str, user: dict = Depends(require_admin)):
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
    Community user submission endpoint (requires authentication).
    Submissions default to 'PENDING_VERIFICATION' and do not appear in public verified
    queries until validated by administrators.
    """
    user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Valid user credentials required")

    establishment_payload = {
        "name": submission.name.strip(),
        "type": submission.type or "Restaurant",
        "address": submission.address.strip(),
        "city": submission.city or "Zamboanga City",
        "halal_status": "PENDING_VERIFICATION",
        "certifying_body_id": submission.certifying_body_id,
        "certificate_number": submission.certificate_number,
        "expiry_date": submission.expiry_date,
        "certificate_url": submission.certificate_url,
        "logo_url": submission.logo_url,
        "submitted_by": str(user_id),
        "source": "Community User Submission",
    }
    clean_payload = {k: v for k, v in establishment_payload.items() if v is not None}

    response = (
        supabase
        .table("establishments")
        .insert(clean_payload)
        .execute()
    )

    created_establishment = response.data[0] if response.data else None
    if not created_establishment:
        raise HTTPException(status_code=500, detail="Failed to record establishment submission")

    # If associated product names were submitted, insert them as pending draft items
    created_products = []
    if submission.product_names and created_establishment.get("id"):
        for p_name in submission.product_names:
            if not p_name.strip():
                continue
            prod_payload = {
                "name": p_name.strip(),
                "establishment_id": created_establishment["id"],
                "category": "Food & Beverage",
                "status": "PENDING_VERIFICATION",
                "submitted_by": str(user_id),
                "source": "Community User Submission",
            }
            p_res = supabase.table("products").insert(prod_payload).execute()
            if p_res.data:
                created_products.append(p_res.data[0])

    return {
        "success": True,
        "message": "Establishment submitted successfully and queued for admin verification.",
        "data": created_establishment,
        "associated_products": created_products,
    }
