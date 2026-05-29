from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str
    role: Literal["Healthcare Professional", "Administrator", "Public Health Society"]
    organization: Optional[str] = None
    phone_number: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str
    organization: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic