from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
from collections import defaultdict
import logging
from sqlalchemy import or_

from ..database import SessionLocal
from ..models import Paper, Subscriber, Config
from .openreview import OpenReviewService
from .email import EmailService
from ..config import get_settings
from ..utils.crypto import decrypt_value

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def get_email_service() -> EmailService:
    """Get email service with current configuration."""
    settings = get_settings()
    db = SessionLocal()

    try:
        def get_config_value(key: str, default: str) -> str:
            config = db.query(Config).filter(Config.key == key).first()
            return config.value if config else default

        from_name = get_config_value("from_name", settings.from_name)
        from_name = from_name.strip() if from_name else ""
        if not from_name:
            from_name = settings.from_name

        return EmailService(
            smtp_host=get_config_value("smtp_host", settings.smtp_host),
            smtp_port=int(get_config_value("smtp_port", str(settings.smtp_port))),
            smtp_user=get_config_value("smtp_user", settings.smtp_user),
            smtp_password=decrypt_value(get_config_value("smtp_password", settings.smtp_password)),
            from_email=get_config_value("from_email", settings.from_email),
            from_name=from_name,
        )
    finally:
        db.close()


def check_all_papers():
    """
    Check all papers using smart venue-based logic:
    - Group papers by venue
    - For each venue, sort by submission_number and check top 5 first
    - If none of the top 5 have decisions, skip the rest (same venue releases together)
    - If any has decision, continue checking the rest
    """
    logger.info("Starting smart paper check...")
    db = SessionLocal()

    try:
        # Get all papers that still need monitoring.
        # Include empty/null status as a safety net for historical bad data.
        papers = db.query(Paper).filter(
            or_(
                Paper.status.in_(["pending", "reviewed"]),
                Paper.status.is_(None),
                Paper.status == "",
            )
        ).all()

        logger.info(f"Found {len(papers)} papers to check")

        # Group papers by venue
        venue_papers = defaultdict(list)
        for paper in papers:
            venue = paper.venue or "unknown"
            venue_papers[venue].append(paper)

        email_service = get_email_service()

        # Process each venue
        for venue, venue_paper_list in venue_papers.items():
            # Sort by submission_number (papers without number go to the end)
            venue_paper_list.sort(key=lambda p: (
                p.submission_number is None,  # None values go last
                p.submission_number or 0
            ))

            logger.info(f"Checking venue: {venue} ({len(venue_paper_list)} papers)")
            if venue_paper_list:
                submission_nums = [p.submission_number for p in venue_paper_list[:5]]
                logger.info(f"Top 5 submission numbers: {submission_nums}")

            # Check top 5 papers first (by submission number)
            top_papers = venue_paper_list[:5]
            remaining_papers = venue_paper_list[5:]

            any_decision_found = False

            # Check top 5
            for paper in top_papers:
                has_decision = check_single_paper(db, paper, email_service)
                if has_decision:
                    any_decision_found = True

            # If any decision found in top 5, check remaining papers
            if any_decision_found and remaining_papers:
                logger.info(f"Decision found in {venue}, checking remaining {len(remaining_papers)} papers")
                for paper in remaining_papers:
                    check_single_paper(db, paper, email_service)
            elif not any_decision_found and remaining_papers:
                logger.info(f"No decisions in top 5 for {venue}, skipping remaining {len(remaining_papers)} papers")

        db.commit()

    except Exception as e:
        logger.error(f"Error in check_all_papers: {e}")
        db.rollback()
    finally:
        db.close()

    logger.info("Paper check completed")


