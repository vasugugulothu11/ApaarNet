from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.quota import router as quota_router
from app.api.v1.admin import router as admin_router
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.intelligence import router as intelligence_router
from app.api.v1.verify import router as verify_router
from app.api.v1.degrees import router as degrees_router
from app.api.v1.reports import router as reports_router
from app.api.v1.audit import router as audit_router

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(quota_router)
router.include_router(admin_router)
router.include_router(ingestion_router)
router.include_router(intelligence_router)
router.include_router(verify_router)
router.include_router(degrees_router)
router.include_router(reports_router)
router.include_router(audit_router)

api_v1_router = router

__all__ = [
    "router",
    "api_v1_router",
    "auth_router",
    "quota_router",
    "admin_router",
    "ingestion_router",
    "intelligence_router",
    "verify_router",
    "degrees_router",
    "reports_router",
    "audit_router",
]
