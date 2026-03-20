"""
Request logging middleware — structured logs with IP, user-agent, timing.
Format: {timestamp} | {status} | {method} {path} | {ip} | {user_agent_short} | {ms}ms
"""
import time
import uuid
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        # Extract client info
        forwarded = request.headers.get("X-Forwarded-For")
        ip = forwarded.split(",")[0].strip() if forwarded else (
            request.client.host if request.client else "unknown"
        )
        ua_raw = request.headers.get("User-Agent", "")
        ua_short = ua_raw[:80] + ("..." if len(ua_raw) > 80 else "")

        response = await call_next(request)

        process_time = (time.time() - start_time) * 1000

        # Extract clerk_user_id if present (set by auth dependency)
        clerk_user_id = ""
        user = getattr(request.state, "user", None)
        if user and hasattr(user, "clerk_user_id"):
            clerk_user_id = f" | user={user.clerk_user_id}"

        # Skip noisy paths and OPTIONS requests
        is_noisy = (
            request.url.path.endswith("/health") 
            or "/status" in request.url.path 
            or request.method == "OPTIONS"
        )
        
        if not is_noisy:
            # Sleek, professional log format
            status_icon = "🟢" if response.status_code < 400 else "🔴"
            logger.info(
                f"[API] {status_icon} {request.method} {request.url.path} | {response.status_code} | {process_time:.1f}ms | ip={ip}"
            )

        # Flag suspicious activity: 401s
        if response.status_code == 401:
            logger.warning(
                f"[AUTH_FAIL] {request.method} {request.url.path} | ip={ip} | rid={request_id}"
            )

        response.headers["X-Request-ID"] = request_id
        return response


def setup_logging_middleware(app: FastAPI) -> None:
    app.add_middleware(LoggingMiddleware)
