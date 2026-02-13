from pydantic_settings import BaseSettings
from functools import lru_cache


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

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
