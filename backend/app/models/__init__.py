"""SQLAlchemy ORM models package.

Import all model classes here so Alembic's Base.metadata
can discover every table for autogenerate migrations.
"""

from app.models.auth import Family, User, Session, UserRole, AvatarType, UIMode  # noqa: F401

# Future models (imported when created):
# from app.models.calendar import CalendarSource, CalendarEvent  # noqa: F401
# from app.models.tasks import Task, TaskCompletion  # noqa: F401
# from app.models.photos import Photo, Album, AlbumPhoto  # noqa: F401
