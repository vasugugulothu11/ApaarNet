"""
API v1 Endpoints for AI/ML Intelligence Layer & Tri-Party Dispute Adjudication.

Endpoints:
- GET /api/v1/intelligence/collisions: Dual-degree legality scan and Fellegi-Sunter phonetic linkage.
- GET /api/v1/intelligence/ghost-rings: NetworkX bipartite graph topology & syndicate ring summaries.
- GET /api/v1/intelligence/risk-rankings: Isolation Forest 0-100 institutional rankings with SHAP waterfall.
- GET /api/v1/intelligence/disputes: List active and historical tri-party dispute tickets.
- POST /api/v1/intelligence/disputes/{ticket_id}/resolve: Adjudicate dispute with signed Merkle audit checkpoint.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crypto.merkle_audit import append_audit_event
from app.database import get_db
from app.ml.anomaly_shap import compute_institutional_anomaly_scores
from app.ml.entity_resolution import (
    scan_exact_apaar_collisions,
    scan_phonetic_provisional_collisions,
)
from app.ml.ghost_ring_graph import detect_ghost_admission_rings
from app.models.dispute import DisputeTicket
from app.models.enums import DisputeStatus, ValidationStatus
from app.models.student import StudentEnrolment
from app.schemas.intelligence import (
    CollisionsResponse,
    DisputeResolutionRequest,
    DisputeTicketResponse,
    GhostRingGraphResponse,
    RiskRankingsResponse,
)

router = APIRouter(prefix="/intelligence", tags=["AI/ML & Graph Intelligence"])


@router.get(
    "/collisions",
    summary="Dual-Degree-Aware Collisions & Phonetic Fellegi-Sunter Linkage",
    response_model=CollisionsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_collisions(session: AsyncSession = Depends(get_db)):
    """
    Returns:
    1. Exact APAAR Cross-Institution Collisions evaluated against the UGC 2022
       Dual-Degree Legality Matrix (Lawful Dual-Degree vs. Illegal Concurrent Regular).
    2. Unlinked/Provisional Indic Phonetic Linkage evaluated using Fellegi-Sunter
       probabilistic scoring with the Twin Disambiguation Guard.
    """
    exact_collisions = await scan_exact_apaar_collisions(session)
    phonetic_matches = await scan_phonetic_provisional_collisions(session)

    lawful_count = sum(1 for c in exact_collisions if c.is_lawful)
    illegal_count = sum(1 for c in exact_collisions if not c.is_lawful)

    return CollisionsResponse(
        total_exact_collisions=len(exact_collisions),
        lawful_ugc_dual_degrees=lawful_count,
        illegal_concurrent_regular=illegal_count,
        exact_collisions=exact_collisions,
        phonetic_matches=phonetic_matches,
    )


@router.get(
    "/ghost-rings",
    summary="Ghost Admission Ring Bipartite Graph Detection",
    response_model=GhostRingGraphResponse,
    status_code=status.HTTP_200_OK,
)
async def get_ghost_rings(
    min_ring_size: int = 3,
    session: AsyncSession = Depends(get_db),
):
    """
    Extracts multi-college ghost admission rings using NetworkX bipartite graph analysis,
    highlighting shared contact coordinates (phones, emails, bank hashes) and returning
    React-Flow / D3 visualization topology.
    """
    result = await detect_ghost_admission_rings(session=session, min_ring_size=min_ring_size)
    return result


@router.get(
    "/risk-rankings",
    summary="Isolation Forest Institutional Anomaly Rankings with SHAP Waterfall",
    response_model=RiskRankingsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_risk_rankings(session: AsyncSession = Depends(get_db)):
    """
    Calculates 5-feature engineering vectors across all institutions, applies Isolation Forest,
    generates exact SHAP waterfall feature attributions, and returns ranked risk profiles.
    """
    result = await compute_institutional_anomaly_scores(session)
    return result


@router.get(
    "/disputes",
    summary="List Active Tri-Party Dispute Tickets",
    response_model=List[DisputeTicketResponse],
    status_code=status.HTTP_200_OK,
)
async def list_disputes(session: AsyncSession = Depends(get_db)):
    """
    Lists all Tri-Party Dispute Tickets with college metadata and evidence logs.
    """
    stmt = (
        select(DisputeTicket)
        .options(
            selectinload(DisputeTicket.college_a),
            selectinload(DisputeTicket.college_b),
        )
        .order_by(DisputeTicket.created_at.desc())
    )
    tickets = list((await session.execute(stmt)).scalars().all())

    responses: List[DisputeTicketResponse] = []
    for t in tickets:
        responses.append(
            DisputeTicketResponse(
                id=t.id,
                student_apaar_or_token=t.student_apaar_or_token,
                college_a_id=t.college_a_id,
                college_a_name=t.college_a.name if t.college_a else "College A",
                college_b_id=t.college_b_id,
                college_b_name=t.college_b.name if t.college_b else "College B",
                collision_type=t.collision_type,
                status=t.status,
                evidence_log=t.evidence_log or {},
                officer_decision_reason=t.officer_decision_reason,
                created_at=t.created_at,
            )
        )
    return responses


@router.post(
    "/disputes/{ticket_id}/resolve",
    summary="Adjudicate Tri-Party Dispute with Cryptographic Audit Trail",
    response_model=DisputeTicketResponse,
    status_code=status.HTTP_200_OK,
)
async def resolve_dispute(
    ticket_id: uuid.UUID,
    body: DisputeResolutionRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Allows an AICTE Hearing Officer or College Authority to adjudicate a dispute ticket
    (RESOLVED_VALID or CONFIRMED_DUPLICATE), update student record statuses, and log the
    resolution in the Ed25519-signed Merkle audit ledger.
    """
    ticket_res = await session.execute(
        select(DisputeTicket)
        .where(DisputeTicket.id == ticket_id)
        .options(
            selectinload(DisputeTicket.college_a),
            selectinload(DisputeTicket.college_b),
        )
    )
    ticket = ticket_res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispute ticket with ID '{ticket_id}' not found.",
        )

    if body.decision not in (DisputeStatus.RESOLVED_VALID.value, DisputeStatus.CONFIRMED_DUPLICATE.value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be either 'RESOLVED_VALID' or 'CONFIRMED_DUPLICATE'.",
        )

    ticket.status = body.decision
    ticket.officer_decision_reason = body.officer_decision_reason

    # Merge additional evidence into evidence_log
    ev = dict(ticket.evidence_log or {})
    if body.additional_evidence:
        ev["adjudication_evidence"] = body.additional_evidence
    ev["adjudicated_at"] = datetime.now(timezone.utc).isoformat()
    ticket.evidence_log = ev

    # Update associated student records if confirmed duplicate
    token_or_apaar = ticket.student_apaar_or_token
    stu_stmt = select(StudentEnrolment).where(
        (StudentEnrolment.apaar_id == token_or_apaar)
        | (StudentEnrolment.provisional_token == token_or_apaar)
    )
    associated_students = list((await session.execute(stu_stmt)).scalars().all())

    for student in associated_students:
        if body.decision == DisputeStatus.CONFIRMED_DUPLICATE.value:
            # If a specific institution was retained, keep that one valid and flag the other
            if body.retained_institution_id and student.institution_id == body.retained_institution_id:
                student.validation_status = ValidationStatus.ACCEPTED.value
            else:
                student.validation_status = ValidationStatus.FLAGGED_VIOLATION.value
                student.flag_reasons = (student.flag_reasons or []) + [{
                    "rule": "AICTE-OFFICER-ORDER",
                    "code": "CONFIRMED_DUPLICATE_ADJUDICATION",
                    "description": body.officer_decision_reason,
                }]
        elif body.decision == DisputeStatus.RESOLVED_VALID.value:
            student.validation_status = ValidationStatus.ACCEPTED.value

    # Append Ed25519 Checkpoint Audit Event
    await append_audit_event(
        session=session,
        actor_role="AICTE_HEARING_OFFICER",
        action_type="DISPUTE_ADJUDICATED",
        entity_id=str(ticket.id),
        payload_json={
            "dispute_ticket_id": str(ticket.id),
            "student_identifier": token_or_apaar,
            "decision": body.decision,
            "decision_reason": body.officer_decision_reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        is_checkpoint=True,
    )

    await session.commit()

    return DisputeTicketResponse(
        id=ticket.id,
        student_apaar_or_token=ticket.student_apaar_or_token,
        college_a_id=ticket.college_a_id,
        college_a_name=ticket.college_a.name if ticket.college_a else "College A",
        college_b_id=ticket.college_b_id,
        college_b_name=ticket.college_b.name if ticket.college_b else "College B",
        collision_type=ticket.collision_type,
        status=ticket.status,
        evidence_log=ticket.evidence_log or {},
        officer_decision_reason=ticket.officer_decision_reason,
        created_at=ticket.created_at,
    )
