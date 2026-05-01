import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info("FamilyHub starting up...")
    logger.info("Database URL: %s", settings.database_url.split("://")[0] + "://***")

    # Run Alembic migrations to head
    try:
        from alembic.config import Config
        from alembic import command

        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations applied successfully")
    except Exception as e:
        logger.warning("Migration warning (may be expected on first run): %s", e)

    yield

    # Shutdown
    logger.info("FamilyHub shutting down...")


app = FastAPI(
    title="FamilyHub API",
    description="Self-hosted family organizational hub",
    version="1.02",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Root ──────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "FamilyHub API", "version": "1.02", "docs": "/docs"}


# ── Health Check ──────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "familyhub"}


# ── Router includes (added as modules grow) ───────────────────
# from app.routers import auth, users, calendar, tasks
# app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
# app.include_router(users.router, prefix="/api/users", tags=["users"])
# app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
# app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
