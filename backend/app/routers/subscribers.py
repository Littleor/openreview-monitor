from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Subscriber, Paper
from ..schemas import SubscriberResponse, MessageResponse
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/admin/subscribers", tags=["subscribers"])


@router.get("", response_model=List[SubscriberResponse])
async def get_all_subscribers(
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """Get all subscribers with paper information."""
    subscribers = db.query(Subscriber).join(Paper).order_by(
        Paper.venue, Paper.submission_number, Subscriber.id
    ).all()

    result = []
    for sub in subscribers:
        result.append(SubscriberResponse(
            id=sub.id,
            paper_id=sub.paper_id,
            email=sub.email,
            notify_on_review=sub.notify_on_review,
            notify_on_decision=sub.notify_on_decision,
            notified_review=sub.notified_review,
            notified_decision=sub.notified_decision,
            created_at=sub.created_at,
            paper_title=sub.paper.title,
            paper_venue=sub.paper.venue,
            submission_number=sub.paper.submission_number,
        ))

    return result


@router.delete("/{subscriber_id}", response_model=MessageResponse)
async def delete_subscriber(
    subscriber_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """Delete a subscriber."""
    subscriber = db.query(Subscriber).filter(Subscriber.id == subscriber_id).first()

    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    db.delete(subscriber)
    db.commit()

    return MessageResponse(message="Subscriber deleted successfully")


@router.post("/{subscriber_id}/reset-notifications", response_model=MessageResponse)
async def reset_notifications(
    subscriber_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_admin)
):
    """Reset notification status for a subscriber (allows re-sending)."""
    subscriber = db.query(Subscriber).filter(Subscriber.id == subscriber_id).first()

    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    subscriber.notified_review = False
    subscriber.notified_decision = False
    db.commit()

    return MessageResponse(message="Notification status reset")
