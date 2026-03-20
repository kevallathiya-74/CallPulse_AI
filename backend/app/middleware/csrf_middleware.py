"""CSRF middleware — validates X-Requested-With header on mutating requests."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

MUTATING_METHODS = {"POST", "PUT", "DELETE", "PATCH"}
EXEMPT_PATHS = {"/api/auth/webhook"}  # Webhook uses svix signature instead


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in MUTATING_METHODS:
            path = request.url.path
            if path not in EXEMPT_PATHS:
                xhr = request.headers.get("X-Requested-With", "")
                if xhr != "XMLHttpRequest":
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Invalid request origin"},
                    )
        return await call_next(request)


def setup_csrf(app: FastAPI) -> None:
    app.add_middleware(CSRFMiddleware)
