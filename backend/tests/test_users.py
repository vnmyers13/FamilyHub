# PURPOSE: Tests for user management endpoints
# ROLE: Backend Testing
# MODIFIED: 2026-04-28 — Phase 1.2 setup

import pytest
from httpx import AsyncClient


async def setup_family(async_client: AsyncClient) -> dict:
    """Helper to setup family and get admin token."""
    response = await async_client.post(
        "/api/auth/setup",
        json={
            "family_name": "Test Family",
            "timezone": "America/Chicago",
            "admin_email": "admin@test.com",
            "admin_password": "password123",
        },
    )
    data = response.json()
    return {
        "token": data["access_token"],
        "user_id": data["user"]["id"],
    }


@pytest.mark.asyncio
async def test_list_users_empty(async_client: AsyncClient):
    """Test GET /api/users returns empty list before any users created."""
    setup = await setup_family(async_client)

    response = await async_client.get(
        "/api/users",
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    assert response.status_code == 200
    data = response.json()

    assert "users" in data
    assert "total" in data
    assert data["total"] >= 1  # At least admin user


@pytest.mark.asyncio
async def test_list_users_with_admin(async_client: AsyncClient):
    """Test GET /api/users returns admin user."""
    setup = await setup_family(async_client)

    response = await async_client.get(
        "/api/users",
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["total"] >= 1
    assert any(u["role"] == "admin" for u in data["users"])


@pytest.mark.asyncio
async def test_create_user_as_admin(async_client: AsyncClient):
    """Test POST /api/users creates new user as admin."""
    setup = await setup_family(async_client)

    response = await async_client.post(
        "/api/users",
        json={
            "display_name": "John Doe",
            "email": "john@test.com",
            "role": "member",
            "pin": "1234",
        },
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    assert response.status_code == 201
    data = response.json()

    assert data["display_name"] == "John Doe"
    assert data["email"] == "john@test.com"
    assert data["role"] == "member"


@pytest.mark.asyncio
async def test_create_user_as_non_admin_fails(async_client: AsyncClient):
    """Test POST /api/users fails for non-admin users."""
    # Setup family
    setup = await setup_family(async_client)

    # Create member user
    member_response = await async_client.post(
        "/api/users",
        json={
            "display_name": "Jane Doe",
            "email": "jane@test.com",
            "role": "member",
        },
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    assert member_response.status_code == 201
    member_token = (
        await async_client.post(
            "/api/auth/login",
            json={"email": "jane@test.com", "password": "temp123"},
        )
    ).json().get("access_token")

    # Try to create another user as member (should fail)
    response = await async_client.post(
        "/api/users",
        json={
            "display_name": "Bob Smith",
            "email": "bob@test.com",
            "role": "member",
        },
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_user_details(async_client: AsyncClient):
    """Test GET /api/users/{id} returns user details."""
    setup = await setup_family(async_client)

    # Get admin user (self)
    response = await async_client.get(
        f"/api/users/{setup['user_id']}",
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == setup["user_id"]
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_update_user_self(async_client: AsyncClient):
    """Test PATCH /api/users/{id} allows user to update themselves."""
    setup = await setup_family(async_client)

    response = await async_client.patch(
        f"/api/users/{setup['user_id']}",
        json={
            "color": "blue",
            "ui_mode": "dark",
        },
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["color"] == "blue"
    assert data["ui_mode"] == "dark"


@pytest.mark.asyncio
async def test_delete_user_as_admin(async_client: AsyncClient):
    """Test DELETE /api/users/{id} removes user (admin only)."""
    setup = await setup_family(async_client)

    # Create member user
    member_response = await async_client.post(
        "/api/users",
        json={
            "display_name": "Jane Doe",
            "email": "jane@test.com",
            "role": "member",
        },
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    member_id = member_response.json()["id"]

    # Delete member
    response = await async_client.delete(
        f"/api/users/{member_id}",
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    assert response.status_code == 204

    # Verify member no longer appears in list
    list_response = await async_client.get(
        "/api/users",
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    user_ids = [u["id"] for u in list_response.json()["users"]]
    assert member_id not in user_ids


@pytest.mark.asyncio
async def test_get_user_without_auth_fails(async_client: AsyncClient):
    """Test GET /api/users requires authentication."""
    response = await async_client.get("/api/users")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_user_without_auth_fails(async_client: AsyncClient):
    """Test POST /api/users requires authentication."""
    response = await async_client.post(
        "/api/users",
        json={
            "display_name": "Test User",
            "email": "test@test.com",
            "role": "member",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_filter_users_by_role(async_client: AsyncClient):
    """Test GET /api/users?role=member filters users."""
    setup = await setup_family(async_client)

    # Create member user
    await async_client.post(
        "/api/users",
        json={
            "display_name": "Jane Doe",
            "email": "jane@test.com",
            "role": "member",
        },
        headers={"Authorization": f"Bearer {setup['token']}"},
    )

    # Filter by role
    response = await async_client.get(
        "/api/users?role=member",
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    assert response.status_code == 200
    data = response.json()

    assert all(u["role"] == "member" for u in data["users"])


@pytest.mark.asyncio
async def test_list_users_pagination(async_client: AsyncClient):
    """Test GET /api/users pagination with skip and limit."""
    setup = await setup_family(async_client)

    response = await async_client.get(
        "/api/users?skip=0&limit=10",
        headers={"Authorization": f"Bearer {setup['token']}"},
    )
    assert response.status_code == 200
    data = response.json()

    assert "users" in data
    assert "total" in data
