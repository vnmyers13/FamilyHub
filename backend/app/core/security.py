# PURPOSE: JWT and password security utilities for FamilyHub
# ROLE: Backend Security
# MODIFIED: 2026-04-28 — Phase 1.2 auth setup

from datetime import datetime, timedelta, timezone
from typing import Optional, Callable, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Rate limiting: {key: (failures, timestamp)}
rate_limit_store = {}


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None


def check_rate_limit(key: str, max_attempts: int = 5, window_seconds: int = 60) -> bool:
    now = datetime.now(timezone.utc)
    if key in rate_limit_store:
        failures, timestamp = rate_limit_store[key]
        if (now - timestamp).total_seconds() < window_seconds:
            if failures >= max_attempts:
                return False
            rate_limit_store[key] = (failures + 1, timestamp)
        else:
            rate_limit_store[key] = (1, now)
    else:
        rate_limit_store[key] = (1, now)
    return True


def reset_rate_limit(key: str):
    if key in rate_limit_store:
        del rate_limit_store[key]


async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    return user_id


def require_role(allowed_roles: List[str]) -> Callable:
    async def role_checker(user_id: str = Depends(get_current_user)):
        # This will be populated by the auth service
        # For now, return the user_id and let the endpoint handle role check
        return user_id
    return role_checker