def check_single_paper(db, paper: Paper, email_service: EmailService) -> bool:
    """
    Check a single paper and send notifications if needed.
    Returns True if a decision was found.
    """
    try:
        logger.info(f"Checking paper: {paper.openreview_id} (Submission #{paper.submission_number})")

        # Create service with credentials if available
        service = OpenReviewService(
            username=decrypt_value(paper.openreview_username),
            password=decrypt_value(paper.openreview_password)
        )

        # Get current status from OpenReview
        status_info = service.check_paper_status(
            paper.openreview_id,
            suppress_errors=False
        )
        new_status = status_info["status"]
        reviews = status_info.get("reviews", [])
        decision = status_info.get("decision")
        has_decision = status_info.get("has_decision", False)
        previous_status = paper.status or ""

        # Check for modified reviews
        stored_reviews_data = paper.review_data or {}
        stored_reviews = stored_reviews_data.get("reviews", [])
        stored_reviews_map = {r["id"]: r for r in stored_reviews}
        
        modified_reviews = []
        for review in reviews:
            rid = review["id"]
            if rid in stored_reviews_map:
                stored_review = stored_reviews_map[rid]
                stored_mdate = stored_review.get("mdate")
                new_mdate = review.get("mdate")
                
                # Check for modification (both must have mdate, and they must differ)
                if stored_mdate and new_mdate and stored_mdate != new_mdate:
                    logger.info(f"Detected modification for review {rid}: {stored_mdate} -> {new_mdate}")
                    modified_reviews.append(review)

        if modified_reviews:
            # Notify subscribers about modifications
            subscribers = db.query(Subscriber).filter(
                Subscriber.paper_id == paper.id,
                Subscriber.notify_on_review_modified == True
            ).all()

            for sub in subscribers:
                # Use a specific flag or logic to avoid spamming? 
                # For now, we notify on every detected change cycle.
                email_service.send_review_modified_notification(
                    to_email=sub.email,
                    paper_title=paper.title,
                    paper_id=paper.openreview_id,
                    venue=paper.venue,
                    modified_reviews=modified_reviews,
                )

        # Update paper info
        paper.last_checked = datetime.utcnow()
        paper.review_data = {"reviews": reviews, "review_count": len(reviews)}

        if decision:
            paper.decision_data = decision

        # Check for new reviews (not yet notified)
        if reviews and previous_status == "pending":
            # Get subscribers who want review notifications and haven't been notified
            subscribers = db.query(Subscriber).filter(
                Subscriber.paper_id == paper.id,
                Subscriber.notify_on_review == True,
                Subscriber.notified_review == False
            ).all()

            for sub in subscribers:
                success = email_service.send_review_notification(
                    to_email=sub.email,
                    paper_title=paper.title,
                    paper_id=paper.openreview_id,
                    venue=paper.venue,
                    reviews=reviews,
                )
                if success:
                    sub.notified_review = True
                    logger.info(f"Notified {sub.email} about reviews for {paper.openreview_id}")

        # Check for decision (not yet notified) - this is the key notification
        if has_decision and decision:
            # Get subscribers who want decision notifications and haven't been notified
            subscribers = db.query(Subscriber).filter(
                Subscriber.paper_id == paper.id,
                Subscriber.notify_on_decision == True,
                Subscriber.notified_decision == False
            ).all()

            for sub in subscribers:
                success = email_service.send_decision_notification(
                    to_email=sub.email,
                    paper_title=paper.title,
                    paper_id=paper.openreview_id,
                    venue=paper.venue,
                    decision=decision.get("decision", "Unknown"),
                    comment=decision.get("comment"),
                    reviews=reviews,
                )
                if success:
                    sub.notified_decision = True
                    logger.info(f"Notified {sub.email} about decision for {paper.openreview_id}")

        # Keep database status aligned with current OpenReview status.
        paper.status = new_status

        db.flush()
        logger.info(f"Paper {paper.openreview_id} updated: status={paper.status}")

        return has_decision

    except Exception as e:
        logger.error(f"Error checking paper {paper.openreview_id}: {e}")
        return False


def start_scheduler(interval_minutes: int = 30):
    """Start the scheduler with the given interval."""
    # Remove existing job if any
    if scheduler.get_job("check_papers"):
        scheduler.remove_job("check_papers")

    scheduler.add_job(
        check_all_papers,
        'interval',
        minutes=interval_minutes,
        id="check_papers",
        replace_existing=True
    )

    if not scheduler.running:
        scheduler.start()

    logger.info(f"Scheduler started with {interval_minutes} minute interval")


def stop_scheduler():
    """Stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
