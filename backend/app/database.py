from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

import sys
from sqlalchemy.pool import NullPool
from app.config import settings

# SQLAlchemy 2.0 Async Engine with pool_pre_ping enabled
pool_kwargs = {"pool_pre_ping": True}
if "pytest" in sys.modules:
    pool_kwargs["poolclass"] = NullPool

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    **pool_kwargs,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_db_health() -> bool:
    """Executes a ping query to verify database connectivity and readiness."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            return result.scalar() == 1
    except Exception:
        return False


MERKLE_TRIGGER_STATEMENTS = [
    """
    CREATE OR REPLACE FUNCTION fn_merkle_audit_log_insert()
    RETURNS TRIGGER AS $$
    DECLARE
        last_hash TEXT;
    BEGIN
        IF NEW.prev_hash IS NULL OR NEW.prev_hash = '' THEN
            SELECT record_hash INTO last_hash
            FROM merkle_audit_log
            ORDER BY seq_id DESC
            LIMIT 1;

            NEW.prev_hash := COALESCE(last_hash, 'GENESIS');
        END IF;

        NEW.record_hash := encode(
            sha256(convert_to(COALESCE(NEW.prev_hash, 'GENESIS') || NEW.payload_json::text, 'UTF8')),
            'hex'
        );

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """,
    "DROP TRIGGER IF EXISTS trg_merkle_audit_log_insert ON merkle_audit_log;",
    """
    CREATE TRIGGER trg_merkle_audit_log_insert
    BEFORE INSERT ON merkle_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION fn_merkle_audit_log_insert();
    """,
    """
    CREATE OR REPLACE FUNCTION fn_merkle_audit_log_immutable()
    RETURNS TRIGGER AS $$
    BEGIN
        RAISE EXCEPTION 'MerkleAuditLog is an append-only cryptographic ledger. UPDATE and DELETE operations are strictly prohibited!';
    END;
    $$ LANGUAGE plpgsql;
    """,
    "DROP TRIGGER IF EXISTS trg_merkle_audit_log_immutable ON merkle_audit_log;",
    """
    CREATE TRIGGER trg_merkle_audit_log_immutable
    BEFORE UPDATE OR DELETE ON merkle_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION fn_merkle_audit_log_immutable();
    """,
]


async def init_db() -> None:
    """Initializes all database tables and installs PostgreSQL Merkle ledger triggers."""
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if "postgresql" in settings.DATABASE_URL:
            await conn.execute(text("ALTER TABLE consent_records ALTER COLUMN apaar_id TYPE VARCHAR(64);"))
            for stmt in MERKLE_TRIGGER_STATEMENTS:
                await conn.execute(text(stmt))


