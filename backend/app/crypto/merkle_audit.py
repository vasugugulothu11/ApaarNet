import copy
import hashlib
import json
from typing import Any, Dict, List, Optional, Tuple

import nacl.encoding
import nacl.exceptions
import nacl.signing
from sqlalchemy import String, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.audit import MerkleAuditLog


def get_signing_key(private_key_hex: Optional[str] = None) -> nacl.signing.SigningKey:
    """Returns the Ed25519 SigningKey from a 32-byte hex string."""
    key_hex = private_key_hex or settings.ED25519_PRIVATE_KEY
    return nacl.signing.SigningKey(bytes.fromhex(key_hex))


def get_verify_key(private_key_hex: Optional[str] = None) -> nacl.signing.VerifyKey:
    """Returns the Ed25519 VerifyKey corresponding to the signing key."""
    return get_signing_key(private_key_hex).verify_key


def sign_checkpoint(hash_str: str, private_key_hex: Optional[str] = None) -> str:
    """Signs a record hash using Ed25519 and returns a 128-character hex signature."""
    sk = get_signing_key(private_key_hex)
    signed = sk.sign(hash_str.encode("utf-8"))
    return signed.signature.hex()


def verify_checkpoint_signature(
    hash_str: str, signature_hex: str, private_key_hex: Optional[str] = None
) -> bool:
    """Verifies that an Ed25519 signature on a hash string is authentic."""
    try:
        vk = get_verify_key(private_key_hex)
        vk.verify(hash_str.encode("utf-8"), bytes.fromhex(signature_hex))
        return True
    except (nacl.exceptions.BadSignatureError, ValueError):
        return False


def canonical_json(payload: Dict[str, Any]) -> str:
    """Produces canonical JSON matching PostgreSQL JSONB text representation."""
    return json.dumps(payload, sort_keys=True, separators=(", ", ": "))


def compute_record_hash(prev_hash: Optional[str], payload: Dict[str, Any]) -> str:
    """Computes SHA-256 hash across (prev_hash || canonical_json)."""
    anchor = prev_hash if prev_hash else "GENESIS"
    json_text = canonical_json(payload)
    return hashlib.sha256((anchor + json_text).encode("utf-8")).hexdigest()


async def append_audit_event(
    session: AsyncSession,
    actor_role: str,
    action_type: str,
    entity_id: str,
    payload_json: Dict[str, Any],
    is_checkpoint: bool = False,
    checkpoint_interval: int = 10,
) -> MerkleAuditLog:
    """
    Appends an immutable audit event to merkle_audit_log.
    The database trigger guarantees SHA-256 chaining and prevents updates/deletes.
    If is_checkpoint is True or sequence falls on checkpoint_interval, an Ed25519
    signature is computed and anchored to the checkpoint root.
    """
    # 1. Fetch latest record to inspect sequence and previous hash
    query = select(MerkleAuditLog).order_by(MerkleAuditLog.seq_id.desc()).limit(1)
    result = await session.execute(query)
    last_log = result.scalar_one_or_none()

    next_seq = (last_log.seq_id + 1) if last_log else 1
    prev_hash = last_log.record_hash if last_log else "GENESIS"

    # Check if this record should be a cryptographic checkpoint
    should_checkpoint = is_checkpoint or (next_seq % checkpoint_interval == 0)

    # Compute expected hash using database JSONB conversion if on PostgreSQL,
    # guaranteeing exact character-for-character agreement with the trigger
    if "postgresql" in settings.DATABASE_URL:
        q = text(
            "SELECT encode(sha256(convert_to(cast(:prev as text) || cast(:payload as jsonb)::text, 'UTF8')), 'hex')"
        )
        expected_hash = await session.scalar(
            q, {"prev": prev_hash, "payload": json.dumps(payload_json)}
        )
    else:
        expected_hash = compute_record_hash(prev_hash, payload_json)

    checkpoint_sig = sign_checkpoint(expected_hash) if should_checkpoint else None

    log_entry = MerkleAuditLog(
        actor_role=actor_role,
        action_type=action_type,
        entity_id=str(entity_id),
        payload_json=payload_json,
        prev_hash=prev_hash,
        record_hash=expected_hash,
        checkpoint_signature=checkpoint_sig,
    )


    session.add(log_entry)
    await session.commit()
    await session.refresh(log_entry)

    return log_entry


