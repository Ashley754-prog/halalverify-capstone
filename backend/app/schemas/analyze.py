from pydantic import BaseModel, Field, field_validator
from app.utils.db_helpers import SAFE_DATA_IMAGE_RE


class AnalyzeRequest(BaseModel):
    imageBase64: str = Field(..., max_length=12_000_000, description="Base64 image string (max ~8MB decoded)")
    mode: str = Field(default="label", pattern="^(label|certificate)$")

    @field_validator("imageBase64")
    @classmethod
    def validate_image_payload(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("imageBase64 payload cannot be empty.")
        clean_v = v.strip()
        if "," in clean_v:
            prefix, data = clean_v.split(",", 1)
            prefix_lower = prefix.lower()
            if "svg" in prefix_lower or not SAFE_DATA_IMAGE_RE.match(clean_v):
                raise ValueError("Payload must be a safe raster image Data URI (jpeg, png, webp, gif, or bmp).")
            if len(data) < 32:
                raise ValueError("Image base64 payload is truncated or invalid.")
        elif len(clean_v) < 32:
            raise ValueError("Image base64 payload is truncated or invalid.")
        return clean_v

