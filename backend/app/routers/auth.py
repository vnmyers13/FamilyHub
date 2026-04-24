# PURPOSE: Authentication API endpoints
# ROLE: Backend API
# MODIFIED: 2026-04-28 — Phase 1.2 setup

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, check_rate_limit, reset_rate_limit
from app.schemas.auth import (
    SetupRequest,
    SetupResponse,
    LoginRequest,
    LoginResponse,
    PINLoginRequest,
    PINLoginResponse,
    SetupStatusResponse,
    UserResponse,
)
from app.services.auth import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/setup", response_model=SetupResponse)
async def setup(request: SetupRequest, db: AsyncSession = Depends(get_db)):
    """Create family and admin user on first run."""
    auth_service = AuthService(db)

    # Check if already setup
    if await auth_service.is_setup_complete():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Family already setup",
        )

    result = await auth_service.setup_family(request)

    return SetupResponse(
        family=result["family"],
        user=UserResponse.from_orm(result["user"]),
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    # Rate limiting by email
    if not check_rate_limit(f"login:{request.email}", max_attempts=5, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )

    auth_service = AuthService(db)
    result = await auth_service.login(request)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Reset rate limit on successful login
    reset_rate_limit(f"login:{request.email}")

    return LoginResponse(
        user=UserResponse.from_orm(result["user"]),
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )


@router.post("/login/pin", response_model=PINLoginResponse)
async def pin_login(request: PINLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with PIN."""
    # Rate limiting by user_id
    if not check_rate_limit(f"pin:{request.user_id}", max_attempts=5, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed PIN attempts. Please try again later.",
        )

    auth_service = AuthService(db)
    result = await auth_service.pin_login(request.user_id, request.pin)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user or PIN",
        )

    # Reset rate limit on successful login
    reset_rate_limit(f"pin:{request.user_id}")

    return PINLoginResponse(
        user=UserResponse.from_orm(result["user"]),
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )


@router.post("/logout", status_code=204)
async def logout(user_id: str = Depends(get_current_user)):
    """Invalidate user session."""
    # In phase 2, delete from sessions table
    # For now, just return 204
    return None


@router.get("/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user details."""
    auth_service = AuthService(db)
    user = await auth_service.get_user(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return UserResponse.from_orm(user)


@router.get("/setup/status", response_model=SetupStatusResponse)
async def setup_status(db: AsyncSession = Depends(get_db)):
    """Check if family setup is complete."""
    auth_service = AuthService(db)
    is_complete = await auth_service.is_setup_complete()

    return SetupStatusResponse(
        setup_complete=is_complete,
        message="Setup complete" if is_complete else "Setup required",
    )
