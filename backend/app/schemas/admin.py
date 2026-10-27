from typing import Optional
from pydantic import BaseModel, Field


class EstablishmentVerifyRequest(BaseModel):
    status: str = Field(..., description="Approval status: 'VERIFIED' or 'REJECTED'")
    admin_notes: Optional[str] = Field(None, description="Administrative audit notes")
    certificate_number: Optional[str] = Field(None, description="Updated certificate number if corrected")
    expiry_date: Optional[str] = Field(None, description="Updated certificate expiry date")
    certifying_body_id: Optional[str] = Field(None, description="Assigned certifying body ID")
    name: Optional[str] = Field(None, description="Corrected establishment name")
    address: Optional[str] = Field(None, description="Corrected establishment address")


class ProductVerifyRequest(BaseModel):
    status: str = Field(..., description="Approval status: 'VERIFIED' or 'REJECTED'")
    admin_notes: Optional[str] = Field(None, description="Administrative audit notes")
    name: Optional[str] = Field(None, description="Corrected product name")
    brand: Optional[str] = Field(None, description="Corrected product brand")


class ReportResolveRequest(BaseModel):
    status: str = Field(..., description="Resolution status: 'resolved' or 'dismissed'")
    resolution_notes: Optional[str] = Field(None, description="Resolution rationale or actions taken")
    suspend_establishment: Optional[bool] = Field(False, description="Flag or suspend establishment if violation confirmed")
