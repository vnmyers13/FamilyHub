"""Authentication and family management models."""

from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4

from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    CO_ADMIN = "co_admin"
    TEEN = "teen"
    CHILD = "child"
    GUEST = "guest"


class AvatarType(str, Enum):
    PHOTO = "photo"
    EMOJI = "emoji"


class UIMode(str, Enum):
    STANDARD = "standard"
    CHILD = "child"
    KIOSK = "kiosk"


class Family(Base):
    __tablename__ = "families"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="America/New_York")
    settings_json: Mapped[dict] = mapped_column(JSON, nullable=True, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    users: Mapped[list["User"]] = relationship(back_populates="family", cascade="all, delete-orphan")
    calendar_sources: Mapped[list["CalendarSource"]] = relationship(back_populates="family", cascade="all, delete-orphan")
    tasks: Mapped[list["Task"]] = relationship(back_populates="family", cascade="all, delete-orphan")
    photos: Mapped[list["Photo"]] = relationship(back_populates="family", cascade="all, delete-orphan")
    albums: Mapped[list["Album"]] = relationship(back_populates="family", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    family_id: Mapped[str] = mapped_column(String(36), ForeignKey("families.id"), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False, default=UserRole.CHILD)
    avatar_type: Mapped[AvatarType] = mapped_column(SAEnum(AvatarType), nullable=False, default=AvatarType.EMOJI)
    avatar_value: Mapped[str] = mapped_column(String(500), nullable=True, default="😊")
    color_hex: Mapped[str] = mapped_column(String(7), nullable=True, default="#4F46E5")
    ui_mode: Mapped[UIMode] = mapped_column(SAEnum(UIMode), nullable=False, default=UIMode.STANDARD)
    pin_hash: Mapped[str] = mapped_column(Text, nullable=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    last_login_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    family: Mapped["Family"] = relationship(back_populates="users")
    sessions: Mapped[list["Session"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(Text, nullable=False)
    device_hint: Mapped[str] = mapped_column(String(200), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="sessions")
