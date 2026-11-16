import re
from typing import Optional
from pydantic import BaseModel

from app.supabase_client import supabase
from fastapi import HTTPException


PRIVATE_MODERATION_FIELDS = ("admin_notes", "submitted_by")

SAFE_DATA_IMAGE_RE = re.compile(
    r"^data:image/(?:jpeg|jpg|png|webp|gif|bmp);base64,[a-z0-9+/=\s]+$",
    re.IGNORECASE,
)


def validate_safe_url(
    value: Optional[str],
    *,
    allow_data_image: bool = False,
    allow_relative_path: bool = False,
    allow_none_literal: bool = False,
) -> Optional[str]:
    """Validate external/asset URLs to block XSS (javascript:/vbscript:/SVG data URIs)."""
    if not value:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    lower = cleaned.lower()
    if allow_none_literal and lower == "none":
        return "none"
    if lower.startswith(("http://", "https://")):
        return cleaned
    if allow_relative_path and cleaned.startswith("/") and not cleaned.startswith("//"):
        return cleaned
    if allow_data_image and SAFE_DATA_IMAGE_RE.match(cleaned):
        return cleaned
    raise ValueError("URL must use http, https, or a safe raster image format")


def strip_private_fields(data, *, is_admin: bool = False):
    """Remove internal moderation fields from public API responses unless caller is admin."""
    if is_admin or not data:
        return data
    if isinstance(data, list):
        return [strip_private_fields(item, is_admin=False) for item in data]
    if isinstance(data, dict):
        cleaned = {k: v for k, v in data.items() if k not in PRIVATE_MODERATION_FIELDS}
        if isinstance(cleaned.get("products"), list):
            cleaned["products"] = strip_private_fields(cleaned["products"], is_admin=False)
        return cleaned
    return data


def sanitize_postgrest_search(query: str, max_length: int = 200) -> str:
    """Sanitize user input for PostgREST .or_() clauses by replacing delimiter characters with SQL wildcards."""
    if not query:
        return ""
    # Replace PostgREST reserved delimiters and whitespace runs with SQL wildcards
    cleaned = re.sub(r'[,()\'"%&|{}\s]+', '%', query.strip())
    return cleaned[:max_length].strip('%')


def model_dump_without_none(model: BaseModel):
    data = model.model_dump(exclude_unset=True)
    for k, v in list(data.items()):
        if isinstance(v, str) and not v.strip():
            data[k] = None
    return data


def ensure_updated(response, record_type: str):
    if not response.data:
        raise HTTPException(status_code=404, detail=f"{record_type} not found")

    return {
        "success": True,
        "data": response.data[0],
    }


def ensure_deleted(response, record_type: str):
    if not response.data:
        raise HTTPException(status_code=404, detail=f"{record_type} not found")

    return {
        "success": True,
        "data": response.data[0],
    }


def fetch_table_rows(table_name: str):
    response = supabase.table(table_name).select("*").execute()
    return response.data or []


def count_by_status(rows, field_name: str):
    counts = {}

    for row in rows:
        status = row.get(field_name) or "unknown"
        counts[status] = counts.get(status, 0) + 1

    return counts


def normalize_additive_code(code: str) -> str:
    """
    Normalizes food additive or chemical codes to canonical format.
    Accepts: '120', 'e120', 'E-120', 'INS 120', 'ins-120', '472e'.
    Returns: 'E120', 'E472E', etc. Non-numeric codes are upper-cased.
    """
    if not code:
        return ""
    cleaned = code.strip()
    match = re.match(r"^(?:ins\s*[-]?|e\s*[-]?|#)?\s*(\d+[a-zA-Z]?)$", cleaned, flags=re.I)
    if match:
        return f"E{match.group(1).upper()}"
    return cleaned.upper()

