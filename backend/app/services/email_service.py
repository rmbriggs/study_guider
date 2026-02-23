import logging
import resend

from app.config import get_settings

logger = logging.getLogger(__name__)


def _is_email_configured() -> bool:
    settings = get_settings()
    return bool(settings.resend_api_key and settings.email_from)


def send_verification_email(email: str, verification_link: str, code_6_digits: str) -> None:
    """Send verification email. No-op if Resend is not configured."""
    if not _is_email_configured():
        logger.warning(
            "Email not configured; skipping verification email. Link: %s Code: %s",
            verification_link,
            code_6_digits,
        )
        return
    settings = get_settings()
    resend.api_key = settings.resend_api_key
    try:
        resend.Emails.send({
            "from": settings.email_from,
            "to": [email],
            "subject": "Verify your email - CourseMind",
            "text": (
                f"Verify your email address for CourseMind.\n\n"
                f"Enter this code on the website: {code_6_digits}\n\n"
                f"Or click this link: {verification_link}\n\n"
                f"This link and code expire in 24 hours."
            ),
            "html": (
                f"<p>Verify your email address for CourseMind.</p>"
                f"<p>Enter this code on the website: <strong>{code_6_digits}</strong></p>"
                f"<p>Or <a href=\"{verification_link}\">click here to verify</a>.</p>"
                f"<p>This link and code expire in 24 hours.</p>"
            ),
        })
        logger.info("Verification email sent to %s", email)
    except Exception as e:
        logger.exception("Failed to send verification email to %s: %s", email, e)


def send_password_reset_email(email: str, reset_link: str) -> None:
    """Send password reset email. No-op if Resend is not configured."""
    if not _is_email_configured():
        logger.warning("Email not configured; skipping password reset email. Link: %s", reset_link)
        return
    settings = get_settings()
    resend.api_key = settings.resend_api_key
    try:
        resend.Emails.send({
            "from": settings.email_from,
            "to": [email],
            "subject": "Reset your password - CourseMind",
            "text": (
                f"You requested a password reset for CourseMind.\n\n"
                f"Click this link to set a new password: {reset_link}\n\n"
                f"This link expires in 15 minutes. If you didn't request this, you can ignore this email."
            ),
            "html": (
                f"<p>You requested a password reset for CourseMind.</p>"
                f"<p><a href=\"{reset_link}\">Click here to set a new password</a>.</p>"
                f"<p>This link expires in 15 minutes. If you didn't request this, you can ignore this email.</p>"
            ),
        })
        logger.info("Password reset email sent to %s", email)
    except Exception as e:
        logger.exception("Failed to send password reset email to %s: %s", email, e)
