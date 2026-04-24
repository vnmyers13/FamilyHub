# PURPOSE: Tests for health check endpoints
# ROLE: Backend Testing
# MODIFIED: 2026-04-24 — Phase 1.1 setup

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    """Test GET /api/health returns 200 with status."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert data["status"] == "ok"
    assert "version" in data
    assert "timestamp" in data
    assert "database" in data


@pytest.mark.asyncio
async def test_health_response_format(async_client: AsyncClient):
    """Test health check response format."""
    response = await async_client.get("/api/health")
    data = response.json()

    # Verify all required fields are present
    assert isinstance(data["status"], str)
    assert isinstance(data["version"], str)
    assert isinstance(data["timestamp"], str)
    assert data["database"] in ["ok", "error"]


@pytest.mark.asyncio
async def test_readiness_check(async_client: AsyncClient):
    """Test GET /api/health/ready returns 200."""
    response = await async_client.get("/api/health/ready")
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert data["status"] == "ready"
