import datetime
import logging
from typing import Optional

from app.auth import get_current_user
from app.supabase_client import supabase
from fastapi import APIRouter, Depends, HTTPException, Query

logger = logging.getLogger(__name__)
router = APIRouter(tags=["notifications"])


def _user_id(user) -> Optional[str]:
    uid = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    return str(uid) if uid else None


@router.get("/api/v1/notifications")
@router.get("/notifications")
def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False),
    user: dict = Depends(get_current_user),
):
    """Return the signed-in user's in-app notifications, newest first."""
    uid = _user_id(user)
    if not uid:
        raise HTTPException(status_code=401, detail="Valid user credentials required")

    try:
        builder = (
            supabase.table("notifications")
            .select("*", count="exact")
            .eq("recipient_id", uid)
        )
        if unread_only:
            builder = builder.is_("read_at", "null")
        res = builder.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        unread_res = (
            supabase.table("notifications")
            .select("id", count="exact", head=True)
            .eq("recipient_id", uid)
            .is_("read_at", "null")
            .execute()
        )

        return {
            "success": True,
            "data": res.data or [],
            "count": len(res.data or []),
            "total": res.count if res.count is not None else len(res.data or []),
            "unread_count": unread_res.count or 0,
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not load notifications: %s", exc)
        raise HTTPException(status_code=503, detail="Notifications are temporarily unavailable")


@router.patch("/api/v1/notifications/{notification_id}/read")
@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    user: dict = Depends(get_current_user),
):
    """Mark one of the signed-in user's notifications as read."""
    uid = _user_id(user)
    if not uid:
        raise HTTPException(status_code=401, detail="Valid user credentials required")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        res = (
            supabase.table("notifications")
            .update({"read_at": now_iso})
            .eq("id", notification_id)
            .eq("recipient_id", uid)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not mark notification read: %s", exc)
        raise HTTPException(status_code=503, detail="Notifications are temporarily unavailable")

    if not res.data:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"success": True, "data": res.data[0]}


@router.post("/api/v1/notifications/read-all")
@router.post("/notifications/read-all")
def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark every unread notification for the signed-in user as read."""
    uid = _user_id(user)
    if not uid:
        raise HTTPException(status_code=401, detail="Valid user credentials required")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        res = (
            supabase.table("notifications")
            .update({"read_at": now_iso})
            .eq("recipient_id", uid)
            .is_("read_at", "null")
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not mark all notifications read: %s", exc)
        raise HTTPException(status_code=503, detail="Notifications are temporarily unavailable")

    return {"success": True, "updated": len(res.data or [])}
