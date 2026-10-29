from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ManufacturerCreate(BaseModel):
    name: str
    country: Optional[str] = "Philippines"
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    source: Optional[str] = "IDCP Published Registry"
    source_url: Optional[str] = None
    synced_at: Optional[str] = None


class ManufacturerUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    synced_at: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    category: Optional[str] = "Food & Beverage"
    barcode: Optional[str] = None
    establishment_id: Optional[str] = None
    manufacturer_id: Optional[str] = None
    certifying_body_id: Optional[str] = None
    certificate_no: Optional[str] = None
    expiry_date: Optional[str] = None
    status: str = "Halal"
    halal_logo_present: bool = True
    ingredients_summary: Optional[str] = None
    submitted_by: Optional[str] = None
    source: Optional[str] = "Manual Registry Entry"
    source_url: Optional[str] = None
    image_url: Optional[str] = None
    synced_at: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    establishment_id: Optional[str] = None
    manufacturer_id: Optional[str] = None
    certifying_body_id: Optional[str] = None
    certificate_no: Optional[str] = None
    expiry_date: Optional[str] = None
    status: Optional[str] = None
    halal_logo_present: Optional[bool] = None
    ingredients_summary: Optional[str] = None
    submitted_by: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    image_url: Optional[str] = None
    synced_at: Optional[str] = None


class ProductSubmissionRequest(BaseModel):
    name: str = Field(..., max_length=255)
    brand: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field("Food & Beverage", max_length=100)
    barcode: Optional[str] = Field(None, max_length=64)
    halal_tier: Optional[str] = Field("halal_certified", max_length=50)  # halal_certified, pork_free_declared, vegetarian_vegan
    submitter_role: Optional[str] = Field("consumer", max_length=50)  # brand, consumer
    establishment_id: Optional[str] = Field(None, max_length=100)
    manufacturer_id: Optional[str] = Field(None, max_length=100)
    certifying_body: Optional[str] = Field(None, max_length=255)
    certifying_body_id: Optional[str] = Field(None, max_length=100)
    certificate_no: Optional[str] = Field(None, max_length=150)
    expiry_date: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = Field(None, max_length=4096)
    ingredients_summary: Optional[str] = Field(None, max_length=5000)
    source_url: Optional[str] = Field(None, max_length=2048)

    @field_validator("source_url", "image_url")
    @classmethod
    def validate_safe_urls(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        v_clean = v.strip()
        if not (v_clean.startswith("http://") or v_clean.startswith("https://") or v_clean.startswith("data:image/")):
            raise ValueError("URL must use http, https, or safe data URI")
        return v_clean
