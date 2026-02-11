from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import timedelta

from ..database import get_db
from ..models import Paper, Subscriber, Config
from ..schemas import (
    AdminLogin, TokenResponse, PaperResponse, PaperUpdate,
    ConfigResponse, ConfigUpdate, MessageResponse, TestEmailRequest
)
from ..utils.auth import verify_admin_password, create_access_token, get_current_admin
from ..utils.crypto import encrypt_value
from ..utils.rate_limit import RateLimiter
from ..services.scheduler import get_email_service
from ..config import get_settings

router = APIRouter(prefix="/api/admin", tags=["admin"])

settings = get_settings()
login_rate_limiter = RateLimiter(
    settings.admin_login_max_attempts,
    settings.admin_login_window_seconds
)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.post("/login", response_model=TokenResponse)
async def admin_login(login_data: AdminLogin, request: Request):
    """Admin login endpoint."""
    client_ip = _get_client_ip(request)
    blocked, retry_after = login_rate_limiter.is_blocked(client_ip)
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Try again in {retry_after}s.",
            headers={"Retry-After": str(retry_after)}
        )

    if not verify_admin_password(login_data.password):
        login_rate_limiter.add_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    login_rate_limiter.reset(client_ip)
    access_token = create_access_token(
        data={"role": "admin"},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )

    return TokenResponse(token=access_token)


@router.get("/papers", response_model=List[PaperResponse])
async def get_all_papers(
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """Get all monitored papers with subscriber counts and notification status."""
    # Get papers ordered by venue and submission number
    papers = db.query(Paper).order_by(Paper.venue, Paper.submission_number).all()

    result = []
    for paper in papers:
        # Get subscriber stats
        sub_count = db.query(Subscriber).filter(Subscriber.paper_id == paper.id).count()

        # Check if any subscriber has been notified
        any_notified_review = db.query(Subscriber).filter(
            Subscriber.paper_id == paper.id,
            Subscriber.notified_review == True
        ).first() is not None

        any_notified_decision = db.query(Subscriber).filter(
            Subscriber.paper_id == paper.id,
            Subscriber.notified_decision == True
        ).first() is not None

        result.append(PaperResponse(
            id=paper.id,
            openreview_id=paper.openreview_id,
            submission_number=paper.submission_number,
            title=paper.title,
            venue=paper.venue,
            status=paper.status,
            last_checked=paper.last_checked,
            created_at=paper.created_at,
            subscriber_count=sub_count,
            notified_review=any_notified_review,
            notified_decision=any_notified_decision,
        ))

    return result


@router.delete("/papers/{paper_id}", response_model=MessageResponse)
async def delete_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """Delete a paper and all its subscribers."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()

    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    db.delete(paper)
    db.commit()

    return MessageResponse(message="Paper deleted successfully")


@router.put("/papers/{paper_id}", response_model=PaperResponse)
async def update_paper(
    paper_id: int,
    paper_data: PaperUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """Update paper information."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()

    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if paper_data.title is not None:
        paper.title = paper_data.title
    if paper_data.venue is not None:
        paper.venue = paper_data.venue
    if paper_data.status is not None:
        paper.status = paper_data.status
    if paper_data.submission_number is not None:
        paper.submission_number = paper_data.submission_number

    db.commit()
    db.refresh(paper)

    # Get subscriber count
    subscriber_count = db.query(Subscriber).filter(Subscriber.paper_id == paper.id).count()

    return PaperResponse(
        id=paper.id,
        openreview_id=paper.openreview_id,
        submission_number=paper.submission_number,
        title=paper.title,
        venue=paper.venue,
        status=paper.status,
        last_checked=paper.last_checked,
        created_at=paper.created_at,
        subscriber_count=subscriber_count
    )


@router.get("/config", response_model=ConfigResponse)
async def get_config(
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """Get system configuration."""
    def get_config_value(key: str, default: str, allow_empty: bool = True) -> str:
        config = db.query(Config).filter(Config.key == key).first()
        if not config or config.value is None:
            return default
        if not allow_empty and not config.value.strip():
            return default
        return config.value

    return ConfigResponse(
        check_interval=int(get_config_value("check_interval", str(settings.check_interval))),
        review_mod_check_interval=int(
            get_config_value(
                "review_mod_check_interval",
                str(settings.review_mod_check_interval)
            )
        ),
        smtp_host=get_config_value("smtp_host", settings.smtp_host),
        smtp_port=int(get_config_value("smtp_port", str(settings.smtp_port))),
        smtp_user=get_config_value("smtp_user", settings.smtp_user),
        from_email=get_config_value("from_email", settings.from_email),
        from_name=get_config_value("from_name", settings.from_name, allow_empty=False)
    )


@router.put("/config", response_model=MessageResponse)
async def update_config(
    config_data: ConfigUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """Update system configuration."""
    def set_config_value(key: str, value: str):
        config = db.query(Config).filter(Config.key == key).first()
        if config:
            config.value = value
        else:
            config = Config(key=key, value=value)
            db.add(config)

    if config_data.check_interval is not None:
        set_config_value("check_interval", str(config_data.check_interval))
    if config_data.review_mod_check_interval is not None:
        set_config_value("review_mod_check_interval", str(config_data.review_mod_check_interval))
    if config_data.smtp_host is not None:
        set_config_value("smtp_host", config_data.smtp_host)
    if config_data.smtp_port is not None:
        set_config_value("smtp_port", str(config_data.smtp_port))
    if config_data.smtp_user is not None:
        set_config_value("smtp_user", config_data.smtp_user)
    if config_data.smtp_password is not None:
        set_config_value("smtp_password", encrypt_value(config_data.smtp_password))
    if config_data.from_email is not None:
        set_config_value("from_email", config_data.from_email)
    if config_data.from_name is not None:
        set_config_value("from_name", config_data.from_name)

    db.commit()

    return MessageResponse(message="Configuration updated successfully")


@router.post("/test-email", response_model=MessageResponse)
async def send_test_email(
    request: TestEmailRequest,
    _: bool = Depends(get_current_admin)
):
    """Send a test email to verify SMTP configuration."""
    try:
        email_service = get_email_service()
        # Use async version to avoid blocking
        await email_service.send_test_email(request.to_email)
        return MessageResponse(message=f"Test email sent to {request.to_email}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.post("/check-now", response_model=MessageResponse)
async def check_now(
    background_tasks: BackgroundTasks,
    _: bool = Depends(get_current_admin)
):
    """Trigger an immediate check of all papers."""
    from ..services.scheduler import check_all_papers
    background_tasks.add_task(check_all_papers, True)

    return MessageResponse(message="Paper check initiated")
