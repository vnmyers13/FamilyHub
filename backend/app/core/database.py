# PURPOSE: Async SQLAlchemy database configuration for FamilyHub
# ROLE: Backend Infrastructure
# MODIFIED: 2026-04-24 — Phase 1.1 setup

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Convert standard SQLite URL to async SQLite URL
database_url = settings.database_url
if database_url.startswith("sqlite://"):
    # Replace sqlite:// with sqlite+aiosqlite://
    database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://")

# Create async engine
engine = create_async_engine(
    database_url,
    echo=settings.debug,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
)

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for models
Base = declarative_base()


async def get_db():
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    await engine.dispose()
