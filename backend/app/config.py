from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings

# Load .env from backend directory so it works regardless of cwd when starting uvicorn
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Auth
    secret_key: str = "change-me-in-production-use-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week

    # Database
    database_url: str = "sqlite:///./study_guider.db"

    # LLM (Gemini)
    gemini_api_key: str = ""

    # File upload
    upload_dir: str = "uploads"
    max_file_size_mb: int = 10
    max_files_per_request: int = 10
    allowed_extensions: set[str] = {"pdf", "txt"}

    # Email (Resend) for verification and password reset
    resend_api_key: str = ""
    email_from: str = ""
    frontend_base_url: str = "https://localhost:5173"

    class Config:
        env_file = _ENV_FILE
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
