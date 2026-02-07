from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
import logging
import os


DEFAULT_ADMIN_PASSWORD = "admin"
DEFAULT_SECRET_KEY = "your-secret-key-change-in-production"


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
    admin_login_max_attempts: int = 5
    admin_login_window_seconds: int = 300

    # Database
    database_url: str = "sqlite:///./openreview_monitor.db"
    db_path: str = ""

    # SMTP Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = ""
    from_name: str = "OpenReview Monitor"

    # Check interval (minutes)
    check_interval: int = 30

    # Email verification
    email_verification_ttl_minutes: int = 10
    email_verification_cooldown_seconds: int = 60
    email_verification_max_attempts: int = 5
    email_verification_window_seconds: int = 300

    # CORS
    cors_allow_origins: str = "*"
    cors_allow_origin_regex: str = ""

    # JWT Settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # Encryption (optional; falls back to secret_key if empty)
    encryption_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    if not os.getenv("DATABASE_URL") and settings.db_path:
        settings.database_url = _sqlite_url_from_path(settings.db_path)
    return settings


def validate_security_settings(settings: Settings) -> None:
    """Prevent startup if insecure default secrets are in use."""
    issues = []
    if settings.admin_password == DEFAULT_ADMIN_PASSWORD:
        issues.append("ADMIN_PASSWORD is set to the default value")
    if settings.secret_key == DEFAULT_SECRET_KEY:
        issues.append("SECRET_KEY is set to the default value")

    if issues:
        logger = logging.getLogger(__name__)
        for issue in issues:
            logger.error(issue)
        raise RuntimeError(
            "Refusing to start with insecure defaults. "
            "Please set ADMIN_PASSWORD and SECRET_KEY in your environment."
        )
