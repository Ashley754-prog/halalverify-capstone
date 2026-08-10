from typing import Optional

from pydantic import BaseModel


class AdditiveCreate(BaseModel):
    code: str
    name: str
    status: str
    source_description: Optional[str] = None
    reason: Optional[str] = None


class AdditiveUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None
    source_description: Optional[str] = None
    reason: Optional[str] = None


class EstablishmentCreate(BaseModel):
    name: str
    type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    halal_status: str = "needs_review"
    certificate_number: Optional[str] = None
    expiry_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EstablishmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    halal_status: Optional[str] = None
    certificate_number: Optional[str] = None
    expiry_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
