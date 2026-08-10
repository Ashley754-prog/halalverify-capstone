from app.supabase_client import supabase
from fastapi import APIRouter

router = APIRouter(tags=["scan-history"])


@router.get("/scan-history")
def get_scan_history():
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
