# PURPOSE: Pydantic schemas for auth endpoints
# ROLE: Backend API
# MODIFIED: 2026-04-28 — Phase 1.2 setup

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserResponse(BaseModel):
    id: str
    display_name: str
    email: Optional[str]
    role: str
    avatar_url: Optional[str]
    color: Optional[str]
    ui_mode: str
    created_at: datetime
    last_login_at: Optional[datetime]

    class Config:
        from_attributes = True


class FamilyResponse(BaseModel):
    id: str
    name: str
    timezone: str
    created_at: datetime

    class Config:
        from_attributes = True


class SetupRequest(BaseModel):
    family_name: str
    timezone: str
    admin_email: EmailStr
    admin_password: str


class SetupResponse(BaseModel):
    family: FamilyResponse
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class PINLoginRequest(BaseModel):
    user_id: str
    pin: str


class PINLoginResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class SetupStatusResponse(BaseModel):
    setup_complete: bool
    message: str = "Setup complete" if True else "Setup required"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ErrorResponse(BaseModel):
    error: str
    message: str
    status_code: int
