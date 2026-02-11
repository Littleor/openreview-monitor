from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import re
import secrets
import hashlib
import hmac
from datetime import datetime, timedelta

from ..database import get_db
from ..models import Paper, Subscriber, EmailVerification
from ..schemas import (
    PaperCreate, PaperResponse, MessageResponse,
    PaperPreview, PaperPreviewRequest, EmailVerificationRequest, EmailVerificationResponse
)
from ..services.openreview import OpenReviewService
from ..services.scheduler import get_email_service
from ..config import get_settings
from ..utils.crypto import encrypt_value
from ..utils.auth import get_current_admin
from ..utils.rate_limit import RateLimiter

router = APIRouter(prefix="/api/papers", tags=["papers"])
settings = get_settings()
verification_rate_limiter = RateLimiter(
    settings.email_verification_max_attempts,
    settings.email_verification_window_seconds
)
VALID_PAPER_STATUSES = {"pending", "reviewed", "accepted", "rejected", "decided"}


def _hash_verification_code(code: str) -> str:
    return hmac.new(
        settings.secret_key.encode("utf-8"),
        code.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def _generate_verification_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"


def extract_paper_id(url: str) -> str:
    """Extract paper ID from OpenReview URL."""
    # Handle various URL formats
    # https://openreview.net/forum?id=xxx
    # https://openreview.net/pdf?id=xxx
    # Just the ID itself

    if "openreview.net" in url:
        match = re.search(r'[?&]id=([^&]+)', url)
        if match:
            return match.group(1)

    # If it's just the ID
    if re.match(r'^[a-zA-Z0-9_-]+$', url):
        return url

    raise ValueError("Invalid OpenReview URL or ID")


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _normalize_paper_status(status_value: Optional[str]) -> str:
    if status_value in VALID_PAPER_STATUSES:
        return status_value
    return "pending"


@router.post("/preview", response_model=PaperPreview)
async def preview_paper(request: PaperPreviewRequest):
    """
    Preview paper information before adding.
    User confirms the details before subscribing.
    """
    try:
        paper_id = extract_paper_id(request.openreview_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # Use credentials if provided (for private papers)
        service = OpenReviewService(
            username=request.openreview_username,
            password=request.openreview_password
        )
        paper_info = service.get_paper_info(paper_id)

        return PaperPreview(
            openreview_id=paper_id,
            submission_number=paper_info.get("submission_number"),
            title=paper_info.get("title"),
            venue=paper_info.get("venue"),
            authors=paper_info.get("authors", [])
        )
    except Exception as e:
        error_text = str(e)
        if "ForbiddenError" in error_text or "permission" in error_text.lower() or "status': 403" in error_text:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "This paper appears to be private or requires OpenReview login. "
                    "Please enter your OpenReview username and password, or use a public paper URL."
                )
            )
        raise HTTPException(
            status_code=400,
            detail=(
                "Failed to fetch paper info. Please check the OpenReview URL or ID, "
                "and provide credentials if the paper is private."
            )
        )


@router.post("/verify-email", response_model=EmailVerificationResponse)
async def request_email_verification(
    request: EmailVerificationRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """Send a verification code to confirm subscriber email."""
    now = datetime.utcnow()

    client_ip = _get_client_ip(http_request)
    blocked, retry_after = verification_rate_limiter.is_blocked(client_ip)
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many verification requests. Try again in {retry_after}s.",
            headers={"Retry-After": str(retry_after)}
        )
    verification_rate_limiter.add_attempt(client_ip)

    recent = db.query(EmailVerification).filter(
        EmailVerification.email == request.email,
        EmailVerification.openreview_id == request.openreview_id
    ).order_by(EmailVerification.created_at.desc()).first()

    if recent:
        cooldown = settings.email_verification_cooldown_seconds
        seconds_since = (now - recent.created_at).total_seconds()
        if seconds_since < cooldown:
            wait_seconds = int(cooldown - seconds_since)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait_seconds}s before requesting another code."
            )

    db.query(EmailVerification).filter(
        EmailVerification.email == request.email,
        EmailVerification.openreview_id == request.openreview_id,
        EmailVerification.used_at.is_(None)
    ).update(
        {"used_at": now},
        synchronize_session=False
    )

    code = _generate_verification_code()
    expires_at = now + timedelta(minutes=settings.email_verification_ttl_minutes)

    verification = EmailVerification(
        email=request.email,
        openreview_id=request.openreview_id,
        code_hash=_hash_verification_code(code),
        expires_at=expires_at,
        used_at=None
    )
    db.add(verification)
    db.commit()

    try:
        email_service = get_email_service()
        await email_service.send_verification_code(
            to_email=request.email,
            code=code,
            openreview_id=request.openreview_id,
            expires_in_minutes=settings.email_verification_ttl_minutes
        )
    except ValueError as e:
        verification.used_at = now
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        verification.used_at = now
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to send verification email: {str(e)}")

    return EmailVerificationResponse(
        message=f"Verification code sent to {request.email}",
        expires_in_minutes=settings.email_verification_ttl_minutes
    )


