from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
import os


def _sqlite_url_from_path(path: str) -> str:
    if path == ":memory:":
        return "sqlite:///:memory:"
    if "://" in path:
        return path

    db_path = Path(path)
    if db_path.is_absolute():
        return f"sqlite:////{db_path.as_posix().lstrip('/')}"

    return f"sqlite:///{db_path.as_posix()}"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Admin
    admin_password: str = "admin"

    # Database
    database_url: str = "sqlite:///./openreview_monitor.db"
    db_path: str = ""

    # SMTP Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = ""

    # Check interval (minutes)
    check_interval: int = 30

    # CORS
    cors_allow_origins: str = "*"
    cors_allow_origin_regex: str = ""

    # JWT Settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    if not os.getenv("DATABASE_URL") and settings.db_path:
        settings.database_url = _sqlite_url_from_path(settings.db_path)
    return settings
