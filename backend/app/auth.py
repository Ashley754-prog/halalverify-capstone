from fastapi import Depends, HTTPException, Header

from app.supabase_client import supabase


def get_current_user(authorization: str = Header(default=None)) -> dict:
    """Validate the Supabase access token sent by the PWA and return the user."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    token = authorization.split(" ", 1)[1].strip()

    try:
        response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = getattr(response, "user", None)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user


def get_optional_current_user(authorization: str = Header(default=None)):
    """Return the authenticated user if a valid bearer token is provided; otherwise return None for guests."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()

    try:
        response = supabase.auth.get_user(token)
        return getattr(response, "user", None)
    except Exception:
        return None


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Require an authenticated user whose profiles.role is 'admin'."""
    response = (
        supabase
        .table("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .execute()
    )
    role = (response.data or {}).get("role")

    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    return user
