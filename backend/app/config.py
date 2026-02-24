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
    # Comma-separated user IDs to grant admin (e.g. "1" or "1,2"). Applied on startup.
    admin_user_ids: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week
    auth_cookie_name: str = "coursemind_session"
    # Secure cookie only over HTTPS. Set SECURE_COOKIES=false in .env for local dev (HTTP).
    secure_cookies: bool = True

    # Database
    database_url: str = "sqlite:///./study_guider.db"

    # LLM (Gemini)
    gemini_api_key: str = ""

    # File upload
    upload_dir: str = "uploads"
    max_file_size_mb: int = 10
    max_files_per_request: int = 10
    allowed_extensions: set[str] = {"pdf", "txt", "md", "doc", "docx", "rtf", "odt", "html", "htm"}

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


def get_upload_base() -> Path:
    """Return the canonical upload directory (backend-relative). Use this so file paths
    are stable regardless of current working directory when the server starts."""
    return _BACKEND_DIR / get_settings().upload_dir
