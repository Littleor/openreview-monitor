from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Config
from ..schemas import PublicEmailConfig
from ..config import get_settings

router = APIRouter(prefix="/api/public", tags=["public"])

settings = get_settings()


@router.get("/email-config", response_model=PublicEmailConfig)
async def get_email_config(db: Session = Depends(get_db)):
    """Get public email configuration for clients."""
    def get_config_value(key: str, default: str, allow_empty: bool = True) -> str:
        config = db.query(Config).filter(Config.key == key).first()
        if not config or config.value is None:
            return default
        if not allow_empty and not config.value.strip():
            return default
        return config.value

    return PublicEmailConfig(
        from_email=get_config_value("from_email", settings.from_email),
        from_name=get_config_value("from_name", settings.from_name, allow_empty=False)
    )
