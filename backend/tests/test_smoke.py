"""Smoke tests for FamilyHub Phase 1 scaffold.

Run inside the container:
  docker exec -w /app familyhub-api sh -c "PYTHONPATH=/app pytest tests/ -v"

Run locally (with venv):
  cd backend && python -m pytest tests/ -v
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.config import Settings


@pytest.fixture
async def client():
    """Reusable async test client fixture."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# ── Sync tests (no asyncio marker) ──────────────────────────────


class TestConfigSecurity:
    """Verify security-critical configuration is enforced."""

    def test_secret_key_rejects_empty_value(self):
        with pytest.raises(Exception):
            Settings(secret_key="")

    def test_secret_key_rejects_default_value(self):
        with pytest.raises(Exception):
            Settings(secret_key="default-change-in-production")

    def test_secret_key_rejects_changeme(self):
        with pytest.raises(Exception):
            Settings(secret_key="changeme")

    def test_secret_key_accepts_valid_value(self):
        s = Settings(secret_key="a-secure-random-key-at-least-32-chars-long!")
        assert s.secret_key == "a-secure-random-key-at-least-32-chars-long!"


# ── Async tests ─────────────────────────────────────────────────


class TestHealthEndpoint:
    """Verify the /api/health endpoint returns expected status."""

    pytestmark = pytest.mark.asyncio

    async def test_health_returns_200(self, client):
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "familyhub"

    async def test_health_content_type_json(self, client):
        resp = await client.get("/api/health")
        assert resp.headers["content-type"].startswith("application/json")


class TestRootEndpoint:
    """Verify the root endpoint returns a meaningful response."""

    pytestmark = pytest.mark.asyncio

    async def test_root_returns_200(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["version"] == "1.02"
        assert "docs" in data
