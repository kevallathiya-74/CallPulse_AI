"""
Auth router — Clerk-based authentication.
Handles user sync, profile management, session management, and webhook events.
"""
import json
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
import user_agents

from app.core.database import get_db
from app.core.clerk_auth import get_current_user, _get_client_ip
from app.models.user import User
from app.models.user_session import UserSession
from app.schemas.user import UserResponse, UserSyncRequest, UserProfileUpdate, AuthResponse
from app.utils.response_utils import success_response, error_response
from app.core.config import settings
from app.middleware.rate_limit_middleware import limiter

logger = logging.getLogger(__name__)
router = APIRouter(tags=["auth"])


# ── Schemas ─────────────────────────────────────────────────────────────────
class SessionOut(BaseModel):
    id: str
    ip_address: str
    browser: str
    os: str
    device_type: str
    last_active_at: str
    created_at: str
    is_current: bool


# ── User Sync ───────────────────────────────────────────────────────────────
@router.post("/sync", status_code=200)
@limiter.limit("10/minute")
async def sync_user(
    request: Request,
    body: UserSyncRequest = UserSyncRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Called by frontend after Clerk sign-in to ensure user exists in local DB.
    Auto-provisioned by get_current_user, so this just updates org if provided.
    """
    if body.organization_name and not current_user.organization_name:
        current_user.organization_name = body.organization_name
        current_user.last_login = datetime.utcnow()
        await db.commit()
        await db.refresh(current_user)
    else:
        current_user.last_login = datetime.utcnow()
        await db.commit()

    return success_response(
        {
            "user_id": str(current_user.id),
            "clerk_user_id": current_user.clerk_user_id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "organization_name": current_user.organization_name,
        },
        "User synced successfully",
    )


# ── Current User Profile ───────────────────────────────────────────────────
@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return the currently authenticated user from local DB and update last_login."""
    current_user.last_login = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    return success_response({"user": UserResponse.model_validate(current_user).model_dump()})


@router.put("/profile")
async def update_profile(
    body: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's profile."""
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.organization_name is not None:
        current_user.organization_name = body.organization_name

    await db.commit()
    await db.refresh(current_user)

    return success_response(
        {"user": UserResponse.model_validate(current_user).model_dump()},
        "Profile updated successfully",
    )


# ── Session Management ──────────────────────────────────────────────────────
def _mask_ip(ip: str) -> str:
    """Mask last octet of IP for privacy: 192.168.1.100 → 192.168.1.xxx"""
    if not ip:
        return "unknown"
    parts = ip.split(".")
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.{parts[2]}.xxx"
    return ip  # IPv6 or unusual format — return as-is


def _parse_user_agent(ua_string: str) -> dict:
    """Parse user-agent string into browser, OS, device type."""
    try:
        ua = user_agents.parse(ua_string or "")
        return {
            "browser": f"{ua.browser.family} {ua.browser.version_string}".strip(),
            "os": f"{ua.os.family} {ua.os.version_string}".strip(),
            "device_type": "Mobile" if ua.is_mobile else ("Tablet" if ua.is_tablet else "Desktop"),
        }
    except Exception:
        return {"browser": "Unknown", "os": "Unknown", "device_type": "Unknown"}


@router.get("/sessions")
async def list_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active sessions for the current user."""
    result = await db.execute(
        select(UserSession)
        .where(
            UserSession.clerk_user_id == current_user.clerk_user_id,
            UserSession.is_active == True,
        )
        .order_by(UserSession.last_active_at.desc())
    )
    sessions = result.scalars().all()

    # Determine current session from authorization token's sid
    from app.core.clerk_auth import _verify_clerk_token
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = await _verify_clerk_token(token, request)
        current_sid = payload.get("sid", "")
    except Exception:
        current_sid = ""

    out: List[SessionOut] = []
    for s in sessions:
        ua_info = _parse_user_agent(s.user_agent or "")
        out.append(SessionOut(
            id=str(s.id),
            ip_address=_mask_ip(s.ip_address or ""),
            browser=ua_info["browser"],
            os=ua_info["os"],
            device_type=ua_info["device_type"],
            last_active_at=s.last_active_at.isoformat() if s.last_active_at else "",
            created_at=s.created_at.isoformat() if s.created_at else "",
            is_current=(s.clerk_session_id == current_sid),
        ))

    return success_response({"sessions": [s.model_dump() for s in out]})


@router.delete("/session")
async def end_current_session(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark the current session as inactive (called on sign-out)."""
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        from app.core.clerk_auth import _verify_clerk_token
        payload = await _verify_clerk_token(token, request)
        sid = payload.get("sid")
    except Exception:
        sid = None

    if sid:
        await db.execute(
            update(UserSession)
            .where(UserSession.clerk_session_id == sid)
            .values(is_active=False)
        )
        await db.commit()

    # Expire any backend cookies
    from fastapi.responses import JSONResponse
    response = JSONResponse(content={"status": "ok", "message": "Session ended"})
    response.delete_cookie("session", path="/")
    return response


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a specific session (must belong to current user)."""
    result = await db.execute(
        select(UserSession).where(
            UserSession.id == session_id,
            UserSession.clerk_user_id == current_user.clerk_user_id,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_active = False
    await db.commit()

    return success_response(None, "Session revoked")


# ── Webhook ─────────────────────────────────────────────────────────────────
@router.post("/webhook", status_code=200)
@limiter.limit("100/minute")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Receive Clerk webhook events (user.created, user.updated, user.deleted).
    Validates the svix webhook signature.
    """
    raw_body = await request.body()

    webhook_secret = settings.CLERK_WEBHOOK_SECRET
    if webhook_secret and webhook_secret != "whsec_placeholder":
        try:
            from svix.webhooks import Webhook, WebhookVerificationError
            wh = Webhook(webhook_secret)
            headers = {
                "svix-id": request.headers.get("svix-id", ""),
                "svix-timestamp": request.headers.get("svix-timestamp", ""),
                "svix-signature": request.headers.get("svix-signature", ""),
            }
            wh.verify(raw_body, headers)
        except Exception as e:
            logger.warning(f"Webhook signature verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = payload.get("type")
    data = payload.get("data", {})

    if event_type == "user.created":
        clerk_user_id = data.get("id")
        email_addresses = data.get("email_addresses", [])
        email = email_addresses[0].get("email_address", "") if email_addresses else ""
        first_name = data.get("first_name") or ""
        last_name = data.get("last_name") or ""
        full_name = f"{first_name} {last_name}".strip() or email.split("@")[0]

        result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
        existing = result.scalar_one_or_none()

        if not existing:
            new_user = User(
                clerk_user_id=clerk_user_id,
                email=email,
                full_name=full_name,
                role="analyst",
                is_active=True,
            )
            db.add(new_user)
            await db.commit()
            logger.info(f"Webhook: provisioned user {clerk_user_id}")

    elif event_type == "user.updated":
        clerk_user_id = data.get("id")
        result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
        user = result.scalar_one_or_none()

        if user:
            email_addresses = data.get("email_addresses", [])
            if email_addresses:
                user.email = email_addresses[0].get("email_address", user.email)
            first_name = data.get("first_name") or ""
            last_name = data.get("last_name") or ""
            new_full_name = f"{first_name} {last_name}".strip()
            if new_full_name:
                user.full_name = new_full_name
            await db.commit()
            logger.info(f"Webhook: updated user {clerk_user_id}")

    elif event_type == "user.deleted":
        clerk_user_id = data.get("id")
        result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
        user = result.scalar_one_or_none()

        if user:
            user.is_active = False
            # Also deactivate all sessions for this user
            await db.execute(
                update(UserSession)
                .where(UserSession.clerk_user_id == clerk_user_id)
                .values(is_active=False)
            )
            await db.commit()
            logger.info(f"Webhook: soft-deleted user {clerk_user_id}")

    return {"status": "ok", "event": event_type}
