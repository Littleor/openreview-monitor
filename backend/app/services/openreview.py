import openreview
from typing import Optional, Dict, List, Any
import logging
import re

logger = logging.getLogger(__name__)


class OpenReviewService:
    """Service for interacting with OpenReview API."""

    def __init__(self, username: Optional[str] = None, password: Optional[str] = None):
        """Initialize with optional credentials for private papers."""
        if username and password:
            self.client = openreview.api.OpenReviewClient(
                baseurl='https://api2.openreview.net',
                username=username,
                password=password
            )
        else:
            self.client = openreview.api.OpenReviewClient(
                baseurl='https://api2.openreview.net'
            )

    def get_paper_info(self, paper_id: str) -> Dict[str, Any]:
        """Get basic paper information."""
        try:
            note = self.client.get_note(paper_id)
            content = note.content if hasattr(note, 'content') else {}

            title = None
            venue = None
            authors = []
            submission_number = None

            if isinstance(content, dict):
                # Get title
                title = self._get_content_value(content, "title")

                # Get venue - try multiple fields
                venue = self._get_content_value(content, "venue")
                if not venue:
                    venue = self._get_content_value(content, "venueid")

                # Clean up venue (remove "Conference Submission" suffix)
                if venue:
                    venue = self._clean_venue_name(venue)

                # If still no venue, try to extract from domain
                if not venue and hasattr(note, 'domain'):
                    venue = self._extract_venue_from_domain(note.domain)

                # Get authors
                authors_val = self._get_content_value(content, "authors")
                if isinstance(authors_val, list):
                    authors = authors_val[:5]  # Limit to first 5

            # Get submission number from note.number
            if hasattr(note, 'number') and note.number is not None:
                try:
                    submission_number = int(note.number)
                except (ValueError, TypeError):
                    pass

            return {
                "id": note.id,
                "title": title,
                "venue": venue,
                "authors": authors,
                "forum": note.forum if hasattr(note, 'forum') else paper_id,
                "submission_number": submission_number,
            }
        except Exception as e:
            logger.error(f"Error fetching paper info for {paper_id}: {e}")
            raise

    def _get_content_value(self, content: dict, key: str) -> Any:
        """Extract value from content field (handles both dict and direct values)."""
        if key not in content:
            return None
        val = content[key]
        if isinstance(val, dict):
            return val.get("value")
        return val

    def _clean_venue_name(self, venue: str) -> str:
        """Clean venue name by removing common suffixes."""
        if not venue:
            return venue
        # Remove common suffixes
        venue = re.sub(r'\s*(Conference\s*)?Submission\s*$', '', venue, flags=re.IGNORECASE)
        venue = venue.strip()
        return venue

    def _extract_venue_from_domain(self, domain: str) -> Optional[str]:
        """Extract venue name from domain string like 'ICLR.cc/2026/Conference'."""
        if not domain:
            return None
        # Pattern: VENUE.cc/YEAR/...
        match = re.match(r'([A-Z]+)\.cc/(\d{4})', domain)
        if match:
            return f"{match.group(1)} {match.group(2)}"
        return None

    def _get_invitations(self, note) -> List[str]:
        """Get invitations list from a note."""
        if hasattr(note, 'invitations') and note.invitations:
            return note.invitations
        if hasattr(note, 'invitation') and note.invitation:
            return [note.invitation]
        return []

    def _is_review(self, invitations: List[str]) -> bool:
        """Check if the note is a review based on invitations."""
        for inv in invitations:
            if 'Official_Review' in inv or '/Review' in inv:
                return True
        return False

    def _is_decision(self, invitations: List[str]) -> bool:
        """Check if the note is a decision based on invitations."""
        for inv in invitations:
            if 'Decision' in inv or 'Meta_Review' in inv or 'Area_Chair' in inv:
                return True
        return False

    def get_reviews(self, paper_id: str, suppress_errors: bool = True) -> List[Dict[str, Any]]:
        """Get review information for a paper."""
        try:
            notes = self.client.get_notes(forum=paper_id)

            reviews = []
            for note in notes:
                invitations = self._get_invitations(note)

                if not self._is_review(invitations):
                    continue

                content = note.content if hasattr(note, 'content') else {}

                review_data = {
                    "id": note.id,
                    "rating": None,
                    "confidence": None,
                    "summary": None,
                    "strengths": None,
                    "weaknesses": None,
                    "soundness": None,
                    "presentation": None,
                    "contribution": None,
                    "mdate": note.mdate if hasattr(note, 'mdate') else None,
                }

                if isinstance(content, dict):
                    # Get rating - try multiple field names
                    for key in ["rating", "recommendation", "score"]:
                        val = self._get_content_value(content, key)
                        if val is not None:
                            review_data["rating"] = val
                            break

                    # Get other fields
                    review_data["confidence"] = self._get_content_value(content, "confidence")
                    review_data["soundness"] = self._get_content_value(content, "soundness")
                    review_data["presentation"] = self._get_content_value(content, "presentation")
                    review_data["contribution"] = self._get_content_value(content, "contribution")

                    # Get text fields
                    review_data["summary"] = self._get_content_value(content, "summary")
                    review_data["strengths"] = self._get_content_value(content, "strengths")
                    review_data["weaknesses"] = self._get_content_value(content, "weaknesses")

                reviews.append(review_data)

            logger.info(f"Found {len(reviews)} reviews for paper {paper_id}")
            return reviews

        except Exception as e:
            logger.error(f"Error fetching reviews for {paper_id}: {e}")
            if not suppress_errors:
                raise
            return []

    def get_decision(self, paper_id: str, suppress_errors: bool = True) -> Optional[Dict[str, Any]]:
        """Get the final decision for a paper."""
        try:
            notes = self.client.get_notes(forum=paper_id)

            for note in notes:
                invitations = self._get_invitations(note)

                if not self._is_decision(invitations):
                    continue

                content = note.content if hasattr(note, 'content') else {}

                decision_data = {
                    "decision": None,
                    "comment": None,
                }

                if isinstance(content, dict):
                    # Get decision
                    decision_data["decision"] = self._get_content_value(content, "decision")
                    if not decision_data["decision"]:
                        decision_data["decision"] = self._get_content_value(content, "recommendation")

                    # Get comment
                    for key in ["comment", "metareview", "meta_review", "explanation"]:
                        val = self._get_content_value(content, key)
                        if val:
                            decision_data["comment"] = val
                            break

                if decision_data["decision"]:
                    if hasattr(note, 'mdate'):
                        decision_data["mdate"] = note.mdate
                    logger.info(f"Found decision for paper {paper_id}: {decision_data['decision']}")
                    return decision_data

            return None

        except Exception as e:
            logger.error(f"Error fetching decision for {paper_id}: {e}")
            if not suppress_errors:
                raise
            return None

    def check_paper_status(self, paper_id: str, suppress_errors: bool = True) -> Dict[str, Any]:
        """Check the complete status of a paper."""
        reviews = self.get_reviews(paper_id, suppress_errors=suppress_errors)
        decision = self.get_decision(paper_id, suppress_errors=suppress_errors)

        status = "pending"
        if decision:
            decision_text = str(decision.get("decision", "")).lower()
            if "accept" in decision_text:
                status = "accepted"
            elif "reject" in decision_text:
                status = "rejected"
            else:
                status = "decided"
        elif reviews:
            status = "reviewed"

        logger.info(f"Paper {paper_id}: status={status}, reviews={len(reviews)}, has_decision={decision is not None}")

        return {
            "status": status,
            "reviews": reviews,
            "decision": decision,
            "review_count": len(reviews),
            "has_decision": decision is not None,
        }
