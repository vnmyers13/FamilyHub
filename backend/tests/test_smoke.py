"""Smoke tests for FamilyHub Phase 1 scaffold.

Run inside the container:
  docker exec -w /app familyhub-api sh -c "PYTHONPATH=/app pytest tests/ -v"
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app

pytestmark = pytest.mark.asyncio


class TestHealthEndpoint:
    """Verify the /api/health endpoint returns expected status."""

    async def test_health_returns_200(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "familyhub"

    async def test_health_content_type_json(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/health")
        assert resp.headers["content-type"].startswith("application/json")


class TestRootEndpoint:
    """Verify the root endpoint returns a meaningful response."""

    async def test_root_returns_200(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["version"] == "1.01"
        assert "docs" in data
