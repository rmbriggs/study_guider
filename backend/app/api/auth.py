import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config import get_settings
from app.db import get_db
from app.models.user import User
from app.models.verification import EmailVerification, PasswordResetToken
from app.schemas.auth import (
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    VerifyEmailRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    hash_reset_token,
)
from app.services.email_service import send_verification_email, send_password_reset_email
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

VERIFICATION_EXPIRY_HOURS = 24
RESET_TOKEN_EXPIRY_MINUTES = 15


def _make_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        email_verified=getattr(user, "email_verified", False),
    )


def _create_verification_for_user(db: Session, user: User) -> EmailVerification:
    """Create EmailVerification row and return it (caller sends email)."""
    db.query(EmailVerification).filter(EmailVerification.user_id == user.id).delete()
    token = secrets.token_urlsafe(32)
    code = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_EXPIRY_HOURS)
    ev = EmailVerification(user_id=user.id, token=token, code=code, expires_at=expires_at)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    ev = _create_verification_for_user(db, user)
    verification_link = f"{settings.frontend_base_url.rstrip('/')}/verify-email?token={ev.token}"
    send_verification_email(user.email, verification_link, ev.code)
    access_token = create_access_token(user.id)
    return Token(
        access_token=access_token,
        user=_make_user_response(user),
    )


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = create_access_token(user.id)
    return Token(
        access_token=access_token,
        user=_make_user_response(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return _make_user_response(current_user)


def _do_verify_email(db: Session, token: str | None, code: str | None) -> User:
    """Find EmailVerification by token or code, mark user verified, delete row. Returns user or raises."""
    now = datetime.now(timezone.utc)
    q = db.query(EmailVerification).filter(EmailVerification.expires_at > now)
    if token:
        ev = q.filter(EmailVerification.token == token).first()
    elif code:
        ev = q.filter(EmailVerification.code == code).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide code or token",
        )
    if not ev:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code or link",
        )
    user = db.query(User).filter(User.id == ev.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.email_verified = True
    db.delete(ev)
    db.commit()
    db.refresh(user)
    return user


@router.post("/verify-email")
def verify_email_post(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    if not body.code and not body.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide code or token",
        )
    user = _do_verify_email(db, token=body.token, code=body.code)
    return {"message": "Email verified", "user": _make_user_response(user)}


@router.get("/verify-email")
def verify_email_get(token: str | None = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing token",
        )
    user = _do_verify_email(db, token=token, code=None)
    return {"message": "Email verified", "user": _make_user_response(user)}


@router.post("/resend-verification")
def resend_verification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.email_verified:
        return {"message": "Email already verified"}
    ev = _create_verification_for_user(db, current_user)
    verification_link = f"{settings.frontend_base_url.rstrip('/')}/verify-email?token={ev.token}"
    send_verification_email(current_user.email, verification_link, ev.code)
    return {"message": "Verification email sent"}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_reset_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)
        prt = PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
        db.add(prt)
        db.commit()
        reset_link = f"{settings.frontend_base_url.rstrip('/')}/reset-password/{raw_token}"
        send_password_reset_email(user.email, reset_link)
    return {"message": "If an account exists with that email, we sent password reset instructions."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    token_hash = hash_reset_token(body.token)
    prt = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.expires_at > now,
        )
        .first()
    )
    if not prt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link",
        )
    user = db.query(User).filter(User.id == prt.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.password_hash = hash_password(body.new_password)
    db.delete(prt)
    db.commit()
    return {"message": "Password updated"}
