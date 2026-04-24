# PURPOSE: Pydantic schemas for user endpoints
# ROLE: Backend API
# MODIFIED: 2026-04-28 — Phase 1.2 setup

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    display_name: str
    email: Optional[EmailStr] = None
    role: str = "member"
    pin: Optional[str] = Field(None, min_length=4, max_length=6)


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    color: Optional[str] = None
    ui_mode: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    family_id: str
    display_name: str
    email: Optional[str]
    role: str
    avatar_url: Optional[str]
    color: Optional[str]
    ui_mode: str
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int


class AvatarUploadResponse(BaseModel):
    id: str
    avatar_url: str
    message: str = "Avatar uploaded successfully"
