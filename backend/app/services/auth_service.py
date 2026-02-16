import hashlib
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# bcrypt only uses first 72 bytes; for longer passwords we pre-hash with SHA-256 so the full password is used
BCRYPT_MAX_BYTES = 72


def _to_bcrypt_input(password: str) -> str:
    """Return input to bcrypt: password if <=72 bytes, else SHA-256 hex digest (full password is still used)."""
    raw = password.encode("utf-8")
    if len(raw) <= BCRYPT_MAX_BYTES:
        return password
    return hashlib.sha256(raw).hexdigest()


def hash_password(password: str) -> str:
    return pwd_context.hash(_to_bcrypt_input(password))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_to_bcrypt_input(plain), hashed)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        sub = payload.get("sub")
        return int(sub) if sub else None
    except JWTError:
        return None
