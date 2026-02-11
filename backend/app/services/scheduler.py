from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from collections import defaultdict
from threading import Lock
from typing import Any, Callable, Dict, List, Optional, Tuple
import logging
import time
from sqlalchemy import and_, or_

from ..database import SessionLocal
from ..models import Paper, Subscriber, Config
from .openreview import OpenReviewService
from .email import EmailService
from ..config import get_settings
from ..utils.crypto import decrypt_value

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
_scheduler_run_lock = Lock()
_SCHEDULER_TICK_MINUTES = 1
_VENUE_PROBE_COUNT = 5


def get_email_service() -> EmailService:
    """Get email service with current configuration."""
    settings = get_settings()
    db = SessionLocal()

    try:
        def get_config_value(key: str, default: str) -> str:
            config = db.query(Config).filter(Config.key == key).first()
            return config.value if config and config.value is not None else default

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


def _get_int_config(db, key: str, default: int) -> int:
    config = db.query(Config).filter(Config.key == key).first()
    if not config or config.value is None:
        return max(1, default)
    try:
        return max(1, int(config.value))
    except (TypeError, ValueError):
        logger.warning("Invalid integer config for %s=%s, using default=%s", key, config.value, default)
        return max(1, default)


def _get_float_config(db, key: str, default: float, min_value: float = 0.0) -> float:
    config = db.query(Config).filter(Config.key == key).first()
    if not config or config.value is None:
        return max(min_value, default)
    try:
        return max(min_value, float(config.value))
    except (TypeError, ValueError):
        logger.warning("Invalid float config for %s=%s, using default=%s", key, config.value, default)
        return max(min_value, default)


def _get_runtime_intervals(db) -> Tuple[int, int, float]:
    settings = get_settings()
    decision_interval = _get_int_config(db, "check_interval", settings.check_interval)
    review_mod_interval = _get_int_config(
        db,
        "review_mod_check_interval",
        settings.review_mod_check_interval
    )
    review_mod_request_gap_seconds = _get_float_config(
        db,
        "review_mod_request_gap_seconds",
        settings.review_mod_request_gap_seconds,
        min_value=0.0,
    )
    return decision_interval, review_mod_interval, review_mod_request_gap_seconds


def _is_due(last_checked: Optional[datetime], interval_minutes: int, now: datetime) -> bool:
    if last_checked is None:
        return True
    return now - last_checked >= timedelta(minutes=interval_minutes)


def _extract_reviews_from_cache(paper: Paper) -> List[Dict[str, Any]]:
    stored_reviews_data = paper.review_data or {}
    reviews = stored_reviews_data.get("reviews", [])
    if not isinstance(reviews, list):
        return []
    return [r for r in reviews if isinstance(r, dict)]