async def verify_audit_chain(
    session: AsyncSession,
    start_seq_id: Optional[int] = None,
    end_seq_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Verifies the entire Merkle audit trail in the database:
    1. Validates that prev_hash correctly references the preceding record's record_hash.
    2. Recalculates the SHA-256 hash for each entry and validates it matches record_hash.
    3. Verifies every Ed25519 checkpoint signature.
    """
    query = select(
        MerkleAuditLog.seq_id,
        MerkleAuditLog.actor_role,
        MerkleAuditLog.action_type,
        MerkleAuditLog.entity_id,
        MerkleAuditLog.payload_json,
        MerkleAuditLog.payload_json.cast(String).label("pg_payload_text"),
        MerkleAuditLog.prev_hash,
        MerkleAuditLog.record_hash,
        MerkleAuditLog.checkpoint_signature,
    ).order_by(MerkleAuditLog.seq_id.asc())

    if start_seq_id is not None:
        query = query.where(MerkleAuditLog.seq_id >= start_seq_id)
    if end_seq_id is not None:
        query = query.where(MerkleAuditLog.seq_id <= end_seq_id)

    result = await session.execute(query)
    rows = result.fetchall()


    if not rows:
        return {
            "valid": True,
            "total_records": 0,
            "checkpoints_verified": 0,
            "errors": [],
            "last_record_hash": None,
        }

    errors: List[str] = []
    checkpoints_verified = 0

    for i, row in enumerate(rows):
        seq_id = row.seq_id
        prev_hash = row.prev_hash
        record_hash = row.record_hash
        checkpoint_sig = row.checkpoint_signature
        pg_payload_text = row.pg_payload_text
        payload_dict = row.payload_json

        # Step 1: Verify hash chain linking
        if i == 0:
            if start_seq_id is None and prev_hash != "GENESIS":
                errors.append(
                    f"Genesis record (seq {seq_id}) prev_hash '{prev_hash}' != 'GENESIS'"
                )
        else:
            prev_row = rows[i - 1]
            if prev_hash != prev_row.record_hash:
                errors.append(
                    f"Broken hash chain at seq {seq_id}: prev_hash '{prev_hash}' "
                    f"!= seq {prev_row.seq_id} record_hash '{prev_row.record_hash}'"
                )

        # Step 2: Verify SHA-256 record hash integrity
        expected_hash = hashlib.sha256(
            ((prev_hash or "GENESIS") + pg_payload_text).encode("utf-8")
        ).hexdigest()

        if record_hash != expected_hash:
            errors.append(
                f"Hash mismatch at seq {seq_id}: recorded '{record_hash}' "
                f"!= recalculated '{expected_hash}'"
            )

        # Step 3: Verify Ed25519 checkpoint signature if present
        if checkpoint_sig:
            is_valid_sig = verify_checkpoint_signature(
                record_hash, checkpoint_sig
            )
            if is_valid_sig:
                checkpoints_verified += 1
            else:
                errors.append(
                    f"Invalid Ed25519 checkpoint signature at seq {seq_id} for hash '{record_hash}'"
                )

    return {
        "valid": len(errors) == 0,
        "total_records": len(rows),
        "checkpoints_verified": checkpoints_verified,
        "errors": errors,
        "last_record_hash": rows[-1].record_hash if rows else None,
    }



def simulate_tamper_demonstration(records: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Demonstrates tamper evidence on an in-memory copy of Merkle audit records.
    Modifies 1 character in a payload and proves:
    1. Local hash mismatch occurs.
    2. Downstream hash-chain continuity breaks.
    3. Ed25519 checkpoint signature becomes cryptographically invalid.
    """
    if not records:
        # Create a sample chain of 3 records ending in a signed checkpoint
        records = []
        prev = "GENESIS"
        for idx, (role, action, ent, payload) in enumerate([
            ("AICTE_ADMIN", "INSTITUTION_REGISTER", "INST-101", {"name": "National Engineering College", "approved_intake": 120}),
            ("COLLEGE_OPERATOR", "BATCH_UPLOAD", "BATCH-01", {"student_count": 60, "category": "GENERAL_BASE"}),
            ("AICTE_AUDITOR", "CHECKPOINT_AUDIT", "CHK-01", {"verified_count": 60, "audit_status": "COMPLIANT"}),
        ], start=1):
            h = compute_record_hash(prev, payload)
            sig = sign_checkpoint(h) if idx == 3 else None
            records.append({
                "seq_id": idx,
                "actor_role": role,
                "action_type": action,
                "entity_id": ent,
                "payload_json": payload,
                "prev_hash": prev,
                "record_hash": h,
                "checkpoint_signature": sig,
            })
            prev = h

    # 1. Validate original chain
    original_records = copy.deepcopy(records)
    orig_valid = True
    for i, rec in enumerate(original_records):
        expected = compute_record_hash(rec["prev_hash"], rec["payload_json"])
        if rec["record_hash"] != expected:
            orig_valid = False
        if rec["checkpoint_signature"] and not verify_checkpoint_signature(rec["record_hash"], rec["checkpoint_signature"]):
            orig_valid = False

    # 2. Tamper with record 2: change student_count from 60 to 61 (single-character alteration)
    tampered_records = copy.deepcopy(records)
    target_rec = tampered_records[1]
    original_payload = copy.deepcopy(target_rec["payload_json"])
    target_rec["payload_json"]["student_count"] = 61  # 1 character tampered!

    # 3. Detect tamper failure points
    # Detection A: Local hash mismatch
    tampered_hash = compute_record_hash(target_rec["prev_hash"], target_rec["payload_json"])
    local_hash_mismatch = (target_rec["record_hash"] != tampered_hash)

    # Detection B: Downstream chain broken
    # If attacker updates target_rec["record_hash"] to tampered_hash:
    target_rec_forged = copy.deepcopy(target_rec)
    target_rec_forged["record_hash"] = tampered_hash
    next_rec = tampered_records[2]
    chain_link_broken = (next_rec["prev_hash"] != target_rec_forged["record_hash"])

    # Detection C: Ed25519 signature invalidation
    # If attacker tries to recompute next_rec hash to match:
    recomputed_next_hash = compute_record_hash(tampered_hash, next_rec["payload_json"])
    checkpoint_sig_invalid = not verify_checkpoint_signature(
        recomputed_next_hash, next_rec["checkpoint_signature"]
    )

    return {
        "status": "tamper_detected",
        "original_chain_valid": orig_valid,
        "tampered_seq_id": target_rec["seq_id"],
        "original_payload": original_payload,
        "tampered_payload": target_rec["payload_json"],
        "original_record_hash": target_rec["record_hash"],
        "tampered_record_hash": tampered_hash,
        "local_hash_mismatch_detected": local_hash_mismatch,
        "chain_link_broken_detected": chain_link_broken,
        "ed25519_checkpoint_signature_rejected": checkpoint_sig_invalid,
        "explanation": (
            "Modifying a single character ('60' -> '61') in student_count changed the SHA-256 digest from "
            f"{target_rec['record_hash'][:16]}... to {tampered_hash[:16]}.... "
            "Even if the attacker patches the local hash, the downstream link breaks at seq 3. "
            "If the attacker ripples the hash change downstream, the Ed25519 signature at the checkpoint "
            "fails verification because the attacker lacks the private signing key."
        ),
    }
