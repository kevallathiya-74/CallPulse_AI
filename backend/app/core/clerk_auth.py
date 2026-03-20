"""
Clerk authentication middleware for CallPulse AI backend.
Hardened: session tracking, AZP verification, 401 logging, inactive user check.
"""
import logging
from datetime import datetime

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.dialects.postgresql import insert as pg_insert
import httpx
from jose import jwt, JWTError
from typing import Optional, Dict, Any

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.user_session import UserSession

logger = logging.getLogger(__name__)

# HTTP Bearer scheme for Clerk JWT
clerk_bearer = HTTPBearer(auto_error=True)

# ── JWKS cache ──────────────────────────────────────────────────────────────
_jwks_cache: Dict[str, Any] = {}
_jwks_fetched_at: float = 0


async def _get_clerk_public_keys() -> Dict[str, Any]:
    """Fetch Clerk JWKS (JSON Web Key Set) to verify tokens. Cached for 5 minutes."""
    import time
    global _jwks_cache, _jwks_fetched_at

    now = time.time()
    if _jwks_cache and (now - _jwks_fetched_at) < 300:
        return _jwks_cache

    async with httpx.AsyncClient() as client:
        resp = await client.get(settings.CLERK_JWKS_URL, timeout=10.0)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = now
        return _jwks_cache


async def _verify_clerk_token(token: str, request: Optional[Request] = None) -> Dict[str, Any]:
    """Verify a Clerk JWT and return the decoded payload."""
    try:
        # Get JWKS from Clerk
        jwks = await _get_clerk_public_keys()

        # Decode without verification first to get the kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find the matching key
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
                break

        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key",
            )

        # Decode and verify the token.
        # Note: python-jose does not accept `leeway` as a direct kwarg — it must
        # go into `options`. We disable built-in exp check and validate manually
        # so we can apply our own clock-skew tolerance (CLERK_LEEWAY_SECONDS).
        import time as _time
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={
                "verify_aud": False, 
                "verify_exp": False,
                "verify_nbf": False,
                "verify_iat": False
            },
        )
        # Manual exp check with leeway
        exp = payload.get("exp")
        if exp is not None:
            leeway = int(settings.CLERK_LEEWAY_SECONDS)
            if _time.time() > exp + leeway:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired",
                )

        # Verify authorized party (azp) matches configured frontend origin
        azp = payload.get("azp")
        authorized = settings.CLERK_AUTHORIZED_PARTIES.split(",")
        if azp and azp.strip() not in [p.strip() for p in authorized]:
            logger.warning(
                f"AZP mismatch: token azp={azp}, expected one of {authorized}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized client origin",
            )

        return payload

    except JWTError as e:
        # Log 401 with context for audit
        ip = _get_client_ip(request) if request else "unknown"
        endpoint = request.url.path if request else "unknown"
        token_hint = token[:8] + "..." if token else "empty"
        logger.warning(
            f"401 | JWT failed | ip={ip} | endpoint={endpoint} | token_hint={token_hint} | error={e}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch Clerk JWKS: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable",
        )


def _get_client_ip(request: Optional[Request]) -> str:
    """Extract client IP, checking X-Forwarded-For for proxied requests."""
    if not request:
        return "unknown"
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


async def _get_clerk_user_data(clerk_user_id: str) -> Dict[str, Any]:
    """Fetch user data from Clerk API."""
    headers = {
        "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.clerk.com/v1/users/{clerk_user_id}",
            headers=headers,
            timeout=10.0,
        )
        if resp.status_code == 200:
            return resp.json()
    return {}


async def _track_session(
    clerk_user_id: str,
    clerk_session_id: str,
    request: Request,
    db: AsyncSession,
) -> None:
    """Upsert session record in user_sessions for audit tracking."""
    if not settings.SESSION_TRACK_ENABLED:
        return

    ip = _get_client_ip(request)
    ua = request.headers.get("User-Agent", "")[:500]

    try:
        stmt = pg_insert(UserSession).values(
            clerk_user_id=clerk_user_id,
            clerk_session_id=clerk_session_id,
            ip_address=ip,
            user_agent=ua,
            last_active_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
            is_active=True,
        ).on_conflict_do_update(
            index_elements=["clerk_session_id"],
            set_={
                "last_active_at": datetime.utcnow(),
                "ip_address": ip,
                "is_active": True,
            },
        )
        await db.execute(stmt)
        await db.flush()
    except Exception as e:
        # Session tracking is non-fatal — never block auth on tracking failure
        logger.debug(f"Session tracking failed (non-fatal): {e}")


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(clerk_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Clerk-based authentication dependency.
    Verifies the Clerk JWT, tracks the session, then looks up or auto-provisions
    the user in PostgreSQL.
    """
    token = credentials.credentials

    # Verify the Clerk token (with request context for 401 logging)
    payload = await _verify_clerk_token(token, request)

    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )

    # Track session (non-blocking)
    clerk_session_id = payload.get("sid", "unknown")
    await _track_session(clerk_user_id, clerk_session_id, request, db)

    # Find user in local DB by clerk_user_id
    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-provision user on first authenticated request.
        # If the same person already exists by email (legacy/manual record),
        # attach the Clerk ID instead of inserting a duplicate.
        try:
            clerk_data = await _get_clerk_user_data(clerk_user_id)
            email = ""
            if clerk_data.get("email_addresses"):
                email = clerk_data["email_addresses"][0].get("email_address", "")
            first_name = clerk_data.get("first_name") or ""
            last_name = clerk_data.get("last_name") or ""
            full_name = f"{first_name} {last_name}".strip() or email.split("@")[0]
        except Exception as e:
            logger.warning(f"Could not fetch Clerk user data, using token claims: {e}")
            email = payload.get("email", "")
            full_name = payload.get("name", clerk_user_id)

        email = (email or "").strip().lower()
        if not email:
            email = f"{clerk_user_id}@clerk.local"

        # 1) Reuse existing account by email when present
        existing_by_email = None
        email_result = await db.execute(select(User).where(User.email == email))
        existing_by_email = email_result.scalar_one_or_none()

        if existing_by_email:
            if existing_by_email.clerk_user_id != clerk_user_id:
                existing_by_email.clerk_user_id = clerk_user_id
            if full_name and (not existing_by_email.full_name or existing_by_email.full_name == existing_by_email.email.split("@")[0]):
                existing_by_email.full_name = full_name
            existing_by_email.is_active = True
            await db.commit()
            await db.refresh(existing_by_email)
            user = existing_by_email
            logger.info(f"Linked existing user by email to Clerk ID: {clerk_user_id}")
        else:
            # 2) Create new local account
            user = User(
                clerk_user_id=clerk_user_id,
                email=email,
                full_name=full_name or email.split("@")[0],
                role="analyst",
                organization_name=None,
                is_active=True,
            )
            db.add(user)
            try:
                await db.commit()
            except IntegrityError:
                # Concurrent first-login requests: fetch the row that won the race.
                await db.rollback()
                race_result = await db.execute(
                    select(User).where(
                        (User.clerk_user_id == clerk_user_id) | (User.email == email)
                    )
                )
                user = race_result.scalar_one_or_none()
                if not user:
                    raise
            await db.refresh(user)
            logger.info(f"Auto-provisioned new user: {clerk_user_id}")

    # Check active status — return 403 (not 401) for suspended accounts
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended — contact support",
        )

    request.state.user = user
    return user


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Admin-only guard on top of Clerk auth."""
    if current_user.role not in ("admin", "manager"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
