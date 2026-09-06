from app.auth import get_current_user, require_admin
from app.schemas.registry import (
    AdditiveCreate,
    AdditiveUpdate,
    EstablishmentCreate,
    EstablishmentUpdate,
    EstablishmentSubmissionRequest,
)
from app.supabase_client import supabase
from app.utils.db_helpers import ensure_deleted, ensure_updated, model_dump_without_none
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(tags=["registry"])


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
