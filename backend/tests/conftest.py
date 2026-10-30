import pytest_asyncio
from app.database import engine, init_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_test_database():
    """Initializes tables and triggers once for the entire test session."""
    await init_db()
    yield
    await engine.dispose()
