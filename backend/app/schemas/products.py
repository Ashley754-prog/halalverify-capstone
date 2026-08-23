from typing import Optional
from pydantic import BaseModel


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
    manufacturer_id: Optional[str] = None
    certifying_body_id: Optional[str] = None
    certificate_no: Optional[str] = None
    expiry_date: Optional[str] = None
    status: str = "Halal"
    halal_logo_present: bool = True
    ingredients_summary: Optional[str] = None
    source: Optional[str] = "IDCP Published Registry"
    source_url: Optional[str] = None
    synced_at: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    manufacturer_id: Optional[str] = None
    certifying_body_id: Optional[str] = None
    certificate_no: Optional[str] = None
    expiry_date: Optional[str] = None
    status: Optional[str] = None
    halal_logo_present: Optional[bool] = None
    ingredients_summary: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    synced_at: Optional[str] = None
