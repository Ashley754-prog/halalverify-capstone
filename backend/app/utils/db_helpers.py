import re
from pydantic import BaseModel

from app.supabase_client import supabase
from fastapi import HTTPException


def sanitize_postgrest_search(query: str, max_length: int = 100) -> str:
    """Sanitize user input for PostgREST .or_() clauses by stripping delimiter characters."""
    if not query:
        return ""
    # Remove PostgREST reserved filter operators and delimiter characters
    cleaned = re.sub(r'[,()\'"%&|{}]', '', query.strip())
    return cleaned[:max_length].strip()


def model_dump_without_none(model: BaseModel):
    return model.model_dump(exclude_none=True)


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
