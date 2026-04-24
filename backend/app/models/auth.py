# PURPOSE: SQLAlchemy ORM models for authentication domain
# ROLE: Backend Database
# MODIFIED: 2026-04-24 — Phase 1.1 setup

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, func, Index, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from uuid import uuid4
from datetime import datetime, timezone
from app.core.database import Base


class Family(Base):
    __tablename__ = "families"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(200), nullable=False)
    timezone = Column(String(50), default="UTC")
    settings_json = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    users = relationship("User", back_populates="family", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    family_id = Column(String(36), ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    display_name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    role = Column(String(20), default="member")  # admin, member, viewer
    avatar_url = Column(String(500), nullable=True)
    color = Column(String(20), nullable=True)
    ui_mode = Column(String(10), default="light")  # light, dark
    pin_hash = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    family = relationship("Family", back_populates="users")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_users_family_id", "family_id"),
        Index("ix_users_email", "email"),
    )


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), nullable=False)
    device_hint = Column(String(255), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="sessions")

    # Indexes
    __table_args__ = (
        Index("ix_sessions_user_id", "user_id"),
        Index("ix_sessions_expires_at", "expires_at"),
    )
