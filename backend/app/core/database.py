from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import event

from app.core.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        yield session


# Enable SQLite foreign keys
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
