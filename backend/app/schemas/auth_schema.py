from pydantic import BaseModel, EmailStr
from typing import Optional

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: EmailStr
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    """Used by GET /auth/me to return the current user without a token."""
    email: EmailStr
    full_name: Optional[str] = None