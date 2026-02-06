import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import socket

logger = logging.getLogger(__name__)

# Thread pool for blocking SMTP operations
_executor = ThreadPoolExecutor(max_workers=3)


class EmailService:
    """Service for sending email notifications."""

    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_user: str,
        smtp_password: str,
        from_email: str,
        timeout: int = 15  # 15 second timeout for faster feedback
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_password = smtp_password
        self.from_email = from_email
        self.timeout = timeout

    def _render_review_template(
        self,
        paper_title: str,
        paper_id: str,
        venue: str,
        reviews: List[Dict],
    ) -> str:
        """Render email template for review notification with full details."""
        reviews_html = ""
        for i, review in enumerate(reviews, 1):
            rating = review.get("rating", "N/A")
            confidence = review.get("confidence", "N/A")
            summary = review.get("summary", "") or ""
            strengths = review.get("strengths", "") or ""
            weaknesses = review.get("weaknesses", "") or ""

            reviews_html += f"""
            <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #4f46e5;">
                <h4 style="margin: 0 0 10px 0; color: #1f2937;">Reviewer {i}</h4>
                <div style="display: flex; gap: 20px; margin-bottom: 10px;">
                    <span><strong>Rating:</strong> {rating}</span>
                    <span><strong>Confidence:</strong> {confidence}</span>
                </div>
                {"<div style='margin-top: 10px;'><strong>Summary:</strong><p style='margin: 5px 0; color: #4b5563;'>" + summary[:500] + ("..." if len(summary) > 500 else "") + "</p></div>" if summary else ""}
                {"<div style='margin-top: 10px;'><strong>Strengths:</strong><p style='margin: 5px 0; color: #059669;'>" + strengths[:300] + ("..." if len(strengths) > 300 else "") + "</p></div>" if strengths else ""}
                {"<div style='margin-top: 10px;'><strong>Weaknesses:</strong><p style='margin: 5px 0; color: #dc2626;'>" + weaknesses[:300] + ("..." if len(weaknesses) > 300 else "") + "</p></div>" if weaknesses else ""}
            </div>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 700px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }}
                .venue-badge {{ display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0 0 10px 0;">📝 Reviews Available!</h2>
                    <span class="venue-badge">{venue or "OpenReview"}</span>
                </div>
                <div class="content">
                    <h3 style="margin-top: 0;">{paper_title or paper_id}</h3>
                    <p style="color: #6b7280;">Your paper has received {len(reviews)} review(s). Here are the details:</p>

                    {reviews_html}

                    <div style="margin-top: 25px; text-align: center;">
                        <a href="https://openreview.net/forum?id={paper_id}" class="button">
                            View Full Reviews on OpenReview
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>This notification was sent by OpenReview Monitor. You subscribed to updates for this paper.</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _render_decision_template(
        self,
        paper_title: str,
        paper_id: str,
        venue: str,
        decision: str,
        comment: Optional[str],
        reviews: List[Dict],
    ) -> str:
        """Render email template for decision notification with full details."""
        is_accepted = "accept" in decision.lower()
        decision_color = "#059669" if is_accepted else "#dc2626"
        decision_bg = "#ecfdf5" if is_accepted else "#fef2f2"
        decision_emoji = "🎉" if is_accepted else "📋"
        header_gradient = "linear-gradient(135deg, #059669 0%, #10b981 100%)" if is_accepted else "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"

        # Build reviews summary
        reviews_summary = ""
        if reviews:
            ratings = [r.get("rating", "N/A") for r in reviews]
            reviews_summary = f"""
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0;">Review Summary</h4>
                <p><strong>Ratings:</strong> {', '.join(str(r) for r in ratings)}</p>
                <p><strong>Number of Reviews:</strong> {len(reviews)}</p>
            </div>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 700px; margin: 0 auto; padding: 20px; }}
                .header {{ background: {header_gradient}; color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }}
                .decision-box {{ background: {decision_bg}; border: 2px solid {decision_color}; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }}
                .decision-text {{ font-size: 24px; font-weight: bold; color: {decision_color}; margin: 0; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }}
                .venue-badge {{ display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0 0 10px 0;">{decision_emoji} Decision Announced</h2>
                    <span class="venue-badge">{venue or "OpenReview"}</span>
                </div>
                <div class="content">
                    <h3 style="margin-top: 0;">{paper_title or paper_id}</h3>

                    <div class="decision-box">
                        <p class="decision-text">{decision}</p>
                    </div>

                    {"<div style='margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;'><h4 style='margin: 0 0 10px 0;'>Meta Review / Comments</h4><p style='margin: 0; color: #4b5563;'>" + (comment or "No additional comments provided.") + "</p></div>" if comment else ""}

                    {reviews_summary}

                    <div style="margin-top: 25px; text-align: center;">
                        <a href="https://openreview.net/forum?id={paper_id}" class="button">
                            View on OpenReview
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>This notification was sent by OpenReview Monitor. You subscribed to updates for this paper.</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _render_test_template(self) -> str:
        """Render test email template."""
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                .content { background: #fff; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center; }
                .success-icon { font-size: 48px; margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0;">OpenReview Monitor</h2>
                </div>
                <div class="content">
                    <div class="success-icon">✅</div>
                    <h3>Test Email Successful!</h3>
                    <p style="color: #6b7280;">Your email configuration is working correctly. You will receive notifications when your monitored papers have updates.</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _send_email_sync(self, msg: MIMEMultipart) -> None:
        """Send an email message synchronously (blocking)."""
        if not self.smtp_user or not self.smtp_password:
            raise ValueError("SMTP credentials not configured. Please set SMTP username and password.")

        if not self.from_email:
            raise ValueError("From email not configured. Please set the sender email address.")

        logger.info(f"Connecting to SMTP server {self.smtp_host}:{self.smtp_port}...")

        try:
            # Try SSL first for port 465, otherwise use STARTTLS
            if self.smtp_port == 465:
                # SSL connection
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context, timeout=self.timeout) as server:
                    logger.info("Connected via SSL, logging in...")
                    server.login(self.smtp_user, self.smtp_password)
                    logger.info("Sending message...")
                    server.send_message(msg)
            else:
                # STARTTLS connection (for port 587, 25, etc.)
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=self.timeout) as server:
                    logger.info("Connected, starting TLS...")
                    server.starttls()
                    logger.info("TLS started, logging in...")
                    server.login(self.smtp_user, self.smtp_password)
                    logger.info("Sending message...")
                    server.send_message(msg)

            logger.info("Email sent successfully!")

        except socket.timeout:
            error_msg = f"Connection to {self.smtp_host}:{self.smtp_port} timed out after {self.timeout}s. Please check your SMTP host and port."
            logger.error(error_msg)
            raise ValueError(error_msg)
        except socket.gaierror as e:
            error_msg = f"Cannot resolve SMTP host '{self.smtp_host}'. Please check the hostname. Error: {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except ConnectionRefusedError:
            error_msg = f"Connection refused by {self.smtp_host}:{self.smtp_port}. Please check if the port is correct."
            logger.error(error_msg)
            raise ValueError(error_msg)
        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"SMTP authentication failed. Please check your username and password. Error: {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except smtplib.SMTPException as e:
            error_msg = f"SMTP error: {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            error_msg = f"Failed to send email: {type(e).__name__}: {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)

    async def _send_email_async(self, msg: MIMEMultipart) -> None:
        """Send an email message asynchronously using thread pool."""
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(_executor, self._send_email_sync, msg)

    def send_test_email_sync(self, to_email: str) -> bool:
        """Send a test email synchronously."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "[OpenReview Monitor] Test Email"
        msg["From"] = self.from_email
        msg["To"] = to_email

        html_content = self._render_test_template()
        msg.attach(MIMEText(html_content, "html"))

        self._send_email_sync(msg)
        logger.info(f"Sent test email to {to_email}")
        return True

    async def send_test_email(self, to_email: str) -> bool:
        """Send a test email asynchronously."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "[OpenReview Monitor] Test Email"
        msg["From"] = self.from_email
        msg["To"] = to_email

        html_content = self._render_test_template()
        msg.attach(MIMEText(html_content, "html"))

        await self._send_email_async(msg)
        logger.info(f"Sent test email to {to_email}")
        return True

    def send_review_notification(
        self,
        to_email: str,
        paper_title: str,
        paper_id: str,
        venue: str,
        reviews: List[Dict],
    ) -> bool:
        """Send review notification email (synchronous, for background tasks)."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[{venue or 'OpenReview'}] Reviews available: {paper_title or paper_id}"
            msg["From"] = self.from_email
            msg["To"] = to_email

            html_content = self._render_review_template(paper_title, paper_id, venue, reviews)
            msg.attach(MIMEText(html_content, "html"))

            self._send_email_sync(msg)
            logger.info(f"Sent review notification to {to_email} for paper {paper_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send review notification: {e}")
            return False

    def send_decision_notification(
        self,
        to_email: str,
        paper_title: str,
        paper_id: str,
        venue: str,
        decision: str,
        comment: Optional[str],
        reviews: List[Dict],
    ) -> bool:
        """Send decision notification email (synchronous, for background tasks)."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[{venue or 'OpenReview'}] Decision: {decision} - {paper_title or paper_id}"
            msg["From"] = self.from_email
            msg["To"] = to_email

            html_content = self._render_decision_template(
                paper_title, paper_id, venue, decision, comment, reviews
            )
            msg.attach(MIMEText(html_content, "html"))

            self._send_email_sync(msg)
            logger.info(f"Sent decision notification to {to_email} for paper {paper_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send decision notification: {e}")
            return False
    def _render_review_modified_template(
        self,
        paper_title: str,
        paper_id: str,
        venue: str,
        modified_reviews: List[Dict],
    ) -> str:
        """Render email template for modified review notification."""
        reviews_html = ""
        for review in modified_reviews:
            rating = review.get("rating", "N/A")
            confidence = review.get("confidence", "N/A")
            summary = review.get("summary", "") or ""
            strengths = review.get("strengths", "") or ""
            weaknesses = review.get("weaknesses", "") or ""
            # Calculate review number if available (optional enhancement)
            
            reviews_html += f"""
            <div style="margin: 15px 0; padding: 15px; background: #fffcf0; border-radius: 8px; border-left: 4px solid #d97706;">
                <h4 style="margin: 0 0 10px 0; color: #92400e;">Modified Review</h4>
                <div style="display: flex; gap: 20px; margin-bottom: 10px;">
                    <span><strong>Rating:</strong> {rating}</span>
                    <span><strong>Confidence:</strong> {confidence}</span>
                </div>
                {"<div style='margin-top: 10px;'><strong>Summary:</strong><p style='margin: 5px 0; color: #4b5563;'>" + summary[:500] + ("..." if len(summary) > 500 else "") + "</p></div>" if summary else ""}
                {"<div style='margin-top: 10px;'><strong>Strengths:</strong><p style='margin: 5px 0; color: #059669;'>" + strengths[:300] + ("..." if len(strengths) > 300 else "") + "</p></div>" if strengths else ""}
                {"<div style='margin-top: 10px;'><strong>Weaknesses:</strong><p style='margin: 5px 0; color: #dc2626;'>" + weaknesses[:300] + ("..." if len(weaknesses) > 300 else "") + "</p></div>" if weaknesses else ""}
            </div>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 700px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
                .content {{ background: #fff; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }}
                .venue-badge {{ display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0 0 10px 0;">✏️ Reviews Modified</h2>
                    <span class="venue-badge">{venue or "OpenReview"}</span>
                </div>
                <div class="content">
                    <h3 style="margin-top: 0;">{paper_title or paper_id}</h3>
                    <p style="color: #6b7280;">Some reviews for your paper have been updated. Here are the details:</p>

                    {reviews_html}

                    <div style="margin-top: 25px; text-align: center;">
                        <a href="https://openreview.net/forum?id={paper_id}" class="button">
                            View Modified Reviews on OpenReview
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>This notification was sent by OpenReview Monitor. You subscribed to updates for this paper.</p>
                </div>
            </div>
        </body>
        </html>
        """

    def send_review_modified_notification(
        self,
        to_email: str,
        paper_title: str,
        paper_id: str,
        venue: str,
        modified_reviews: List[Dict],
    ) -> bool:
        """Send review modification notification email (synchronous)."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[{venue or 'OpenReview'}] Reviews Modified: {paper_title or paper_id}"
            msg["From"] = self.from_email
            msg["To"] = to_email

            html_content = self._render_review_modified_template(
                paper_title, paper_id, venue, modified_reviews
            )
            msg.attach(MIMEText(html_content, "html"))

            self._send_email_sync(msg)
            logger.info(f"Sent review modification notification to {to_email} for paper {paper_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send review modification notification: {e}")
            return False
