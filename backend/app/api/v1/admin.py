from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.seeder import seed_apaarnet_database

router = APIRouter(prefix="/admin", tags=["System Administration"])


@router.post(
    "/reseed-demo",
    summary="Reseed Demonstration Dataset & Planted Anomalies",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
)
async def reseed_demo_data(session: AsyncSession = Depends(get_db)):
    """
    Idempotently reseeds ApaarNet with 50 AICTE institutions across 10 Indian states
    and 5 high-impact demonstration anomaly cases for SIH live evaluation:
    1. Case A: Supernumerary Quota USP (240 Base + 36 Supernumerary + 6 Excess = 282).
    2. Case B: Lawful UGC Dual-Degree (Physical + ODL).
    3. Case C: Illegal Cross-State Regular Duplicate.
    4. Case D: Unlinked Phonetic Duplicate Evasion vs. Genuine Twin Disambiguation.
    5. Case E: 8-Student Ghost Admission Ring & Seat-Blocking Anomaly.
    """
    result = await seed_apaarnet_database(session)
    return result
