from typing import Optional

from pydantic import BaseModel, Field, field_validator


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
    phone: Optional[str] = None
    admin_notes: Optional[str] = None
    description: Optional[str] = None
    certificate_url: Optional[str] = None
    logo_url: Optional[str] = None


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
    phone: Optional[str] = None
    admin_notes: Optional[str] = None
    description: Optional[str] = None
    source_url: Optional[str] = None
    certificate_url: Optional[str] = None
    logo_url: Optional[str] = None


class EstablishmentSubmissionRequest(BaseModel):
    name: str = Field(..., max_length=255)
    type: Optional[str] = Field("Restaurant", max_length=100)
    address: str = Field(..., max_length=500)
    city: Optional[str] = Field("Zamboanga City", max_length=100)
    halal_tier: Optional[str] = Field("halal_certified", max_length=50)  # halal_certified, muslim_owned, muslim_friendly, vegetarian_vegan
    contact_number: Optional[str] = Field(None, max_length=50)
    social_media_url: Optional[str] = Field(None, max_length=2048)
    submitter_role: Optional[str] = Field("community", max_length=50)  # owner, community
    certifying_body_id: Optional[str] = Field(None, max_length=100)
    certificate_number: Optional[str] = Field(None, max_length=150)
    expiry_date: Optional[str] = Field(None, max_length=50)
    certificate_url: Optional[str] = Field(None, max_length=4096)
    logo_url: Optional[str] = Field(None, max_length=4096)
    amenities: Optional[list[str]] = None
    product_names: Optional[list[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator("social_media_url", "certificate_url", "logo_url")
    @classmethod
    def validate_safe_urls(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        v_clean = v.strip()
        if not (v_clean.startswith("http://") or v_clean.startswith("https://") or v_clean.startswith("data:image/")):
            raise ValueError("URL must use http, https, or safe data URI")
        return v_clean
