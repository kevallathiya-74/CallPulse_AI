"""
Rate limiting middleware — per-endpoint limits with proper headers.
Uses slowapi with specific limits for each endpoint category.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.requests import Request
import time


def _get_user_id_or_ip(request: Request) -> str:
    """Extract clerk_user_id from request state (set by auth), fallback to IP."""
    user = getattr(request.state, "user", None)
    if user and hasattr(user, "clerk_user_id"):
        return f"user:{user.clerk_user_id}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_user_id_or_ip)


async def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom 429 handler with proper headers."""
    retry_after = getattr(exc, "retry_after", 60)
    response = JSONResponse(
        status_code=429,
        content={
            "success": False,
            "status_code": 429,
            "message": f"Too many requests — retry in {retry_after} seconds",
            "data": None,
        },
    )
    response.headers["Retry-After"] = str(retry_after)
    response.headers["X-RateLimit-Limit"] = str(getattr(exc, "limit", "unknown"))
    response.headers["X-RateLimit-Remaining"] = "0"
    response.headers["X-RateLimit-Reset"] = str(int(time.time()) + int(retry_after))
    return response


def setup_rate_limiting(app: FastAPI) -> None:
    """Register rate limiter and custom handler."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)
