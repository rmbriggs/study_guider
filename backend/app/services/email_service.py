import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import get_settings

logger = logging.getLogger(__name__)


def _is_smtp_configured() -> bool:
    settings = get_settings()
    return bool(settings.smtp_host and settings.smtp_from_email)


def send_verification_email(email: str, verification_link: str, code_6_digits: str) -> None:
    """Send email with verification link and 6-digit code. No-op if SMTP not configured."""
    if not _is_smtp_configured():
        logger.warning("SMTP not configured; skipping verification email. Link: %s Code: %s", verification_link, code_6_digits)
        return
    settings = get_settings()
    subject = "Verify your email - CourseMind"
    text = f"""Verify your email address for CourseMind.

Enter this code on the website: {code_6_digits}

Or click this link: {verification_link}

This link and code expire in 24 hours.
"""
    html = f"""<p>Verify your email address for CourseMind.</p>
<p>Enter this code on the website: <strong>{code_6_digits}</strong></p>
<p>Or <a href="{verification_link}">click here to verify</a>.</p>
<p>This link and code expire in 24 hours.</p>
"""
    _send_email(to_email=email, subject=subject, text=text, html=html)


def send_password_reset_email(email: str, reset_link: str) -> None:
    """Send password reset email. No-op if SMTP not configured."""
    if not _is_smtp_configured():
        logger.warning("SMTP not configured; skipping password reset email. Link: %s", reset_link)
        return
    subject = "Reset your password - CourseMind"
    text = f"""You requested a password reset for CourseMind.

Click this link to set a new password: {reset_link}

This link expires in 15 minutes. If you didn't request this, you can ignore this email.
"""
    html = f"""<p>You requested a password reset for CourseMind.</p>
<p><a href="{reset_link}">Click here to set a new password</a>.</p>
<p>This link expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
"""
    _send_email(to_email=email, subject=subject, text=text, html=html)


def _send_email(to_email: str, subject: str, text: str, html: str) -> None:
    settings = get_settings()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.ehlo()
            if settings.smtp_user and settings.smtp_password:
                server.starttls()
                server.ehlo()
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, [to_email], msg.as_string())
        logger.info("Email sent to %s", to_email)
    except Exception as e:
        logger.exception("Failed to send email to %s: %s", to_email, e)
