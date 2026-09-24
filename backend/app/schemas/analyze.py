from pydantic import BaseModel, Field, field_validator


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
            if not prefix.startswith("data:image/"):
                raise ValueError("Payload must be an image Data URI (e.g., data:image/jpeg;base64,...).")
            if len(data) < 32:
                raise ValueError("Image base64 payload is truncated or invalid.")
        elif len(clean_v) < 32:
            raise ValueError("Image base64 payload is truncated or invalid.")
        return clean_v

