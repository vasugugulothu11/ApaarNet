"""
API v1 Endpoints for Adaptive Schema Ingestion & Pre-Commit Sandbox Diff Chamber.

Provides:
- POST /api/v1/ingest/preview-mapping: Fuzzy column alignment and drift detection.
- POST /api/v1/ingest/sandbox-diff: Non-mutating pre-commit simulation & delta classification.
- POST /api/v1/ingest/commit-batch: Idempotent batch ingestion with Merkle ledger signature.
"""

import json
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ingestion import (
    auto_map_column_headers,
    commit_batch_enrolments,
    evaluate_sandbox_diff,
    parse_file_to_rows,
)
from app.database import get_db
from app.schemas.ingestion import (
    CommitBatchRequest,
    CommitBatchResponse,
    PreviewMappingRequest,
    PreviewMappingResponse,
    SandboxDiffRequest,
    SandboxDiffResponse,
)

router = APIRouter(prefix="/ingest", tags=["Adaptive Schema Ingestion"])


@router.post(
    "/preview-mapping",
    summary="Fuzzy Schema-Drift Column Alignment Preview",
    response_model=PreviewMappingResponse,
    status_code=status.HTTP_200_OK,
)
async def preview_mapping(
    file: Optional[UploadFile] = File(None),
    payload: Optional[str] = Form(None),
):
    """
    Accepts CSV, Excel (.xlsx), or JSON files (or JSON form payload) containing non-standard
    or drifted column headers. Uses normalized token matching + Jaro-Winkler similarity to
    auto-align columns against ApaarNet canonical fields, returning confidence scores and
    flagging missing required fields before validation.
    """
    headers: List[str] = []
    rows: List[Dict[str, Any]] = []

    # 1. Check if file uploaded
    if file:
        file_bytes = await file.read()
        try:
            headers, rows = parse_file_to_rows(file_bytes, file.filename or "upload.csv")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse uploaded file: {str(e)}",
            )
    elif payload:
        try:
            data = json.loads(payload)
            if isinstance(data, dict):
                headers = data.get("headers", [])
                rows = data.get("records", [])
                if not headers and rows:
                    headers = list(rows[0].keys())
            elif isinstance(data, list) and data and isinstance(data[0], dict):
                headers = list(data[0].keys())
                rows = data
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON payload: {str(e)}",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a file upload or a JSON payload must be provided.",
        )

    if not headers and not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No headers or records detected in payload.",
        )

    mappings, mapped_canonical, missing_req = auto_map_column_headers(headers)

    # Build 3-row sample preview with mapped names
    sample_preview = []
    for r in rows[:5]:
        preview_row = {}
        for src_col, val in r.items():
            mapped_target = mappings.get(src_col)
            if mapped_target and mapped_target.target_field:
                preview_row[mapped_target.target_field] = val
            else:
                preview_row[src_col] = val
        sample_preview.append(preview_row)

    return PreviewMappingResponse(
        source_headers=headers,
        mappings=mappings,
        mapped_canonical_fields=mapped_canonical,
        missing_required_fields=missing_req,
        sample_preview=sample_preview,
    )


@router.post(
    "/preview-mapping-json",
    summary="JSON Payload Preview Mapping",
    response_model=PreviewMappingResponse,
    status_code=status.HTTP_200_OK,
)
async def preview_mapping_json(body: PreviewMappingRequest):
    """
    JSON body variant for preview mapping for pure REST clients.
    """
    headers = body.headers or []
    rows = body.records or []

    if not headers and rows:
        headers = list(rows[0].keys())

    if not headers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No column headers provided in request body.",
        )

    mappings, mapped_canonical, missing_req = auto_map_column_headers(headers)

    sample_preview = []
    for r in rows[:5]:
        preview_row = {}
        for src_col, val in r.items():
            mapped_target = mappings.get(src_col)
            if mapped_target and mapped_target.target_field:
                preview_row[mapped_target.target_field] = val
            else:
                preview_row[src_col] = val
        sample_preview.append(preview_row)

    return PreviewMappingResponse(
        source_headers=headers,
        mappings=mappings,
        mapped_canonical_fields=mapped_canonical,
        missing_required_fields=missing_req,
        sample_preview=sample_preview,
    )


@router.post(
    "/sandbox-diff",
    summary="Pre-Commit Sandbox Diff Chamber",
    response_model=SandboxDiffResponse,
    status_code=status.HTTP_200_OK,
)
async def sandbox_diff(
    body: SandboxDiffRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Evaluates a batch of student rows against:
    - 12-digit Verhoeff APAAR validation & provisional token issuance,
    - Mandatory passport/OCI documentation for Foreign Nationals,
    - Real-time AICTE APH quota consumption (base intake, 5% NRI, 15% supernumerary),
    - Row-level delta classification (NEW_INSERT, FIELD_MODIFIED_DIFF, IDEMPOTENT_NO_CHANGE, REJECTED_OR_FLAGGED).
    Completely non-mutating sandbox simulation.
    """
    try:
        response = await evaluate_sandbox_diff(
            session=session,
            institution_id=body.institution_id,
            program_quota_id=body.program_quota_id,
            rows=body.rows,
            column_mapping=body.column_mapping,
            simulate_registry_downtime=body.simulate_registry_downtime,
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sandbox evaluation error: {str(e)}",
        )


@router.post(
    "/commit-batch",
    summary="Idempotent Batch Commit with Merkle Audit Ledger",
    response_model=CommitBatchResponse,
    status_code=status.HTTP_200_OK,
)
async def commit_batch(
    body: CommitBatchRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Commits approved/warning rows into student_enrolments, updates existing records cleanly
    on FIELD_MODIFIED_DIFF, skips IDEMPOTENT_NO_CHANGE rows so re-running uploads never creates
    duplicate records, and creates a signed checkpoint entry in merkle_audit_log.
    """
    try:
        response = await commit_batch_enrolments(
            session=session,
            institution_id=body.institution_id,
            program_quota_id=body.program_quota_id,
            rows=body.rows,
            allow_flagged_with_warning=body.allow_flagged_with_warning,
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch commit error: {str(e)}",
        )
