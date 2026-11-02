import logging
from typing import Optional

from app.auth import get_current_user, require_admin
from app.schemas.products import (
    ManufacturerCreate,
    ManufacturerUpdate,
    ProductCreate,
    ProductSubmissionRequest,
    ProductUpdate,
)
from app.supabase_client import supabase
from app.auto_verification_service import evaluate_product_submission
from app.notification_service import notify_admins, notify_user
from app.utils.db_helpers import ensure_deleted, ensure_updated, model_dump_without_none, sanitize_postgrest_search
from fastapi import APIRouter, Depends, HTTPException, Query

logger = logging.getLogger(__name__)
router = APIRouter(tags=["products"])

# Statuses that may be requested through the unauthenticated public catalog.
PUBLIC_PRODUCT_STATUSES = {
    "halal",
    "verified",
    "pork-free declared",
    "vegetarian / vegan",
    "community_listed",
    "doubtful",
}

EXCLUDED_UNVERIFIED_STATUSES = [
    "REJECTED", "rejected", "PENDING_VERIFICATION", "pending",
    "needs_review", "draft", "Expired", "expired",
]


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
    page: Optional[int] = Query(None, ge=1, description="1-based page number (alias for offset)"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    builder = (
        supabase
        .table("products")
        .select("*, manufacturers(*), certifying_bodies(*)", count="exact")
    )

    if query:
        # Search by name or brand or barcode (sanitized to prevent PostgREST filter injection)
        sanitized_query = sanitize_postgrest_search(query)
        if sanitized_query:
            builder = builder.or_(
                f"name.ilike.%{sanitized_query}%,brand.ilike.%{sanitized_query}%,barcode.ilike.%{sanitized_query}%"
            )

    if category:
        builder = builder.eq("category", category)

    if status and status != "all":
        if status.strip().lower() not in PUBLIC_PRODUCT_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid public status filter")
        # Case-insensitive match: stored statuses use display casing (e.g. "Halal").
        builder = builder.ilike("status", status.strip())
    else:
        # By default, exclude rejected, pending, and expired items from public listings
        builder = builder.not_.in_("status", EXCLUDED_UNVERIFIED_STATUSES)

    if manufacturer_id:
        builder = builder.eq("manufacturer_id", manufacturer_id)

    if certifying_body_id:
        builder = builder.eq("certifying_body_id", certifying_body_id)

    if page is not None and offset == 0:
        offset = (page - 1) * limit

    response = builder.order("name").range(offset, offset + limit - 1).execute()

    total = response.count if response.count is not None else len(response.data or [])
    return {
        "success": True,
        "data": response.data or [],
        "count": len(response.data or []),
        "total": total,
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

    row = response.data[0]
    if (row.get("status") or "").strip().lower() in {
        "rejected", "pending_verification", "pending", "needs_review", "draft",
    }:
        # Do not disclose unapproved products through the public detail endpoint.
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "success": True,
        "data": row,
    }


@router.post("/products")
@router.post("/api/v1/products")
def create_product(product: ProductCreate, user: dict = Depends(require_admin)):
    payload = model_dump_without_none(product)
    # Ensure empty string foreign keys are converted to None
    for k in ["manufacturer_id", "certifying_body_id", "establishment_id"]:
        if k in payload and not payload[k]:
            payload[k] = None

    # Ensure source_url is explicitly None if not provided to prevent database default to IDCP URL
    if "source_url" not in payload or payload["source_url"] is None:
        payload["source_url"] = None

    response = (
        supabase
        .table("products")
        .insert(payload)
        .execute()
    )

    return {
        "success": True,
        "data": response.data[0] if response.data else None,
    }


@router.patch("/products/{product_id}")
@router.patch("/api/v1/products/{product_id}")
@router.put("/products/{product_id}")
@router.put("/api/v1/products/{product_id}")
def update_product(product_id: str, product: ProductUpdate, user: dict = Depends(require_admin)):
    payload = product.model_dump(exclude_unset=True)

    if not payload:
        raise HTTPException(status_code=400, detail="No product fields to update")

    for k in ["manufacturer_id", "certifying_body_id", "establishment_id"]:
        if k in payload and not payload[k]:
            payload[k] = None

    # Convert empty strings to None for optional text/date fields so admin can clear them
    for k in ["certificate_no", "expiry_date", "source_url", "barcode", "brand", "ingredients_summary"]:
        if k in payload and isinstance(payload[k], str) and not payload[k].strip():
            payload[k] = None

    response = (
        supabase
        .table("products")
        .update(payload)
        .eq("id", product_id)
        .execute()
    )

    return ensure_updated(response, "Product")


@router.delete("/products/{product_id}")
@router.delete("/api/v1/products/{product_id}")
def delete_product(product_id: str, user: dict = Depends(require_admin)):
    # Decouple foreign keys before deleting
    try:
        supabase.table("issue_reports").update({"product_id": None}).eq("product_id", product_id).execute()
    except Exception as fk_err:
        logger.info("Cascade issue_reports on product delete: %s", fk_err)

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
        sanitized_query = sanitize_postgrest_search(query)
        if sanitized_query:
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


# ---------------------------------------------------------------------------
# Community User Submissions (Auth Required, Status = PENDING_VERIFICATION)
# ---------------------------------------------------------------------------

@router.post("/products/submit")
@router.post("/api/v1/products/submit")
def submit_product(
    submission: ProductSubmissionRequest,
    user: dict = Depends(get_current_user),
):
    """
    Community user product submission endpoint with automated AI verification pipeline.
    High-confidence submissions with clean screened additives and valid HCB certification
    are automatically verified and published live immediately.
    """
    user_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Valid user credentials required")

    product_payload = {
        "name": submission.name.strip(),
        "brand": submission.brand.strip() if submission.brand else None,
        "category": submission.category or "Food & Beverage",
        "barcode": submission.barcode.strip() if submission.barcode else None,
        "halal_tier": submission.halal_tier or "halal_certified",
        "submitter_role": submission.submitter_role or "consumer",
        "establishment_id": submission.establishment_id,
        "manufacturer_id": submission.manufacturer_id,
        "certifying_body": submission.certifying_body,
        "certifying_body_id": submission.certifying_body_id,
        "certificate_no": submission.certificate_no,
        "expiry_date": submission.expiry_date,
        "image_url": submission.image_url,
        "ingredients_summary": submission.ingredients_summary,
        "halal_tier": submission.halal_tier or "halal_certified",
        "submitted_by": str(user_id),
        "source": "Brand Representative Submission" if submission.submitter_role == "brand" else "Community User Submission",
        "source_url": submission.source_url if submission.source_url else None,
    }

    # Execute Automated AI Verification Pipeline
    ai_eval = evaluate_product_submission(product_payload)

    # Apply AI decision and enriched metadata
    product_payload["status"] = ai_eval["status"]
    product_payload["verified_at"] = ai_eval["verified_at"]
    product_payload["verified_by"] = ai_eval["verified_by"]
    product_payload["admin_notes"] = ai_eval["admin_notes"]
    if ai_eval.get("certificate_no") and not product_payload.get("certificate_no"):
        product_payload["certificate_no"] = ai_eval["certificate_no"]
    if ai_eval.get("expiry_date") and not product_payload.get("expiry_date"):
        product_payload["expiry_date"] = ai_eval["expiry_date"]
    if ai_eval.get("certifying_body_id") and not product_payload.get("certifying_body_id"):
        product_payload["certifying_body_id"] = ai_eval["certifying_body_id"]

    valid_prod_cols = {
        "name", "brand", "category", "barcode", "establishment_id", "manufacturer_id",
        "certifying_body_id", "certificate_no", "expiry_date", "image_url",
        "ingredients_summary", "submitted_by", "source", "status", "halal_tier", "verified_at",
        "verified_by", "admin_notes", "source_url"
    }
    clean_payload = {k: v for k, v in product_payload.items() if k in valid_prod_cols and v is not None}
    # Ensure source_url is explicitly None if not provided so postgres does not default to IDCP URL
    if "source_url" not in clean_payload or clean_payload["source_url"] is None:
        clean_payload["source_url"] = None

    try:
        response = (
            supabase
            .table("products")
            .insert(clean_payload)
            .execute()
        )
    except Exception as ins_err:
        err_msg = str(ins_err).lower()
        if "column" in err_msg or "42703" in err_msg or "halal_tier" in err_msg:
            legacy_payload = {k: v for k, v in clean_payload.items() if k != "halal_tier"}
            response = (
                supabase
                .table("products")
                .insert(legacy_payload)
                .execute()
            )
        else:
            raise ins_err

    created_product = response.data[0] if response.data else None
    if not created_product:
        raise HTTPException(status_code=500, detail="Failed to record product submission")

    if ai_eval["is_auto_approved"]:
        msg = (
            "Instant AI Verification Complete! Formally Halal Certified product authenticated and published live to catalog."
            if ai_eval["status"] == "VERIFIED"
            else "Community Screening Complete! Product listed under community declared registry."
        )
    else:
        msg = "Product submitted successfully and queued for standard verification."

    prod_name = created_product.get("name") or "Your product"
    prod_id = created_product.get("id")
    if ai_eval["is_auto_approved"]:
        notify_user(
            user_id,
            category="verification",
            title="Product approved",
            message=f'"{prod_name}" was verified and published to the product catalog.',
            entity_type="product",
            entity_id=prod_id,
            action_view="profile",
        )
    else:
        notify_user(
            user_id,
            category="submission",
            title="Product submitted",
            message=f'"{prod_name}" is queued for verification. Track its status in My Contributions.',
            entity_type="product",
            entity_id=prod_id,
            action_view="profile",
        )
        notify_admins(
            category="submission",
            title="New product submission",
            message=f'"{prod_name}" is awaiting verification.',
            entity_type="product",
            entity_id=prod_id,
            action_view="verification-queue",
        )

    return {
        "success": True,
        "auto_approved": ai_eval["is_auto_approved"],
        "message": msg,
        "data": created_product,
        "audit_trail": ai_eval["audit_trail"],
    }
