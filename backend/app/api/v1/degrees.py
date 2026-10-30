"""
API v1 Endpoints for W3C Degree Certificate Studio & Stateless Offline Ed25519 QR Verifier.

Official AICTE Requirement 10:
Degree-awarding bodies must explicitly include BOTH apaar_id (or provisional_token)
AND institutional_student_id (roll number) side-by-side on the credential.

Endpoints:
- POST /api/v1/degrees/issue/{student_enrolment_id}: Issues signed W3C VC v2.0 Degree.
- POST /api/v1/degrees/revoke/{bit_index}: Revokes degree in W3C Bitstring Status List.
- POST /api/v1/degrees/verify-offline: Stateless offline QR code verifier.
"""

from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crypto.degree_vc import (
    generate_w3c_degree_credential,
    set_revocation_bit,
    verify_offline_degree_vc,
)
from app.crypto.merkle_audit import append_audit_event
from app.database import get_db
from app.models.student import StudentEnrolment
from app.schemas.degrees import (
    IssueDegreeRequest,
    OfflineVerifyRequest,
    OfflineVerifyResponse,
    RevocationRequest,
    RevocationResponse,
    W3CDegreeCredentialResponse,
)

router = APIRouter(prefix="/degrees", tags=["W3C Degree Certificate Studio"])


@router.post(
    "/issue/{student_enrolment_id}",
    summary="Issue W3C Verifiable Degree Credential (Requirement 10)",
    response_model=W3CDegreeCredentialResponse,
    status_code=status.HTTP_201_CREATED,
)
async def issue_degree(
    student_enrolment_id: uuid.UUID,
    body: IssueDegreeRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Issues an official W3C Verifiable Credential v2.0 degree featuring BOTH
    apaar_id AND institutional_student_id (roll number) side-by-side, signed with
    Ed25519 and registered with a W3C Bitstring Status List revocation index.
    """
    stmt = (
        select(StudentEnrolment)
        .where(StudentEnrolment.id == student_enrolment_id)
        .options(
            selectinload(StudentEnrolment.institution),
            selectinload(StudentEnrolment.program_quota),
        )
    )
    student = (await session.execute(stmt)).scalar_one_or_none()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student enrolment '{student_enrolment_id}' not found.",
        )

    # Issue credential
    cred_resp = generate_w3c_degree_credential(
        student=student,
        graduation_year=body.graduation_year,
        degree_level=body.degree_level,
        specialization=body.specialization,
        cgpa=body.cgpa or 8.75,
    )

    # Append Checkpoint Audit Event
    await append_audit_event(
        session=session,
        actor_role="UNIVERSITY_REGISTRAR",
        action_type="DEGREE_CREDENTIAL_ISSUED",
        entity_id=cred_resp.credential_id,
        payload_json={
            "credential_id": cred_resp.credential_id,
            "student_enrolment_id": str(student.id),
            "apaar_id": cred_resp.apaar_id,
            "institutional_student_id": cred_resp.institutional_student_id,
            "institution_name": cred_resp.institution_name,
            "program_name": cred_resp.program_name,
            "revocation_bit_index": cred_resp.revocation_bit_index,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        is_checkpoint=True,
    )
    await session.commit()

    return cred_resp


@router.post(
    "/revoke/{bit_index}",
    summary="Revoke Degree Credential via W3C Bitstring Status List",
    response_model=RevocationResponse,
    status_code=status.HTTP_200_OK,
)
async def revoke_degree(
    bit_index: int,
    body: RevocationRequest,
    session: AsyncSession = Depends(get_db),
):
    """
    Revokes a degree credential by flipping its bit in the W3C Bitstring Status List.
    Immediately causes all subsequent offline and online verifications to fail as REVOKED.
    """
    try:
        set_revocation_bit(bit_index, value=True)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    now_iso = datetime.now(timezone.utc).isoformat()

    # Append Checkpoint Audit Entry
    await append_audit_event(
        session=session,
        actor_role="UNIVERSITY_SENATE",
        action_type="DEGREE_CREDENTIAL_REVOKED",
        entity_id=f"STATUS_INDEX_{bit_index}",
        payload_json={
            "bit_index": bit_index,
            "reason": body.reason,
            "timestamp": now_iso,
        },
        is_checkpoint=True,
    )
    await session.commit()

    return RevocationResponse(
        status="REVOKED_SUCCESSFULLY",
        bit_index=bit_index,
        revocation_timestamp=now_iso,
        status_list_credential="https://apaarnet.gov.in/status-list/degree-2026",
        explanation=f"Credential bit at index {bit_index} flipped to 1. Credential is now revoked.",
    )


@router.post(
    "/verify-offline",
    summary="Stateless Offline Ed25519 QR Verifier (0 DB Queries Required)",
    response_model=OfflineVerifyResponse,
    status_code=status.HTTP_200_OK,
)
async def verify_offline_degree(body: OfflineVerifyRequest):
    """
    Verifies any scanned W3C degree QR payload + Ed25519 signature + revocation bitstring
    completely statelessly (zero database queries required). Immediately fails if even a single
    character in the student name, APAAR ID, or roll number was tampered with.
    """
    result = verify_offline_degree_vc(
        w3c_vc_json=body.w3c_vc_json,
        issuer_public_key_hex=body.issuer_public_key_hex,
    )
    return result
