from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import re

from ..database import get_db
from ..models import Paper, Subscriber
from ..schemas import (
    PaperCreate, PaperResponse, PaperStatusResponse, MessageResponse,
    PaperPreview, PaperPreviewRequest
)
from ..services.openreview import OpenReviewService

router = APIRouter(prefix="/api/papers", tags=["papers"])


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

        # Add new subscriber to existing paper
        subscriber = Subscriber(
            paper_id=existing_paper.id,
            email=paper_data.email,
            notify_on_review=paper_data.notify_on_review,
            notify_on_review_modified=paper_data.notify_on_review_modified,
            notify_on_decision=paper_data.notify_on_decision
        )
        db.add(subscriber)
        db.commit()

        return MessageResponse(
            message=f"Successfully subscribed to: {existing_paper.title}",
            success=True
        )

    # Create new paper with confirmed info
    paper = Paper(
        openreview_id=paper_data.openreview_id,
        submission_number=paper_data.submission_number,
        title=paper_data.title,
        venue=paper_data.venue,
        openreview_username=paper_data.openreview_username,
        openreview_password=paper_data.openreview_password,
        status="pending"
    )
    db.add(paper)
    db.flush()  # Get the paper ID

    # Create subscriber
    subscriber = Subscriber(
        paper_id=paper.id,
        email=paper_data.email,
        notify_on_review=paper_data.notify_on_review,
        notify_on_review_modified=paper_data.notify_on_review_modified,
        notify_on_decision=paper_data.notify_on_decision
    )
    db.add(subscriber)
    db.commit()

    return MessageResponse(
        message=f"Successfully added: {paper_data.title} (Submission #{paper_data.submission_number})",
        success=True
    )


@router.get("/{paper_id}/status", response_model=PaperStatusResponse)
async def get_paper_status(paper_id: int, db: Session = Depends(get_db)):
    """Get the current status of a paper."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()

    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    return PaperStatusResponse(
        id=paper.id,
        title=paper.title,
        status=paper.status,
        venue=paper.venue,
        review_data=paper.review_data
    )
