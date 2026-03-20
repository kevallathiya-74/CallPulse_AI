"""Health check endpoint — enhanced with session, JWKS, and pool status."""
from fastapi import APIRouter, Request
import time
import httpx
import logging

from app.core.config import get_settings, model_cache
from app.core.database import engine
from app.utils.response_utils import success_response
from fastapi_cache.decorator import cache
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.middleware.rate_limit_middleware import limiter
from app.services.ollama_service import get_ollama_model

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])

START_TIME = time.time()
_last_successful_auth: str = ""


def set_last_successful_auth(ts: str) -> None:
    global _last_successful_auth
    _last_successful_auth = ts


@router.api_route("", methods=["GET", "HEAD"])
@limiter.limit("120/minute")
@cache(expire=10)
async def health_check(request: Request):
    """Enhanced health check with session, JWKS, and pool diagnostics."""
    settings = get_settings()
    uptime = int(time.time() - START_TIME)

    # AI model status
    whisper_loaded = "loaded" if "whisper_model" in model_cache else "not loaded"
    sentiment_loaded = "loaded" if "sentiment_model" in model_cache else "not loaded"
    tone_loaded = "loaded" if "tone_model" in model_cache else "not loaded"
    
    ollama_val = await get_ollama_model()
    ollama_connected = "connected" if ollama_val != "fallback" else "disconnected"

    # Active sessions count
    active_sessions = 0
    try:
        async with AsyncSession(engine) as session:
            result = await session.execute(
                text("SELECT COUNT(*) FROM user_sessions WHERE is_active = true")
            )
            active_sessions = result.scalar() or 0
    except Exception:
        pass  # Table may not exist yet

    # Clerk JWKS reachability
    jwks_reachable = False
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.CLERK_JWKS_URL, timeout=5.0)
            jwks_reachable = resp.status_code == 200
    except Exception:
        pass

    # Database pool status
    pool_status = {}
    try:
        pool = engine.pool
        pool_status = {
            "pool_size": pool.size(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
        }
    except Exception:
        pool_status = {"pool_size": 0, "checked_out": 0, "overflow": 0}

    # Determine overall status
    status = "healthy"
    if not jwks_reachable:
        status = "degraded"

    data = {
        "status": status,
        "api": "ok",
        "database": "ok",
        "whisper_model": whisper_loaded,
        "sentiment_model": sentiment_loaded,
        "tone_model": tone_loaded,
        "ollama": ollama_connected,
        "uptime_seconds": uptime,
        "version": settings.APP_VERSION,
        "active_sessions_count": active_sessions,
        "last_successful_auth": _last_successful_auth,
        "clerk_jwks_reachable": jwks_reachable,
        "database_pool_status": pool_status,
    }

    return success_response(data)
