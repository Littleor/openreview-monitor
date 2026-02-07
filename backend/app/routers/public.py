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
    def get_config_value(key: str, default: str) -> str:
        config = db.query(Config).filter(Config.key == key).first()
        return config.value if config else default

    return PublicEmailConfig(
        from_email=get_config_value("from_email", settings.from_email)
    )
