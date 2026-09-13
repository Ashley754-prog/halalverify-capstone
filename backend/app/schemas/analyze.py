from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    imageBase64: str = Field(..., max_length=15_000_000, description="Base64 image string (max 15MB)")
    mode: str = "label"
