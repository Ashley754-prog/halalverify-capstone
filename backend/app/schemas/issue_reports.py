from typing import Optional

from pydantic import BaseModel


class IssueReportCreate(BaseModel):
    issue_type: str
    related_to: Optional[str] = "product"
    subject_name: Optional[str] = None
    description: str
    product_id: Optional[str] = None
    establishment_id: Optional[str] = None
    evidence_url: Optional[str] = None
