from fastapi import APIRouter
from app.api.v1.quota import router as quota_router
from app.api.v1.admin import router as admin_router
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.intelligence import router as intelligence_router
from app.api.v1.verify import router as verify_router
from app.api.v1.degrees import router as degrees_router
from app.api.v1.reports import router as reports_router
from app.api.v1.audit import router as audit_router

api_v1_router = APIRouter()
api_v1_router.include_router(quota_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(ingestion_router)
api_v1_router.include_router(intelligence_router)
api_v1_router.include_router(verify_router)
api_v1_router.include_router(degrees_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(audit_router)

__all__ = [
    "api_v1_router",
    "quota_router",
    "admin_router",
    "ingestion_router",
    "intelligence_router",
    "verify_router",
    "degrees_router",
    "reports_router",
    "audit_router",
]



