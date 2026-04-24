# PURPOSE: Tests for database migrations
# ROLE: Backend Testing
# MODIFIED: 2026-04-24 — Phase 1.1 setup

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_initial_schema_tables_exist(db_session: AsyncSession):
    """Test that all required tables exist after migration."""
    result = await db_session.execute(
        text("SELECT name FROM sqlite_master WHERE type='table'")
    )
    tables = [row[0] for row in result.fetchall()]

    assert "families" in tables
    assert "users" in tables
    assert "sessions" in tables


@pytest.mark.asyncio
async def test_families_table_structure(db_session: AsyncSession):
    """Test families table has required columns."""
    result = await db_session.execute(
        text("PRAGMA table_info(families)")
    )
    columns = {row[1]: row[2] for row in result.fetchall()}

    assert "id" in columns
    assert "name" in columns
    assert "timezone" in columns
    assert "created_at" in columns


@pytest.mark.asyncio
async def test_users_table_structure(db_session: AsyncSession):
    """Test users table has required columns."""
    result = await db_session.execute(
        text("PRAGMA table_info(users)")
    )
    columns = {row[1]: row[2] for row in result.fetchall()}

    assert "id" in columns
    assert "family_id" in columns
    assert "display_name" in columns
    assert "email" in columns
    assert "role" in columns
    assert "password_hash" in columns


@pytest.mark.asyncio
async def test_sessions_table_structure(db_session: AsyncSession):
    """Test sessions table has required columns."""
    result = await db_session.execute(
        text("PRAGMA table_info(sessions)")
    )
    columns = {row[1]: row[2] for row in result.fetchall()}

    assert "id" in columns
    assert "user_id" in columns
    assert "token_hash" in columns
    assert "expires_at" in columns
