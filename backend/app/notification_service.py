"""Best-effort in-app notification helpers.

Notifications are a convenience layer: a failure to write one must never break a
submission, verification decision, or report resolution. Every helper therefore
swallows and logs its own errors.
"""

import logging
from typing import Any, Dict, Optional

from app.supabase_client import supabase

logger = logging.getLogger(__name__)


def _short(text: Optional[str], limit: int = 280) -> str:
    cleaned = " ".join((text or "").split())
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 1].rstrip() + "…"


def _default_action_params(
    entity_type: Optional[str],
    action_view: Optional[str],
    action_params: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    params = dict(action_params or {})
    if "tab" not in params and action_view in {"profile", "verification-queue"}:
        if entity_type == "establishment":
            params["tab"] = "establishments"
        elif entity_type == "product":
            params["tab"] = "products"
        elif entity_type == "issue_report":
            params["tab"] = "reports"
    return params


def _insert(rows: list[Dict[str, Any]]) -> None:
    if not rows:
        return
    for row in rows:
        try:
            supabase.rpc(
                "create_system_notification",
                {
                    "p_recipient_id": row["recipient_id"],
                    "p_category": row["category"],
                    "p_title": row["title"],
                    "p_message": row.get("message"),
                    "p_entity_type": row.get("entity_type"),
                    "p_entity_id": row.get("entity_id"),
                    "p_action_view": row.get("action_view"),
                    "p_action_params": row.get("action_params") or {},
                },
            ).execute()
        except Exception:
            try:
                supabase.table("notifications").insert(row).execute()
            except Exception as exc:  # noqa: BLE001 - notifications must never break the caller
                logger.warning("Notification insert skipped: %s", exc)


def notify_user(
    recipient_id: Optional[str],
    *,
    category: str,
    title: str,
    message: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    action_view: Optional[str] = None,
    action_params: Optional[Dict[str, Any]] = None,
) -> None:
    """Send one notification to a specific authenticated user."""
    if not recipient_id:
        return

    _insert(
        [
            {
                "recipient_id": str(recipient_id),
                "category": category,
                "title": title,
                "message": _short(message) or None,
                "entity_type": entity_type,
                "entity_id": str(entity_id) if entity_id else None,
                "action_view": action_view,
                "action_params": _default_action_params(entity_type, action_view, action_params),
            }
        ]
    )


def notify_admins(
    *,
    category: str,
    title: str,
    message: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    action_view: Optional[str] = None,
    action_params: Optional[Dict[str, Any]] = None,
) -> None:
    """Fan out one notification to every administrator profile."""
    try:
        res = supabase.table("profiles").select("id").eq("role", "admin").execute()
        admin_ids = [
            str(row["id"]) for row in (res.data or []) if isinstance(row, dict) and row.get("id")
        ]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not resolve admin recipients: %s", exc)
        return

    if not admin_ids:
        return

    resolved_params = _default_action_params(entity_type, action_view, action_params)
    _insert(
        [
            {
                "recipient_id": admin_id,
                "category": category,
                "title": title,
                "message": _short(message) or None,
                "entity_type": entity_type,
                "entity_id": str(entity_id) if entity_id else None,
                "action_view": action_view,
                "action_params": resolved_params,
            }
            for admin_id in admin_ids
        ]
    )
