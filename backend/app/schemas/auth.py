import re
from pydantic import BaseModel, EmailStr, Field, field_validator

# Allow longer than 72 bytes; auth_service pre-hashes with SHA-256 before bcrypt for long passwords
PASSWORD_MAX_LENGTH = 128

# Username: letters, numbers, underscore; 3–50 chars
USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,50}$")


def _validate_username(v: str) -> str:
    if not USERNAME_PATTERN.match(v):
        raise ValueError("Username must be 3–50 characters, letters, numbers, and underscores only")
    return v


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=PASSWORD_MAX_LENGTH)

    @field_validator("username")
    @classmethod
    def username_format(cls, v: str) -> str:
        return _validate_username(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=PASSWORD_MAX_LENGTH)


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    email_verified: bool = False

    class Config:
        from_attributes = True


class UserUpdateUsername(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

    @field_validator("username")
    @classmethod
    def username_format(cls, v: str) -> str:
        return _validate_username(v)


class VerifyEmailRequest(BaseModel):
    code: str | None = None
    token: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=1, max_length=PASSWORD_MAX_LENGTH)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: int | None = None
