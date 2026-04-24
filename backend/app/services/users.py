# PURPOSE: User management business logic
# ROLE: Backend Services
# MODIFIED: 2026-04-28 — Phase 1.2 setup

import os
from uuid import uuid4
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.auth import User, Family
from app.core.security import hash_password
from app.schemas.users import UserCreate, UserUpdate
from datetime import datetime, timezone

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class UserService:
    def __init__(self, db: AsyncSession, family_id: str = None):
        self.db = db
        self.family_id = family_id

    async def list_users(self, skip: int = 0, limit: int = 50, role: str = None) -> dict:
        """List all users in family (optionally filtered by role)."""
        query = select(User).where(
            and_(User.family_id == self.family_id, User.is_active == True)
        )

        if role:
            query = query.where(User.role == role)

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        users = result.scalars().all()

        # Get total count
        count_result = await self.db.execute(
            select(User).where(
                and_(User.family_id == self.family_id, User.is_active == True)
            )
        )
        total = len(count_result.scalars().all())

        return {"users": users, "total": total}

    async def get_user(self, user_id: str) -> User:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_user(self, request: UserCreate, current_user_id: str) -> User:
        """Create new user (admin only)."""
        # Verify current user is admin
        current_user = await self.get_user(current_user_id)
        if not current_user or current_user.role != "admin":
            return None

        user_id = str(uuid4())
        password_hash = hash_password(str(uuid4())[:16])  # Random initial password
        pin_hash = hash_password(request.pin) if request.pin else None

        user = User(
            id=user_id,
            family_id=self.family_id,
            display_name=request.display_name,
            email=request.email,
            role=request.role,
            password_hash=password_hash,
            pin_hash=pin_hash,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def update_user(self, user_id: str, request: UserUpdate, current_user_id: str) -> User:
        """Update user (self or admin)."""
        # Users can only update themselves, admins can update anyone
        current_user = await self.get_user(current_user_id)
        if not current_user:
            return None

        if current_user.role != "admin" and current_user_id != user_id:
            return None

        user = await self.get_user(user_id)
        if not user:
            return None

        # Update fields
        if request.display_name:
            user.display_name = request.display_name
        if request.email:
            user.email = request.email
        if request.role and current_user.role == "admin":
            user.role = request.role
        if request.color:
            user.color = request.color
        if request.ui_mode:
            user.ui_mode = request.ui_mode

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def delete_user(self, user_id: str, current_user_id: str) -> bool:
        """Soft delete user (admin only)."""
        current_user = await self.get_user(current_user_id)
        if not current_user or current_user.role != "admin":
            return False

        user = await self.get_user(user_id)
        if not user:
            return False

        user.is_active = False
        await self.db.commit()

        return True

    async def upload_avatar(self, user_id: str, file_content: bytes, filename: str) -> dict:
        """Upload and process avatar image."""
        if not PIL_AVAILABLE:
            return {"error": "Pillow not installed"}

        user = await self.get_user(user_id)
        if not user:
            return None

        # Create directory structure
        photos_dir = Path("/data/photos") / user.family_id / user_id
        photos_dir.mkdir(parents=True, exist_ok=True)

        # Save original
        original_path = photos_dir / "avatar_original.jpg"
        with open(original_path, "wb") as f:
            f.write(file_content)

        # Create thumbnail (200x200)
        try:
            img = Image.open(original_path)
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            thumbnail_path = photos_dir / "avatar.jpg"
            img.save(thumbnail_path, "JPEG", quality=85)
        except Exception as e:
            return {"error": f"Image processing failed: {str(e)}"}

        # Update user with avatar URL
        avatar_url = f"/api/photos/{user.family_id}/{user_id}/avatar.jpg"
        user.avatar_url = avatar_url
        await self.db.commit()

        return {
            "id": user_id,
            "avatar_url": avatar_url,
        }
