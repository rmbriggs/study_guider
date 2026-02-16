from pydantic import BaseModel, EmailStr, Field

# Allow longer than 72 bytes; auth_service pre-hashes with SHA-256 before bcrypt for long passwords
PASSWORD_MAX_LENGTH = 128


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=PASSWORD_MAX_LENGTH)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=PASSWORD_MAX_LENGTH)


class UserResponse(BaseModel):
    id: int
    email: str
    email_verified: bool = False

    class Config:
        from_attributes = True


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
