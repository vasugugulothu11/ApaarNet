import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.quota_engine import QuotaEngine

router = APIRouter(prefix="/quota", tags=["Quota Engine"])


@router.get(
    "/status/{program_quota_id}",
    summary="Get Program Quota Ledger Status",
    response_model=Dict[str, Any],
)
async def get_quota_status(
    program_quota_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
):
    """
    Returns real-time AICTE Approval Process Handbook (APH) 2024-27 quota allocation,
    breakdown by base and supernumerary quotas, and compliance violation status.
    """
    try:
        status_report = await QuotaEngine.get_quota_ledger_status(
            session=session,
            program_quota_id=program_quota_id,
        )
        return status_report
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/compare/{program_quota_id}",
    summary="Compare Naive Flat Counter vs ApaarNet Quota Ledger",
    response_model=Dict[str, Any],
)
async def compare_quota(
    program_quota_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
):
    """
    Demonstrates the USP of ApaarNet:
    Highlights false-positive reduction by differentiating sanctioned base intake
    from legitimate AICTE supernumerary quotas (OCI, FN, CIWGC, TFW, PMSSS).
    """
    try:
        comparison = await QuotaEngine.compare_naive_vs_apaarnet(
            session=session,
            program_quota_id=program_quota_id,
        )
        return comparison
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {str(e)}",
        )
