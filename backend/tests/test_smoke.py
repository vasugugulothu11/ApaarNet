import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_healthz():
    """Verify /healthz liveness probe returns alive status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/healthz")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert data["service"] == "ApaarNet Core API"
        assert "timestamp" in data


@pytest.mark.asyncio
async def test_readyz():
    """Verify /readyz readiness probe successfully connects to PostgreSQL."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/readyz")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert data["database"] == "connected"
        assert "timestamp" in data


@pytest.mark.asyncio
async def test_root():
    """Verify root index endpoint returns project metadata."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["project"] == "ApaarNet Core API"
        assert data["docs"] == "/docs"
        assert data["health"] == "/healthz"
        assert data["ready"] == "/readyz"