def _build_review_map(reviews: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    review_map: Dict[str, Dict[str, Any]] = {}
    for review in reviews:
        rid = review.get("id")
        if rid:
            review_map[rid] = review
    return review_map


def _detect_modified_reviews(
    stored_reviews: List[Dict[str, Any]],
    reviews: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    stored_reviews_map = _build_review_map(stored_reviews)
    modified_reviews: List[Dict[str, Any]] = []

    for review in reviews:
        rid = review.get("id")
        if not rid or rid not in stored_reviews_map:
            continue

        stored_review = stored_reviews_map[rid]
        stored_mdate = stored_review.get("mdate")
        new_mdate = review.get("mdate")

        # Modification detection is based on mdate change for the same review id.
        if stored_mdate and new_mdate and stored_mdate != new_mdate:
            logger.info("Detected modification for review %s: %s -> %s", rid, stored_mdate, new_mdate)
            modified_reviews.append(review)

    return modified_reviews


def _build_cached_status_info(paper: Paper) -> Dict[str, Any]:
    reviews = _extract_reviews_from_cache(paper)
    decision = paper.decision_data if isinstance(paper.decision_data, dict) else None
    status = paper.status or ""
    if not status:
        if decision:
            status = "decided"
        elif reviews:
            status = "reviewed"
        else:
            status = "pending"

    return {
        "status": status,
        "reviews": reviews,
        "decision": decision,
        "review_count": len(reviews),
        "has_decision": decision is not None,
    }


def _decision_signature(decision: Optional[Dict[str, Any]]) -> Tuple[Any, Any, Any]:
    """Create a comparable signature for decision snapshots."""
    if not isinstance(decision, dict):
        return (None, None, None)
    return (
        decision.get("decision"),
        decision.get("comment"),
        decision.get("mdate"),
    )


def _send_review_modified_notifications(
    db,
    paper: Paper,
    email_service: EmailService,
    modified_reviews: List[Dict[str, Any]],
) -> None:
    if not modified_reviews:
        return

    subscribers = db.query(Subscriber).filter(
        Subscriber.paper_id == paper.id,
        Subscriber.notify_on_review_modified == True
    ).all()

    for sub in subscribers:
        email_service.send_review_modified_notification(
            to_email=sub.email,
            paper_title=paper.title,
            paper_id=paper.openreview_id,
            venue=paper.venue,
            modified_reviews=modified_reviews,
        )


def _send_review_notifications(
    db,
    paper: Paper,
    email_service: EmailService,
    reviews: List[Dict[str, Any]],
) -> None:
    if not reviews:
        return

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
            logger.info("Notified %s about reviews for %s", sub.email, paper.openreview_id)


def _send_decision_notifications(
    db,
    paper: Paper,
    email_service: EmailService,
    decision: Dict[str, Any],
    reviews: List[Dict[str, Any]],
) -> None:
    if not decision:
        return

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
            logger.info("Notified %s about decision for %s", sub.email, paper.openreview_id)


def _mark_existing_notifications_as_sent(
    db,
    paper: Paper,
    reviews: List[Dict[str, Any]],
    decision: Optional[Dict[str, Any]],
) -> None:
    """Update subscriber flags so historical data will not trigger delayed notifications."""
    has_reviews = bool(reviews)
    has_decision = bool(decision)
    if not has_reviews and not has_decision:
        return

    subscribers = db.query(Subscriber).filter(Subscriber.paper_id == paper.id).all()
    for sub in subscribers:
        if has_reviews and sub.notify_on_review and not sub.notified_review:
            sub.notified_review = True
        if has_decision and sub.notify_on_decision and not sub.notified_decision:
            sub.notified_decision = True


def _check_single_paper(
    db,
    paper: Paper,
    email_service: EmailService,
    now: datetime,
    decision_interval_minutes: int,
    review_mod_interval_minutes: int,
    run_decision_checks: bool,
    run_review_mod_checks: bool,
    force: bool = False,
    send_notifications: bool = True,
    mark_existing_notifications_as_sent: bool = False,
) -> Tuple[bool, bool, bool]:
    """
    Check a single paper according to enabled check types.
    Returns (has_decision, fetched_from_openreview, state_changed).
    """
    try:
        should_run_decision = run_decision_checks and (
            force or _is_due(paper.last_decision_checked, decision_interval_minutes, now)
        )
        should_run_review_mod = run_review_mod_checks and (
            force or _is_due(paper.last_review_mod_checked, review_mod_interval_minutes, now)
        )

        if not should_run_decision and not should_run_review_mod:
            has_decision = bool(paper.decision_data) or (paper.status in {"accepted", "rejected", "decided"})
            return has_decision, False, False

        shared_interval_minutes = max(1, min(decision_interval_minutes, review_mod_interval_minutes))
        use_cached_snapshot = (
            not force
            and paper.last_checked is not None
            and (now - paper.last_checked) < timedelta(minutes=shared_interval_minutes)
        )

        status_info: Dict[str, Any]
        fetched_from_openreview = False
        state_changed = False
        previous_status = paper.status or "pending"
        previous_reviews = _extract_reviews_from_cache(paper)
        previous_review_count = len(previous_reviews)
        previous_decision = paper.decision_data if isinstance(paper.decision_data, dict) else None

        if use_cached_snapshot:
            status_info = _build_cached_status_info(paper)
            logger.info(
                "Using cached status for paper %s (last_checked=%s)",
                paper.openreview_id,
                paper.last_checked,
            )
        else:
            logger.info("Checking paper: %s (Submission #%s)", paper.openreview_id, paper.submission_number)
            stored_reviews = _extract_reviews_from_cache(paper)

            service = OpenReviewService(
                username=decrypt_value(paper.openreview_username),
                password=decrypt_value(paper.openreview_password)
            )
            status_info = service.check_paper_status(
                paper.openreview_id,
                suppress_errors=False
            )
            fetched_from_openreview = True

            reviews = status_info.get("reviews", [])
            if not isinstance(reviews, list):
                reviews = []
            decision = status_info.get("decision")
            if not isinstance(decision, dict):
                decision = None

            modified_reviews = _detect_modified_reviews(stored_reviews, reviews)
            if send_notifications and run_review_mod_checks:
                _send_review_modified_notifications(db, paper, email_service, modified_reviews)

            paper.last_checked = now
            paper.review_data = {"reviews": reviews, "review_count": len(reviews)}
            if decision:
                paper.decision_data = decision
            new_status = status_info.get("status", previous_status)
            decision_changed = _decision_signature(previous_decision) != _decision_signature(decision)
            state_changed = (
                new_status != previous_status
                or len(reviews) != previous_review_count
                or decision_changed
                or bool(modified_reviews)
            )
            paper.status = new_status

        reviews = status_info.get("reviews", [])
        if not isinstance(reviews, list):
            reviews = []
        decision = status_info.get("decision")
        if not isinstance(decision, dict):
            decision = None
        has_decision = bool(status_info.get("has_decision", False) and decision)

        if mark_existing_notifications_as_sent:
            _mark_existing_notifications_as_sent(db, paper, reviews, decision)

        if should_run_decision:
            if send_notifications:
                _send_review_notifications(db, paper, email_service, reviews)
                if has_decision:
                    _send_decision_notifications(db, paper, email_service, decision, reviews)
            paper.last_decision_checked = now

        if should_run_review_mod:
            paper.last_review_mod_checked = now

        if fetched_from_openreview:
            logger.info("Paper %s updated: status=%s", paper.openreview_id, paper.status)

        db.flush()
        return has_decision, fetched_from_openreview, state_changed

    except Exception as e:
        logger.error("Error checking paper %s: %s", paper.openreview_id, e)
        return False, False, False


def _check_decisions_smart_impl(
    db,
    email_service: EmailService,
    now: datetime,
    decision_interval_minutes: int,
    review_mod_interval_minutes: int,
    review_mod_request_gap_seconds: float,
    force: bool = False,
) -> None:
    """
    Decision/review availability checker with venue optimization:
    - Group papers by venue
    - For each venue, sort by submission_number and check front probe papers first
    - If none of the probe papers changed, skip the rest
    - If any probe paper changed, continue checking the rest
    """
    notification_pending_ids = db.query(Paper.id).join(
        Subscriber, Subscriber.paper_id == Paper.id
    ).filter(
        or_(
            and_(
                Subscriber.notify_on_review == True,
                Subscriber.notified_review == False,
            ),
            and_(
                Subscriber.notify_on_decision == True,
                Subscriber.notified_decision == False,
            ),
        )
    ).distinct().subquery()

    papers = db.query(Paper).filter(
        or_(
            Paper.status.in_(["pending", "reviewed"]),
            Paper.status.is_(None),
            Paper.status == "",
            Paper.id.in_(notification_pending_ids.select()),
        )
    ).all()

    logger.info("Decision check: found %d papers to evaluate", len(papers))

    venue_papers = defaultdict(list)
    for paper in papers:
        venue = paper.venue or "unknown"
        venue_papers[venue].append(paper)

    for venue, venue_paper_list in venue_papers.items():
        venue_paper_list.sort(key=lambda p: (
            p.submission_number is None,
            p.submission_number or 0
        ))

        logger.info("Decision check venue: %s (%d papers)", venue, len(venue_paper_list))
        top_papers = venue_paper_list[:_VENUE_PROBE_COUNT]
        remaining_papers = venue_paper_list[_VENUE_PROBE_COUNT:]

        any_probe_changed = False
        for paper in top_papers:
            _, _, state_changed = _check_single_paper(
                db=db,
                paper=paper,
                email_service=email_service,
                now=now,
                decision_interval_minutes=decision_interval_minutes,
                review_mod_interval_minutes=review_mod_interval_minutes,
                run_decision_checks=True,
                run_review_mod_checks=False,
                force=force,
            )
            if state_changed:
                any_probe_changed = True

        if (any_probe_changed or force) and remaining_papers:
            logger.info(
                "Decision check: continuing venue %s for remaining %d papers",
                venue,
                len(remaining_papers),
            )
            for paper in remaining_papers:
                _check_single_paper(
                    db=db,
                    paper=paper,
                    email_service=email_service,
                    now=now,
                    decision_interval_minutes=decision_interval_minutes,
                    review_mod_interval_minutes=review_mod_interval_minutes,
                    run_decision_checks=True,
                    run_review_mod_checks=False,
                    force=force,
                )
        elif remaining_papers:
            logger.info(
                "Decision check: no changes in top %d for %s, skipping remaining %d papers",
                _VENUE_PROBE_COUNT,
                venue,
                len(remaining_papers),
            )


def _check_review_modifications_all_impl(
    db,
    email_service: EmailService,
    now: datetime,
    decision_interval_minutes: int,
    review_mod_interval_minutes: int,
    review_mod_request_gap_seconds: float,
    force: bool = False,
) -> None:
    """
    Full review-modification monitor:
    - Targets papers that have at least one subscriber with review-mod notifications enabled
    - Only checks papers that are already reviewed (status or cached reviews)
    - Applies full status sync and modified review detection
    """
    candidates = db.query(Paper).join(
        Subscriber, Subscriber.paper_id == Paper.id
    ).filter(
        Subscriber.notify_on_review_modified == True
    ).distinct().all()

    reviewed_statuses = {"reviewed", "accepted", "rejected", "decided"}
    papers = [
        paper for paper in candidates
        if (paper.status in reviewed_statuses) or bool(_extract_reviews_from_cache(paper))
    ]

    papers.sort(key=lambda p: (
        p.venue or "",
        p.submission_number is None,
        p.submission_number or 0,
        p.id,
    ))

    logger.info(
        "Review-mod check: found %d subscribed papers, %d review-ready papers to evaluate",
        len(candidates),
        len(papers),
    )

    for idx, paper in enumerate(papers):
        _, fetched_from_openreview, _ = _check_single_paper(
            db=db,
            paper=paper,
            email_service=email_service,
            now=now,
            decision_interval_minutes=decision_interval_minutes,
            review_mod_interval_minutes=review_mod_interval_minutes,
            run_decision_checks=False,
            run_review_mod_checks=True,
            force=force,
        )
        has_more = idx < len(papers) - 1
        if fetched_from_openreview and has_more and review_mod_request_gap_seconds > 0:
            time.sleep(review_mod_request_gap_seconds)


def _sync_all_papers_status_silent_impl(
    db,
    email_service: EmailService,
    now: datetime,
    decision_interval_minutes: int,
    review_mod_interval_minutes: int,
    review_mod_request_gap_seconds: float,
    force: bool = True,
) -> None:
    """
    Full status synchronization without sending notifications.
    - Scans all papers
    - Refreshes status/review/decision cache
    - Marks existing review/decision notifications as already handled
    """
    papers = db.query(Paper).order_by(Paper.id).all()
    logger.info("Silent sync: found %d papers to evaluate", len(papers))

    for idx, paper in enumerate(papers):
        _, fetched_from_openreview, _ = _check_single_paper(
            db=db,
            paper=paper,
            email_service=email_service,
            now=now,
            decision_interval_minutes=decision_interval_minutes,
            review_mod_interval_minutes=review_mod_interval_minutes,
            run_decision_checks=True,
            run_review_mod_checks=True,
            force=force,
            send_notifications=False,
            mark_existing_notifications_as_sent=True,
        )
        has_more = idx < len(papers) - 1
        if fetched_from_openreview and has_more and review_mod_request_gap_seconds > 0:
            time.sleep(review_mod_request_gap_seconds)


def _run_check_job(
    job_name: str,
    runner: Callable[[Any, EmailService, datetime, int, int, float, bool], None],
    force: bool = False,
) -> None:
    if not _scheduler_run_lock.acquire(blocking=False):
        logger.info("Skipping %s because another check job is already running", job_name)
        return

    db = SessionLocal()
    try:
        decision_interval, review_mod_interval, review_mod_request_gap_seconds = _get_runtime_intervals(db)
        email_service = get_email_service()
        now = datetime.utcnow()
        logger.info(
            "Starting %s (decision_interval=%sm, review_mod_interval=%sm, review_mod_gap=%ss, force=%s)",
            job_name,
            decision_interval,
            review_mod_interval,
            review_mod_request_gap_seconds,
            force,
        )
        runner(
            db,
            email_service,
            now,
            decision_interval,
            review_mod_interval,
            review_mod_request_gap_seconds,
            force,
        )
        db.commit()
    except Exception as e:
        logger.error("Error in %s: %s", job_name, e)
        db.rollback()
    finally:
        db.close()
        _scheduler_run_lock.release()
        logger.info("%s completed", job_name)


def check_decisions_smart(force: bool = False):
    """Check decision/review availability with venue-based top-5 optimization."""
    _run_check_job("check_decisions_smart", _check_decisions_smart_impl, force=force)


def check_review_modifications_all(force: bool = False):
    """Check review modifications for all papers that enabled review-mod notifications."""
    _run_check_job(
        "check_review_modifications_all",
        _check_review_modifications_all_impl,
        force=force,
    )


def sync_all_papers_status_silent(force: bool = True):
    """Run a one-time full status sync without sending any notifications."""
    _run_check_job(
        "sync_all_papers_status_silent",
        _sync_all_papers_status_silent_impl,
        force=force,
    )


def check_all_papers(force: bool = False):
    """Run two-phase checks: venue smart probe first, then review-mod full pass."""
    def _run_both(
        db,
        email_service,
        now,
        decision_interval,
        review_mod_interval,
        review_mod_request_gap_seconds,
        run_force
    ):
        _check_decisions_smart_impl(
            db=db,
            email_service=email_service,
            now=now,
            decision_interval_minutes=decision_interval,
            review_mod_interval_minutes=review_mod_interval,
            review_mod_request_gap_seconds=review_mod_request_gap_seconds,
            force=run_force,
        )
        _check_review_modifications_all_impl(
            db=db,
            email_service=email_service,
            now=now,
            decision_interval_minutes=decision_interval,
            review_mod_interval_minutes=review_mod_interval,
            review_mod_request_gap_seconds=review_mod_request_gap_seconds,
            force=run_force,
        )

    _run_check_job("check_all_papers", _run_both, force=force)


def start_scheduler(interval_minutes: int = 30):
    """Start scheduler with one dispatcher job running two sequential phases."""
    for job_id in ["check_papers", "check_decisions", "check_review_modifications"]:
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)

    scheduler.add_job(
        check_all_papers,
        "interval",
        minutes=_SCHEDULER_TICK_MINUTES,
        id="check_papers",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    if not scheduler.running:
        scheduler.start()

    logger.info(
        "Scheduler started with %d-minute dispatcher tick (initial decision default=%dm)",
        _SCHEDULER_TICK_MINUTES,
        interval_minutes,
    )


def stop_scheduler():
    """Stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
