# PURPOSE: Authentication business logic
# ROLE: Backend Services
# MODIFIED: 2026-04-28 — Phase 1.2 setup

from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.auth import Family, User, Session as DBSession
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.schemas.auth import SetupRequest, LoginRequest, PINLoginRequest
from datetime import datetime, timezone


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def setup_family(self, request: SetupRequest) -> dict:
        """Create family and admin user."""
        family_id = str(uuid4())
        family = Family(
            id=family_id,
            name=request.family_name,
            timezone=request.timezone,
        )
        self.db.add(family)

        user_id = str(uuid4())
        user = User(
            id=user_id,
            family_id=family_id,
            display_name=request.admin_email.split("@")[0],
            email=request.admin_email,
            role="admin",
            password_hash=hash_password(request.admin_password),
            last_login_at=datetime.now(timezone.utc),
        )
        self.db.add(user)
        await self.db.commit()

        access_token = create_access_token({"sub": user_id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user_id})

        return {
            "family": family,
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    async def login(self, request: LoginRequest) -> dict:
        """Authenticate user with email and password."""
        result = await self.db.execute(
            select(User).where(User.email == request.email)
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(request.password, user.password_hash):
            return None

        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()

        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id})

        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    async def pin_login(self, user_id: str, pin: str) -> dict:
        """Authenticate user with PIN."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user or not user.pin_hash or not verify_password(pin, user.pin_hash):
            return None

        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()

        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id})

        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    async def get_user(self, user_id: str) -> User:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def is_setup_complete(self) -> bool:
        """Check if any family exists (setup complete)."""
        result = await self.db.execute(select(Family).limit(1))
        return result.scalar_one_or_none() is not None
