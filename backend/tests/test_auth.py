# PURPOSE: Tests for authentication endpoints
# ROLE: Backend Testing
# MODIFIED: 2026-04-28 — Phase 1.2 setup

import pytest
import json
from httpx import AsyncClient
from app.core.security import reset_rate_limit


@pytest.mark.asyncio
async def test_setup_creates_family_and_admin(async_client: AsyncClient):
    """Test POST /api/auth/setup creates family and admin user."""
    response = await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Test Family",
            "timezone": "America/Chicago",
            "admin_email": "admin@test.com",
            "admin_password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert "family" in data
    assert data["family"]["name"] == "Test Family"
    assert data["family"]["timezone"] == "America/Chicago"

    assert "user" in data
    assert data["user"]["email"] == "admin@test.com"
    assert data["user"]["role"] == "admin"

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_setup_prevents_duplicate_setup(async_client: AsyncClient):
    """Test POST /api/auth/setup fails if already setup."""
    # First setup
    await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Test Family",
            "timezone": "America/Chicago",
            "admin_email": "admin@test.com",
            "admin_password": "password123",
        },
    )

    # Second setup attempt
    response = await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Another Family",
            "timezone": "America/New_York",
            "admin_email": "admin2@test.com",
            "admin_password": "password456",
        },
    )
    assert response.status_code == 400
    assert "already setup" in response.json()["detail"]


@pytest.mark.asyncio
async def test_setup_status_after_setup(async_client: AsyncClient):
    """Test GET /api/auth/setup/status returns true after setup."""
    # Before setup
    response = await async_client.get("/api/auth/setup/status")
    assert response.status_code == 200
    assert response.json()["setup_complete"] is False

    # Setup
    await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Test Family",
            "timezone": "America/Chicago",
            "admin_email": "admin@test.com",
            "admin_password": "password123",
        },
    )

    # After setup
    response = await async_client.get("/api/auth/setup/status")
    assert response.status_code == 200
    assert response.json()["setup_complete"] is True


@pytest.mark.asyncio
async def test_login_with_valid_credentials(async_client: AsyncClient):
    """Test POST /api/auth/login with valid credentials."""
    # Setup first
    await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Test Family",
            "timezone": "America/Chicago",
            "admin_email": "admin@test.com",
            "admin_password": "password123",
        },
    )

    # Login
    reset_rate_limit("login:admin@test.com")
    response = await async_client.post(
        "/api/auth/login",
        json={
            "email": "admin@test.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert "user" in data
    assert data["user"]["email"] == "admin@test.com"
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_with_invalid_credentials(async_client: AsyncClient):
    """Test POST /api/auth/login rejects invalid credentials."""
    # Setup first
    await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Test Family",
            "timezone": "America/Chicago",
            "admin_email": "admin@test.com",
            "admin_password": "password123",
        },
    )

    # Wrong password
    reset_rate_limit("login:admin@test.com")
    response = await async_client.post(
        "/api/auth/login",
        json={
            "email": "admin@test.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_rate_limiting(async_client: AsyncClient):
    """Test rate limiting after 5 failed login attempts."""
    # Setup first
    await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Test Family",
            "timezone": "America/Chicago",
            "admin_email": "admin@test.com",
            "admin_password": "password123",
        },
    )

    # 5 failed attempts
    reset_rate_limit("login:admin@test.com")
    for i in range(5):
        response = await async_client.post(
            "/api/auth/login",
            json={
                "email": "admin@test.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    # 6th attempt - rate limited
    response = await async_client.post(
        "/api/auth/login",
        json={
            "email": "admin@test.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 429
    assert "Too many login attempts" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_me_with_valid_token(async_client: AsyncClient):
    """Test GET /api/auth/me returns user when authenticated."""
    # Setup and login
    setup_response = await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Test Family",
            "timezone": "America/Chicago",
            "admin_email": "admin@test.com",
            "admin_password": "password123",
        },
    )
    token = setup_response.json()["access_token"]

    # Get me
    response = await async_client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_get_me_without_token(async_client: AsyncClient):
    """Test GET /api/auth/me returns 401 without token."""
    response = await async_client.get("/api/auth/me")
    assert response.status_code == 403  # Missing credentials


@pytest.mark.asyncio
async def test_logout(async_client: AsyncClient):
    """Test POST /api/auth/logout returns 204."""
    # Setup and login
    setup_response = await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Test Family",
            "timezone": "America/Chicago",
            "admin_email": "admin@test.com",
            "admin_password": "password123",
        },
    )
    token = setup_response.json()["access_token"]

    # Logout
    response = await async_client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 204
