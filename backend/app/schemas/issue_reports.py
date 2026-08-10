from typing import Optional

from pydantic import BaseModel


class IssueReportCreate(BaseModel):
    issue_type: str
    related_to: Optional[str] = None
    subject_name: Optional[str] = None
    description: str
