"""
API v1 Endpoints for Cryptographic Merkle Ledger & Live Tamper Demonstration.

Endpoints:
- GET /api/v1/audit/ledger: Lists audit entries and validates end-to-end chain integrity.
- POST /api/v1/audit/simulate-tamper: Runs 1-click tamper simulation demonstrating hash-chain breakage.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crypto.merkle_audit import simulate_tamper_demonstration, verify_audit_chain
from app.database import get_db
from app.models.audit import MerkleAuditLog
from app.schemas.reports import AuditLedgerEntry, AuditLedgerResponse

router = APIRouter(prefix="/audit", tags=["Cryptographic Merkle Audit Ledger"])


@router.get(
    "/ledger",
    summary="Get Merkle Audit Ledger Entries & Verify Chain Integrity",
    response_model=AuditLedgerResponse,
    status_code=status.HTTP_200_OK,
)
async def get_audit_ledger(
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_db),
):
    """
    Fetches the latest immutable Merkle audit log entries from PostgreSQL and
    validates the SHA-256 hash-chain and Ed25519 checkpoint signatures end-to-end.
    """
    # Verify chain integrity
    integrity_result = await verify_audit_chain(session)

    # Fetch entries
    stmt = select(MerkleAuditLog).order_by(MerkleAuditLog.seq_id.desc()).limit(limit)
    rows = list((await session.execute(stmt)).scalars().all())

    entries: List[AuditLedgerEntry] = []
    for r in reversed(rows):
        entries.append(
            AuditLedgerEntry(
                sequence_number=r.seq_id,
                actor_role=r.actor_role,
                action_type=r.action_type,
                entity_id=r.entity_id,
                payload_json=r.payload_json,
                prev_hash=r.prev_hash,
                record_hash=r.record_hash,
                checkpoint_signature=r.checkpoint_signature,
                created_at=r.created_at.isoformat() if r.created_at else "",
            )
        )

    first_entry_hash = entries[0].record_hash if entries else None
    latest_entry_hash = entries[-1].record_hash if entries else None

    return AuditLedgerResponse(
        total_entries=integrity_result["total_records"],
        chain_integrity_valid=integrity_result["valid"],
        genesis_hash=first_entry_hash,
        latest_record_hash=latest_entry_hash,
        entries=entries,
    )


@router.post(
    "/simulate-tamper",
    summary="1-Click Merkle Hash-Chain Tamper Attack Simulation",
    status_code=status.HTTP_200_OK,
)
async def simulate_tamper():
    """
    Simulates an adversarial database tamper attack on an in-memory replica of the
    Merkle audit ledger (altering 1 character in a payload) and mathematically proves:
    1. Local SHA-256 hash mismatch.
    2. Cascade break of downstream hash-chain continuity.
    3. Ed25519 digital signature failure on audit checkpoint.
    """
    result = simulate_tamper_demonstration()
    return result
