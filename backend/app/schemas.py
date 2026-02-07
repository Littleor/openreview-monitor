from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# Paper schemas
class PaperPreview(BaseModel):
    """Preview paper info before adding."""
    openreview_id: str
    submission_number: Optional[int] = None
    title: Optional[str]
    venue: Optional[str]
    authors: Optional[List[str]] = None


class PaperPreviewRequest(BaseModel):
    openreview_url: str
    openreview_username: Optional[str] = None
    openreview_password: Optional[str] = None


class PaperCreate(BaseModel):
    openreview_id: str
    submission_number: Optional[int] = None
    title: str
    venue: str
    email: EmailStr
    verification_code: str
    openreview_username: Optional[str] = None
    openreview_password: Optional[str] = None
    notify_on_review: bool = True
    notify_on_review_modified: bool = True
    notify_on_decision: bool = True


class EmailVerificationRequest(BaseModel):
    email: EmailStr
    openreview_id: str


class EmailVerificationResponse(BaseModel):
    message: str
    expires_in_minutes: int


class PaperResponse(BaseModel):
    id: int
    openreview_id: str
    submission_number: Optional[int] = None
    title: Optional[str]
    venue: Optional[str]
    status: str
    last_checked: Optional[datetime]
    created_at: datetime
    subscriber_count: Optional[int] = None
    notified_review: Optional[bool] = None
    notified_decision: Optional[bool] = None

    class Config:
        from_attributes = True


class PaperUpdate(BaseModel):
    title: Optional[str] = None
    venue: Optional[str] = None
    status: Optional[str] = None
    submission_number: Optional[int] = None


# Subscriber schemas
class SubscriberResponse(BaseModel):
    id: int
    paper_id: int
    email: str
    notify_on_review: bool
    notify_on_review_modified: bool
    notify_on_decision: bool
    notified_review: bool
    notified_decision: bool
    created_at: datetime
    paper_title: Optional[str] = None
    paper_venue: Optional[str] = None
    submission_number: Optional[int] = None

    class Config:
        from_attributes = True


# Admin schemas
class AdminLogin(BaseModel):
    password: str


class TokenResponse(BaseModel):
    token: str
    token_type: str = "bearer"


# Config schemas
class ConfigUpdate(BaseModel):
    check_interval: Optional[int] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    from_email: Optional[str] = None
    from_name: Optional[str] = None


class ConfigResponse(BaseModel):
    check_interval: int
    smtp_host: str
    smtp_port: int
    smtp_user: str
    from_email: str
    from_name: str


class PublicEmailConfig(BaseModel):
    from_email: str
    from_name: str


class TestEmailRequest(BaseModel):
    to_email: EmailStr


# Generic response
class MessageResponse(BaseModel):
    message: str
    success: bool = True
