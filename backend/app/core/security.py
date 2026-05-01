"""Security utilities: JWT tokens, password hashing, PIN hashing."""

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request, Response, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

# Password hashing (bcrypt, cost >= 12)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# PIN hashing (separate context for lower cost, PINs are short)
pin_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=10)

# HTTP Bearer scheme for optional token auth
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_pin(pin: str) -> str:
    return pin_context.hash(pin)


def verify_pin(plain: str, hashed: str) -> bool:
    return pin_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=settings.session_max_days)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


def verify_token(token: str) -> dict[str, Any] | None:
    """Verify and decode a JWT token. Returns payload or None."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
