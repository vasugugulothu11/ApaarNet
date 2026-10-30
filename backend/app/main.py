from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import check_db_health, engine, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks: initialize tables and triggers
    await init_db()

    # Cloud Auto-Seed Resilience: Pre-populate fresh cloud database if empty
    try:
        from sqlalchemy import func, select
        from app.database import AsyncSessionLocal
        from app.models.institution import Institution
        from app.core.seeder import seed_apaarnet_database

        async with AsyncSessionLocal() as session:
            count = await session.scalar(select(func.count()).select_from(Institution))
            if count == 0:
                print("Institutions table empty on startup. Triggering cloud auto-seed...")
                await seed_apaarnet_database(session)
                print("Cloud auto-seed completed: 50 institutions and Cases A-E ready.")
    except Exception as e:
        print(f"Warning: Startup auto-seed check skipped or failed: {e}")

    yield
    # Shutdown tasks: dispose connection pool cleanly
    await engine.dispose()



app = FastAPI(
    title="ApaarNet Core API",
    description=(
        "APAAR ID-Based Student Data Management and Verification Platform "
        "for AICTE-Approved Institutions (SIH26263)."
    ),
    version=settings.VERSION,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from app.api.v1 import api_v1_router, auth_router

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://apaar-net.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        *settings.CORS_ORIGINS,
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

# Direct /auth mounting fallback to prevent 404s if called without /api/v1 prefix
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])



@app.get("/healthz", summary="Liveness Probe", tags=["System"])
async def healthz():
    """Liveness probe indicating the application process is running."""
    return {
        "status": "alive",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/readyz", summary="Readiness Probe", tags=["System"])
async def readyz():
    """Readiness probe checking PostgreSQL database connectivity."""
    is_ready = await check_db_health()
    if not is_ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "database": "disconnected",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
    return {
        "status": "ready",
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/", summary="Root Index", tags=["System"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/healthz",
        "ready": "/readyz",
    }
