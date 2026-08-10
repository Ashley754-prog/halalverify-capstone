from app.schemas.registry import (
    AdditiveCreate,
    AdditiveUpdate,
    EstablishmentCreate,
    EstablishmentUpdate,
)
from app.supabase_client import supabase
from app.utils.db_helpers import ensure_deleted, ensure_updated, model_dump_without_none
from fastapi import APIRouter, HTTPException

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


@router.patch("/registry/additives/{additive_id}")
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


@router.delete("/registry/additives/{additive_id}")
def delete_additive(additive_id: str):
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


@router.patch("/registry/establishments/{establishment_id}")
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


@router.delete("/registry/establishments/{establishment_id}")
def delete_establishment(establishment_id: str):
    response = (
        supabase
        .table("establishments")
        .delete()
        .eq("id", establishment_id)
        .execute()
    )

    return ensure_deleted(response, "Establishment")
