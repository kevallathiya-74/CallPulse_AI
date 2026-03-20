from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    # Application
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str

    # Clerk Authentication
    CLERK_SECRET_KEY: str
    CLERK_JWKS_URL: str
    CLERK_AUTHORIZED_PARTIES: str
    CLERK_WEBHOOK_SECRET: str
    CLERK_LEEWAY_SECONDS: int = 5

    # Cookies
    COOKIE_DOMAIN: str = "localhost"
    COOKIE_SECURE: bool = False

    # Session tracking
    SESSION_TRACK_ENABLED: bool = True

    # Security
    RATE_LIMIT_ENABLED: bool = True
    SECURITY_HEADERS_ENABLED: bool = True

    # CORS
    CORS_ORIGINS: str

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # AI Models
    HUGGINGFACE_MODELS_DIR: str = "./models/huggingface"
    WHISPER_MODEL_SIZE: str = "base"
    OLLAMA_URL: str = "http://127.0.0.1:11434"
    OLLAMA_TIMEOUT: int = 120

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    EXPORT_DIR: str = "./exports"
    MAX_FILE_SIZE_MB: int = 50

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Global model cache to hold loaded models to avoid reloading
model_cache = {}

def get_settings():
    return settings
