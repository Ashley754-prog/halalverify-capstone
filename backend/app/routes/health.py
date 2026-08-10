from app.supabase_client import supabase
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict:
    return {
        "status": "ok",
        "service": "HalalVerify API",
    }


@router.get("/test-supabase")
def test_supabase():
    response = supabase.table("additives").select("*").limit(5).execute()

    return {
        "success": True,
        "data": response.data,
    }
