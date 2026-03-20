import os
import sys
import asyncio
from importlib.metadata import version as pkg_version, PackageNotFoundError
from contextlib import asynccontextmanager

# Fix OpenMP duplicate lib crash (libiomp5md.dll conflict with PyTorch/transformers)
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

from loguru import logger
from dotenv import load_dotenv

# 1. Load .env before anything else
load_dotenv()

import logging
# Disable noisy Uvicorn access logs
logging.getLogger("uvicorn.access").disabled = True

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text
from app.core.config import get_settings
from app.core.database import engine, Base

import httpx

from slowapi.middleware import SlowAPIMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from app.routers import auth, analyze, reports, agents, dashboard, demo, roi, health
from app.middleware import setup_cors, setup_rate_limiting, setup_logging_middleware, setup_security_headers

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 2. Configure loguru
    logger.remove()
    logger.add(sys.stdout, format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}", level=settings.LOG_LEVEL)
    
    os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
    logger.add(
        settings.LOG_FILE,
        rotation="1 day", 
        retention="7 days",
        level=settings.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
    )
    
    # 3. Create Upload Dir
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # 4. Create Export Dir
    os.makedirs(settings.EXPORT_DIR, exist_ok=True)
    # 5. Create HuggingFace Models Dir
    os.makedirs(settings.HUGGINGFACE_MODELS_DIR, exist_ok=True)
    
    # 6. Initialize SQLAlchemy DB
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("PostgreSQL connection verified")
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified")
    except Exception as e:
        logger.error(f"PostgreSQL connection FAILED: {e}")
        logger.error("Check DATABASE_URL in .env and ensure PostgreSQL is running")
        raise SystemExit(1)
        
    # 7. Load Whisper model
    try:
        from app.services.whisper_service import load_whisper_model
        load_whisper_model()
    except Exception as e:
        logger.warning(f"Whisper not loaded: {e}")

    # 8. Load Sentiment Model
    try:
        from app.services.sentiment_service import load_sentiment_model
        load_sentiment_model()
    except Exception as e:
        logger.warning(f"Sentiment model not loaded: {e}")

    # 9. Scan for Tone/Emotion model
    try:
        from app.services.tone_service import load_tone_model
        load_tone_model()
    except Exception as e:
        logger.warning(f"Tone model not loaded: {e}")

    # 10. Load spaCy core
    try:
        import spacy
        spacy.blank("en")
        logger.info("spaCy core loaded")
    except Exception:
        logger.warning("spaCy not loaded — using regex fallback")

    # 11. Test Ollama connection
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.OLLAMA_URL}/api/tags", timeout=5.0)
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                best_model = models[0]["name"] if models else "llama3.1:8b"
                logger.info(f"Ollama connected — using model: {best_model}")
            else:
                logger.warning("Ollama offline — LLM features will use fallback")
    except Exception:
        logger.warning("Ollama offline — LLM features will use fallback")
    
    logger.info(f"CallPulse AI v{settings.APP_VERSION} ready — http://localhost:8000")
    
    FastAPICache.init(InMemoryBackend(), prefix="callpulse-cache")
    
    yield
    
    logger.info("Shutting down CallPulse AI cleanly")
    await engine.dispose()


app = FastAPI(
    title="CallPulse AI",
    version=get_settings().APP_VERSION,
    lifespan=lifespan
)

# Compress larger JSON responses to reduce transfer size and time.
app.add_middleware(GZipMiddleware, minimum_size=500)

# 12. Register App Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])
app.include_router(roi.router, prefix="/api/roi", tags=["roi"])
app.include_router(health.router, prefix="/api/health", tags=["health"])

# 13. Apply middlewares
# In FastAPI/Starlette, add_middleware is applied in reverse:
# last added = outermost (first to run). So CORS must be added LAST
# to ensure it wraps everything — including preflight OPTIONS handling.
setup_rate_limiting(app)       # innermost
app.add_middleware(SlowAPIMiddleware)  # apply rate limiter
setup_logging_middleware(app)  # next
setup_security_headers(app)    # next
setup_cors(app)                # outermost — MUST be last so CORS runs first on every request

# 14. Global exception handler — ensures all unhandled errors return JSON
# so CORS middleware can attach headers even on 500s
from fastapi import Request as FastAPIRequest
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: FastAPIRequest, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "status_code": 500, "message": "Internal server error", "data": None},
    )

@app.get("/")
async def root():
    return {
        "product": "CallPulse AI",
        "version": get_settings().APP_VERSION,
        "status": "ready"
    }
