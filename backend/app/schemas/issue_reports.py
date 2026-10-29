from typing import Optional

from pydantic import BaseModel, Field, field_validator


class IssueReportCreate(BaseModel):
    issue_type: str = Field(..., max_length=150)
    related_to: Optional[str] = Field("product", max_length=50)
    subject_name: Optional[str] = Field(None, max_length=255)
    description: str = Field(..., max_length=3000)
    product_id: Optional[str] = Field(None, max_length=100)
    establishment_id: Optional[str] = Field(None, max_length=100)
    evidence_url: Optional[str] = Field(None, max_length=2048)

    @field_validator("evidence_url")
    @classmethod
    def validate_evidence_url(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        v_clean = v.strip()
        if not (v_clean.startswith("http://") or v_clean.startswith("https://") or v_clean.startswith("data:image/")):
            raise ValueError("evidence_url must be an HTTP/HTTPS URL or image data URI")
        return v_clean
