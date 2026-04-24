# PURPOSE: User management API endpoints
# ROLE: Backend API
# MODIFIED: 2026-04-28 — Phase 1.2 setup

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.users import UserService
from app.services.auth import AuthService
from app.schemas.users import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse,
    AvatarUploadResponse,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: str = Query(None),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all family members."""
    auth_service = AuthService(db)
    user = await auth_service.get_user(user_id)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user_service = UserService(db, user.family_id)
    result = await user_service.list_users(skip=skip, limit=limit, role=role)

    return UserListResponse(
        users=[UserResponse.from_orm(u) for u in result["users"]],
        total=result["total"],
    )


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    request: UserCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create new user (admin only)."""
    auth_service = AuthService(db)
    current_user = await auth_service.get_user(user_id)

    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    user_service = UserService(db, current_user.family_id)
    new_user = await user_service.create_user(request, user_id)

    if not new_user:
        raise HTTPException(status_code=400, detail="Failed to create user")

    return UserResponse.from_orm(new_user)


@router.get("/{target_user_id}", response_model=UserResponse)
async def get_user(
    target_user_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user details."""
    auth_service = AuthService(db)
    user = await auth_service.get_user(user_id)
    target_user = await auth_service.get_user(target_user_id)

    if not user or not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.family_id != target_user.family_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return UserResponse.from_orm(target_user)


@router.patch("/{target_user_id}", response_model=UserResponse)
async def update_user(
    target_user_id: str,
    request: UserUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user details."""
    auth_service = AuthService(db)
    current_user = await auth_service.get_user(user_id)

    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    # Users can only update themselves; admins can update anyone
    if current_user.role != "admin" and current_user.id != target_user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    user_service = UserService(db, current_user.family_id)
    updated_user = await user_service.update_user(target_user_id, request, user_id)

    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse.from_orm(updated_user)


@router.delete("/{target_user_id}", status_code=204)
async def delete_user(
    target_user_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete user (soft delete, admin only)."""
    auth_service = AuthService(db)
    current_user = await auth_service.get_user(user_id)

    if not current_user or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    user_service = UserService(db, current_user.family_id)
    success = await user_service.delete_user(target_user_id, user_id)

    if not success:
        raise HTTPException(status_code=404, detail="User not found")

    return None


@router.post("/{target_user_id}/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    target_user_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload user avatar."""
    auth_service = AuthService(db)
    current_user = await auth_service.get_user(user_id)

    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    # Users can only upload their own avatar; admins can upload for anyone
    if current_user.role != "admin" and current_user.id != target_user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG and PNG images are allowed",
        )

    # Validate file size (5MB max)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 5MB",
        )

    user_service = UserService(db, current_user.family_id)
    result = await user_service.upload_avatar(target_user_id, contents, file.filename)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    return AvatarUploadResponse(
        id=result["id"],
        avatar_url=result["avatar_url"],
    )
