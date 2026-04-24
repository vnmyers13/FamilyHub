# PURPOSE: Health check endpoints for FamilyHub
# ROLE: Backend
# MODIFIED: 2026-04-24 — Phase 1.1 setup

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from app.core.config import settings
from app.core.database import engine

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint returning system status and version."""
    try:
        # Test database connection
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    return {
        "status": "ok",
        "version": settings.version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
    }


@router.get("/health/ready")
async def readiness_check():
    """Readiness check for load balancers."""
    try:
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        raise HTTPException(status_code=503, detail="Service not ready")