def _require_valid_verification(
    db: Session,
    email: str,
    openreview_id: str,
    code: str
) -> EmailVerification:
    now = datetime.utcnow()
    if not code:
        raise HTTPException(
            status_code=400,
            detail="Verification code is required. Please request a code first."
        )

    verification = db.query(EmailVerification).filter(
        EmailVerification.email == email,
        EmailVerification.openreview_id == openreview_id,
        EmailVerification.used_at.is_(None),
        EmailVerification.expires_at > now
    ).order_by(EmailVerification.created_at.desc()).first()

    if not verification:
        raise HTTPException(
            status_code=400,
            detail="Verification code expired or not found. Please request a new code."
        )

    expected_hash = _hash_verification_code(code)
    if not hmac.compare_digest(expected_hash, verification.code_hash):
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code. Please check the code and try again."
        )

    return verification

@router.post("", response_model=MessageResponse)
async def add_paper(paper_data: PaperCreate, db: Session = Depends(get_db)):
    """Add a confirmed paper to monitor."""

    # Check if paper already exists
    existing_paper = db.query(Paper).filter(
        Paper.openreview_id == paper_data.openreview_id
    ).first()

    if existing_paper:
        # Check if this email is already subscribed
        existing_sub = db.query(Subscriber).filter(
            Subscriber.paper_id == existing_paper.id,
            Subscriber.email == paper_data.email
        ).first()

        if existing_sub:
            raise HTTPException(
                status_code=400,
                detail="This email is already subscribed to this paper"
            )

        verification = _require_valid_verification(
            db=db,
            email=paper_data.email,
            openreview_id=paper_data.openreview_id,
            code=paper_data.verification_code
        )

        # Add new subscriber to existing paper
        existing_review_data = existing_paper.review_data or {}
        existing_reviews = existing_review_data.get("reviews", [])
        if not isinstance(existing_reviews, list):
            existing_reviews = []
        has_existing_reviews = bool(existing_reviews) or existing_paper.status in {
            "reviewed",
            "accepted",
            "rejected",
            "decided",
        }
        has_existing_decision = existing_paper.decision_data is not None or existing_paper.status in {
            "accepted",
            "rejected",
            "decided",
        }

        subscriber = Subscriber(
            paper_id=existing_paper.id,
            email=paper_data.email,
            notify_on_review=paper_data.notify_on_review,
            notify_on_review_modified=paper_data.notify_on_review_modified,
            notify_on_decision=paper_data.notify_on_decision,
            notified_review=has_existing_reviews,
            notified_decision=has_existing_decision,
        )
        db.add(subscriber)
        verification.used_at = datetime.utcnow()
        db.commit()

        return MessageResponse(
            message=f"Successfully subscribed to: {existing_paper.title}",
            success=True
        )

    verification = _require_valid_verification(
        db=db,
        email=paper_data.email,
        openreview_id=paper_data.openreview_id,
        code=paper_data.verification_code
    )

    # Fetch current OpenReview status immediately to establish a baseline
    try:
        service = OpenReviewService(
            username=paper_data.openreview_username,
            password=paper_data.openreview_password
        )
        status_info = service.check_paper_status(
            paper_data.openreview_id,
            suppress_errors=False
        )
    except Exception as e:
        error_text = str(e)
        if "ForbiddenError" in error_text or "permission" in error_text.lower() or "status': 403" in error_text:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Failed to fetch current paper status. This paper may be private. "
                    "Please provide valid OpenReview credentials."
                )
            )
        raise HTTPException(
            status_code=400,
            detail=(
                "Failed to fetch current paper status. "
                "Please verify the OpenReview ID and credentials, then try again."
            )
        )

    current_reviews = status_info.get("reviews", [])
    if not isinstance(current_reviews, list):
        current_reviews = []
    current_decision = status_info.get("decision")
    current_status = _normalize_paper_status(status_info.get("status"))

    # Create new paper with confirmed info
    paper = Paper(
        openreview_id=paper_data.openreview_id,
        submission_number=paper_data.submission_number,
        title=paper_data.title,
        venue=paper_data.venue,
        openreview_username=encrypt_value(paper_data.openreview_username),
        openreview_password=encrypt_value(paper_data.openreview_password),
        status=current_status,
        last_checked=datetime.utcnow(),
        review_data={"reviews": current_reviews, "review_count": len(current_reviews)},
        decision_data=current_decision if current_decision else None,
    )
    db.add(paper)
    db.flush()  # Get the paper ID

    # Create subscriber
    subscriber = Subscriber(
        paper_id=paper.id,
        email=paper_data.email,
        notify_on_review=paper_data.notify_on_review,
        notify_on_review_modified=paper_data.notify_on_review_modified,
        notify_on_decision=paper_data.notify_on_decision,
        notified_review=bool(current_reviews),
        notified_decision=bool(current_decision),
    )
    db.add(subscriber)
    verification.used_at = datetime.utcnow()
    db.commit()

    return MessageResponse(
        message=f"Successfully added: {paper_data.title} (Submission #{paper_data.submission_number})",
        success=True
    )
