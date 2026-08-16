from app.auth import get_current_user
from app.supabase_client import supabase
from fastapi import APIRouter, Depends

router = APIRouter(tags=["scan-history"])


@router.get("/scan-history")
def get_scan_history(user: dict = Depends(get_current_user)):
    response = (
        supabase
        .table("scan_history")
        .select("*, scan_flagged_items(*)")
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "success": True,
        "data": response.data,
    }
