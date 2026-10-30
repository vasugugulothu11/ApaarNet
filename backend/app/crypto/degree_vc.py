"""
Requirement 10 University Degree Certificate Studio & Offline Ed25519 QR Verifier.

Implements:
1. W3C Verifiable Credential v2.0 Degree issuance side-by-side featuring BOTH
   apaar_id (or provisional_token) AND institutional_student_id (roll number)
   as mandated by Official AICTE Requirement 10.
2. Compact W3C Bitstring Status List for instant credential revocation.
3. Completely stateless offline QR verification with Ed25519 signature verification
   and bitstring check (0 database queries required).
"""

import copy
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import nacl.signing

from app.config import settings
from app.crypto.merkle_audit import get_signing_key, get_verify_key
from app.models.student import StudentEnrolment
from app.schemas.degrees import (
    OfflineVerifyResponse,
    RevocationResponse,
    W3CDegreeCredentialResponse,
)

# 100,000-bit W3C Revocation Bitstring Status List (in-memory persistent buffer)
STATUS_LIST_SIZE_BITS = 100000
_bitstring_buffer = bytearray((STATUS_LIST_SIZE_BITS + 7) // 8)


def set_revocation_bit(index: int, value: bool = True) -> None:
    """Sets revocation bit at index in the W3C Bitstring Status List."""
    if not (0 <= index < STATUS_LIST_SIZE_BITS):
        raise ValueError(f"Index {index} out of bitstring bounds (0 to {STATUS_LIST_SIZE_BITS - 1})")
    byte_idx = index // 8
    bit_offset = index % 8
    if value:
        _bitstring_buffer[byte_idx] |= (1 << bit_offset)
    else:
        _bitstring_buffer[byte_idx] &= ~(1 << bit_offset)


def get_revocation_bit(index: int) -> bool:
    """Queries revocation status bit at index (True = Revoked, False = Valid)."""
    if not (0 <= index < STATUS_LIST_SIZE_BITS):
        return True
    byte_idx = index // 8
    bit_offset = index % 8
    return bool((_bitstring_buffer[byte_idx] >> bit_offset) & 1)


def generate_w3c_degree_credential(
    student: StudentEnrolment,
    graduation_year: int = 2026,
    degree_level: str = "Bachelor of Technology",
    specialization: Optional[str] = None,
    cgpa: float = 8.75,
    bit_index: Optional[int] = None,
    private_key_hex: Optional[str] = None,
) -> W3CDegreeCredentialResponse:
    """
    Issues a W3C VC v2.0 Degree Certificate explicitly featuring BOTH
    apaar_id AND institutional_student_id side-by-side (AICTE Requirement 10).
    Signs the canonical JSON with Ed25519.
    """
    sk = get_signing_key(private_key_hex)
    vk = sk.verify_key
    public_key_hex = vk.encode().hex()

    credential_uuid = str(uuid.uuid4())
    cred_id = f"urn:uuid:{credential_uuid}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Deterministic or passed revocation bit index (derived from student ID or passed index)
    if bit_index is None:
        bit_index = abs(hash(str(student.id))) % 90000 + 1000

    student_apaar_or_token = student.apaar_id or student.provisional_token or "PROV-APN-UNASSIGNED"
    inst_name = student.institution.name if student.institution else "AICTE Approved University"
    aicte_id = student.institution.aicte_permanent_id if student.institution else "1-10000001"
    aishe_code = student.institution.aishe_code if student.institution else "C-10001"
    prog_name = student.program_quota.program_name if student.program_quota else "Computer Science and Engineering"

    # 1. Construct W3C Verifiable Credential v2.0 Document
    # Mandated Official Requirement 10: BOTH apaar_id and institutional_student_id
    doc_body = {
        "@context": [
            "https://www.w3.org/ns/credentials/v2",
            "https://www.w3.org/ns/credentials/examples/v2",
        ],
        "id": cred_id,
        "type": ["VerifiableCredential", "UniversityDegreeCredential"],
        "issuer": {
            "id": f"did:aicte:institution:{aicte_id}",
            "name": inst_name,
            "aicte_permanent_id": aicte_id,
            "aishe_code": aishe_code,
        },
        "validFrom": "2026-05-15T00:00:00Z",
        "credentialSubject": {
            "id": f"did:apaar:{student_apaar_or_token}",
            "apaar_id": student_apaar_or_token,
            "institutional_student_id": student.institutional_student_id,
            "full_name": student.full_name,
            "program_name": prog_name,
            "specialization": specialization or prog_name,
            "degree_level": degree_level,
            "graduation_year": graduation_year,
            "cumulative_grade_point_average": cgpa,
        },
        "credentialStatus": {
            "id": f"https://apaarnet.gov.in/status-list/degree-2026#{bit_index}",
            "type": "BitstringStatusListEntry",
            "statusPurpose": "revocation",
            "statusListIndex": bit_index,
            "statusListCredential": "https://apaarnet.gov.in/status-list/degree-2026",
        },
    }

    # 2. Canonicalize JSON & Sign with Ed25519
    canonical_json_bytes = json.dumps(doc_body, sort_keys=True).encode("utf-8")
    sig_hex = sk.sign(canonical_json_bytes).signature.hex()

    # 3. Attach W3C Cryptographic Proof
    w3c_vc = copy.deepcopy(doc_body)
    w3c_vc["proof"] = {
        "type": "Ed25519Signature2020",
        "created": now_iso,
        "verificationMethod": f"did:aicte:keys#{public_key_hex[:16]}",
        "proofPurpose": "assertionMethod",
        "proofValue": sig_hex,
    }

    # QR Payload String (compact JSON string formatted for physical printing)
    qr_payload_str = json.dumps(w3c_vc, separators=(",", ":"))

    return W3CDegreeCredentialResponse(
        credential_id=cred_id,
        student_enrolment_id=student.id,
        apaar_id=student_apaar_or_token,
        institutional_student_id=student.institutional_student_id,
        full_name=student.full_name,
        institution_name=inst_name,
        aicte_permanent_id=aicte_id,
        aishe_code=aishe_code,
        program_name=prog_name,
        graduation_year=graduation_year,
        revocation_bit_index=bit_index,
        w3c_vc_json=w3c_vc,
        qr_payload_string=qr_payload_str,
        issuer_public_key_hex=public_key_hex,
        issued_at=now_iso,
    )


def verify_offline_degree_vc(
    w3c_vc_json: Dict[str, Any],
    issuer_public_key_hex: Optional[str] = None,
) -> OfflineVerifyResponse:
    """
    Stateless Offline QR Verifier (0 database queries required):
    Verifies Ed25519 signature on canonical W3C VC JSON and checks revocation bit.
    Immediately fails if a single character in student name, APAAR ID, or roll number was tampered with.
    """
    if "proof" not in w3c_vc_json or not isinstance(w3c_vc_json["proof"], dict):
        return OfflineVerifyResponse(
            is_valid=False,
            status="CRYPTOGRAPHICALLY_INVALID",
            is_revoked=False,
            explanation="Missing or malformed cryptographic proof in W3C Verifiable Credential document.",
        )

    doc_copy = copy.deepcopy(w3c_vc_json)
    proof_block = doc_copy.pop("proof")
    sig_hex = proof_block.get("proofValue")

    if not sig_hex:
        return OfflineVerifyResponse(
            is_valid=False,
            status="CRYPTOGRAPHICALLY_INVALID",
            is_revoked=False,
            explanation="Proof block lacks proofValue signature hex.",
        )

    # 1. Verify Ed25519 Signature Statelessly
    pk_hex = issuer_public_key_hex or get_verify_key().encode().hex()
    try:
        vk = nacl.signing.VerifyKey(bytes.fromhex(pk_hex))
        canonical_bytes = json.dumps(doc_copy, sort_keys=True).encode("utf-8")
        vk.verify(canonical_bytes, bytes.fromhex(sig_hex))
    except Exception as e:
        return OfflineVerifyResponse(
            is_valid=False,
            status="CRYPTOGRAPHICALLY_INVALID",
            is_revoked=False,
            explanation=f"Cryptographic signature mismatch! Content was tampered or forged: {str(e)}",
        )

    # Extract claims
    subject = w3c_vc_json.get("credentialSubject", {})
    apaar_id = subject.get("apaar_id")
    roll = subject.get("institutional_student_id")
    name = subject.get("full_name")
    program = subject.get("program_name")
    issuer = w3c_vc_json.get("issuer", {})
    inst_name = issuer.get("name") if isinstance(issuer, dict) else str(issuer)

    # 2. Check W3C Bitstring Revocation List
    status_block = w3c_vc_json.get("credentialStatus", {})
    bit_index = status_block.get("statusListIndex")
    is_revoked = False

    if bit_index is not None and isinstance(bit_index, int):
        is_revoked = get_revocation_bit(bit_index)
        if is_revoked:
            return OfflineVerifyResponse(
                is_valid=False,
                status="REVOKED",
                apaar_id=apaar_id,
                institutional_student_id=roll,
                student_name=name,
                program_name=program,
                institution_name=inst_name,
                revocation_bit_index=bit_index,
                is_revoked=True,
                explanation=f"Degree certificate revoked by issuing university at W3C Bitstring Index {bit_index}.",
            )

    return OfflineVerifyResponse(
        is_valid=True,
        status="VALID",
        apaar_id=apaar_id,
        institutional_student_id=roll,
        student_name=name,
        program_name=program,
        institution_name=inst_name,
        revocation_bit_index=bit_index,
        is_revoked=False,
        explanation="Degree certificate is authentic, mathematically verified via Ed25519, and unrevoked in Bitstring Status List.",
    )
