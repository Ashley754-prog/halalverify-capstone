from typing import Optional

from pydantic import BaseModel


class AdditiveCreate(BaseModel):
    code: str
    name: str
    status: str
    origin: Optional[str] = None
    source_description: Optional[str] = None
    reason: Optional[str] = None


class AdditiveUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None
    origin: Optional[str] = None
    source_description: Optional[str] = None
    reason: Optional[str] = None


class HcbRegistryCreate(BaseModel):
    name: str
    code: Optional[str] = None
    acronym: Optional[str] = None
    country: Optional[str] = "Philippines"
    status: Optional[str] = "Accredited"
    category: Optional[str] = "Accredited HCB"
    accreditation_details: Optional[str] = None
    website: Optional[str] = None
    seal_url: Optional[str] = None
    validity_period: Optional[str] = None
    registry_reference: Optional[str] = None


class HcbRegistryUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    acronym: Optional[str] = None
    country: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    accreditation_details: Optional[str] = None
    website: Optional[str] = None
    seal_url: Optional[str] = None
    validity_period: Optional[str] = None
    registry_reference: Optional[str] = None



class EstablishmentCreate(BaseModel):
    name: str
    type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    halal_status: str = "needs_review"
    certifying_body_id: Optional[str] = None
    certificate_number: Optional[str] = None
    expiry_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: Optional[str] = "Curated Local Registry"
    source_url: Optional[str] = None
    synced_at: Optional[str] = None


class EstablishmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    halal_status: Optional[str] = None
    certifying_body_id: Optional[str] = None
    certificate_number: Optional[str] = None
    expiry_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: Optional[str] = None
    synced_at: Optional[str] = None


class EstablishmentSubmissionRequest(BaseModel):
    name: str
    type: Optional[str] = "Restaurant"
    address: str
    city: Optional[str] = "Zamboanga City"
    certifying_body_id: Optional[str] = None
    certificate_number: Optional[str] = None
    expiry_date: Optional[str] = None
    certificate_url: Optional[str] = None
    logo_url: Optional[str] = None
    product_names: Optional[list[str]] = None
