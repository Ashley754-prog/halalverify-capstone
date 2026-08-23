from typing import Optional

from app.auth import require_admin
from app.schemas.products import (
    ManufacturerCreate,
    ManufacturerUpdate,
    ProductCreate,
    ProductUpdate,
)
from app.supabase_client import supabase
from app.utils.db_helpers import ensure_deleted, ensure_updated, model_dump_without_none
from fastapi import APIRouter, Depends, HTTPException, Query

router = APIRouter(tags=["products"])


# ---------------------------------------------------------------------------
# Products Endpoints
# ---------------------------------------------------------------------------

@router.get("/products")
def get_products(
    query: Optional[str] = Query(None, description="Search term for name, brand, or barcode"),
    category: Optional[str] = Query(None, description="Filter by product category"),
    status: Optional[str] = Query(None, description="Filter by halal status"),
    manufacturer_id: Optional[str] = Query(None, description="Filter by manufacturer ID"),
    certifying_body_id: Optional[str] = Query(None, description="Filter by certifying body ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    builder = (
        supabase
        .table("products")
        .select("*, manufacturers(*), certifying_bodies(*)")
    )

    if query:
        # Search by name or brand or barcode
        sanitized_query = query.strip()
        builder = builder.or_(
            f"name.ilike.%{sanitized_query}%,brand.ilike.%{sanitized_query}%,barcode.ilike.%{sanitized_query}%"
        )

    if category:
        builder = builder.eq("category", category)

    if status:
        builder = builder.eq("status", status)

    if manufacturer_id:
        builder = builder.eq("manufacturer_id", manufacturer_id)

    if certifying_body_id:
        builder = builder.eq("certifying_body_id", certifying_body_id)

    response = builder.order("name").range(offset, offset + limit - 1).execute()

    return {
        "success": True,
        "data": response.data or [],
        "count": len(response.data or []),
    }


@router.get("/products/{product_id}")
def get_product(product_id: str):
    response = (
        supabase
        .table("products")
        .select("*, manufacturers(*), certifying_bodies(*)")
        .eq("id", product_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "success": True,
        "data": response.data[0],
    }


@router.post("/products")
def create_product(product: ProductCreate, user: dict = Depends(require_admin)):
    response = (
        supabase
        .table("products")
        .insert(model_dump_without_none(product))
        .execute()
    )

    return {
        "success": True,
        "data": response.data[0] if response.data else None,
    }


@router.patch("/products/{product_id}")
def update_product(product_id: str, product: ProductUpdate, user: dict = Depends(require_admin)):
    payload = model_dump_without_none(product)

    if not payload:
        raise HTTPException(status_code=400, detail="No product fields to update")

    response = (
        supabase
        .table("products")
        .update(payload)
        .eq("id", product_id)
        .execute()
    )

    return ensure_updated(response, "Product")


@router.delete("/products/{product_id}")
def delete_product(product_id: str, user: dict = Depends(require_admin)):
    response = (
        supabase
        .table("products")
        .delete()
        .eq("id", product_id)
        .execute()
    )

    return ensure_deleted(response, "Product")


# ---------------------------------------------------------------------------
# Manufacturers Endpoints
# ---------------------------------------------------------------------------

@router.get("/manufacturers")
def get_manufacturers(
    query: Optional[str] = Query(None, description="Search by manufacturer name or country"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    builder = (
        supabase
        .table("manufacturers")
        .select("*, products(*)")
    )

    if query:
        sanitized_query = query.strip()
        builder = builder.or_(
            f"name.ilike.%{sanitized_query}%,country.ilike.%{sanitized_query}%"
        )

    response = builder.order("name").range(offset, offset + limit - 1).execute()

    return {
        "success": True,
        "data": response.data or [],
        "count": len(response.data or []),
    }


@router.get("/manufacturers/{manufacturer_id}")
def get_manufacturer(manufacturer_id: str):
    response = (
        supabase
        .table("manufacturers")
        .select("*, products(*)")
        .eq("id", manufacturer_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Manufacturer not found")

    return {
        "success": True,
        "data": response.data[0],
    }


@router.post("/manufacturers")
def create_manufacturer(manufacturer: ManufacturerCreate, user: dict = Depends(require_admin)):
    response = (
        supabase
        .table("manufacturers")
        .insert(model_dump_without_none(manufacturer))
        .execute()
    )

    return {
        "success": True,
        "data": response.data[0] if response.data else None,
    }


@router.patch("/manufacturers/{manufacturer_id}")
def update_manufacturer(
    manufacturer_id: str,
    manufacturer: ManufacturerUpdate,
    user: dict = Depends(require_admin),
):
    payload = model_dump_without_none(manufacturer)

    if not payload:
        raise HTTPException(status_code=400, detail="No manufacturer fields to update")

    response = (
        supabase
        .table("manufacturers")
        .update(payload)
        .eq("id", manufacturer_id)
        .execute()
    )

    return ensure_updated(response, "Manufacturer")


@router.delete("/manufacturers/{manufacturer_id}")
def delete_manufacturer(manufacturer_id: str, user: dict = Depends(require_admin)):
    response = (
        supabase
        .table("manufacturers")
        .delete()
        .eq("id", manufacturer_id)
        .execute()
    )

    return ensure_deleted(response, "Manufacturer")
