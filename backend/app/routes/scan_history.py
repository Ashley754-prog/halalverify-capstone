from app.auth import get_current_user
from app.supabase_client import supabase
from fastapi import APIRouter, Depends

router = APIRouter(tags=["scan-history"])


@router.get("/scan-history")
def get_scan_history(user: dict = Depends(get_current_user)):
    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)

    # Check if user has administrative privileges
    is_admin = False
    if user_id:
        profile_res = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
        is_admin = (profile_res.data or {}).get("role") == "admin"

    # Non-admins must have a valid user_id and can only view their own scan history
    if not is_admin:
        if not user_id:
            return {
                "success": True,
                "data": [],
            }
        builder = (
            supabase
            .table("scan_history")
            .select("*, scan_flagged_items(*)")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
        )
    else:
        builder = (
            supabase
            .table("scan_history")
            .select("*, scan_flagged_items(*)")
            .order("created_at", desc=True)
        )

    response = builder.execute()

    return {
        "success": True,
        "data": response.data or [],
    }
