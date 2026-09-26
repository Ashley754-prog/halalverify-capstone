from app.supabase_client import supabase
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.api_route("/health", methods=["GET", "HEAD"])
def health_check() -> dict:
    return {
        "status": "ok",
        "service": "HalalVerify API",
    }


@router.api_route("/", methods=["GET", "HEAD"])
def root_check() -> dict:
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
