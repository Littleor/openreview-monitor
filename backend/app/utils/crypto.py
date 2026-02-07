import base64
import hashlib
import logging
from functools import lru_cache
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from ..config import get_settings

logger = logging.getLogger(__name__)

_PREFIX = "enc:"


def _derive_key(raw: str) -> bytes:
    digest = hashlib.sha256(raw.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


@lru_cache()
def _get_fernet() -> Fernet:
    settings = get_settings()
    source = settings.encryption_key or settings.secret_key
    if not source:
        raise RuntimeError("ENCRYPTION_KEY or SECRET_KEY must be set for encryption.")
    return Fernet(_derive_key(source))


def is_encrypted(value: str) -> bool:
    return value.startswith(_PREFIX)


def encrypt_value(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    if value == "":
        return ""
    if is_encrypted(value):
        return value
    token = _get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")
    return f"{_PREFIX}{token}"


def decrypt_value(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    if value == "":
        return ""
    if not is_encrypted(value):
        return value
    token = value[len(_PREFIX):]
    try:
        return _get_fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        logger.error("Failed to decrypt stored secret. Check ENCRYPTION_KEY/SECRET_KEY.")
        raise ValueError("Invalid encrypted value") from exc
