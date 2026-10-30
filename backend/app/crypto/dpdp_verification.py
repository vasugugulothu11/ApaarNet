"""
DPDP Act 2023 Verification & Selective Disclosure Cryptographic Gateway.

Implements:
1. Zero-Exposure Predicate Mode: Ed25519-signed boolean assertion proving enrollment
   in an AICTE-approved program without disclosing raw personal credentials or category.
2. SD-JWT Selective Disclosure (IETF-style): Salted SHA-256 disclosures revealing only
   student-approved attributes while keeping unapproved fields mathematically masked.
"""

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import nacl.signing

from app.config import settings
from app.crypto.merkle_audit import get_signing_key, get_verify_key, sign_checkpoint
from app.models.enums import ValidationStatus
from app.models.student import StudentEnrolment
from app.schemas.dpdp import PredicateAssertion, SdJwtPayload


def generate_predicate_assertion(
    student: StudentEnrolment,
    predicate: str = "Verified Enrolment in AICTE-Approved Program",
    private_key_hex: Optional[str] = None,
) -> PredicateAssertion:
    """
    Zero-Exposure Predicate Assertion:
    Evaluates whether the student has valid accepted enrollment and returns ONLY an
    Ed25519-signed boolean claim. Discloses zero raw personal data.
    """
    sk = get_signing_key(private_key_hex)
    vk = sk.verify_key
    public_key_hex = vk.encode().hex()

    is_accepted = (student.validation_status == ValidationStatus.ACCEPTED.value)
    now_iso = datetime.now(timezone.utc).isoformat()
    student_id = student.apaar_id or student.provisional_token or "UNKNOWN_ID"

    claim_dict = {
        "apaar_id": student_id,
        "predicate": predicate,
        "result": is_accepted,
        "issuer": "AICTE-ApaarNet-DPDP-Gateway",
        "verified_at": now_iso,
    }

    canonical_bytes = json.dumps(claim_dict, sort_keys=True).encode("utf-8")
    signature = sk.sign(canonical_bytes).signature.hex()

    return PredicateAssertion(
        apaar_id=student_id,
        predicate=predicate,
        result=is_accepted,
        issuer="AICTE-ApaarNet-DPDP-Gateway",
        public_key=public_key_hex,
        ed25519_signature=signature,
        verified_at=now_iso,
    )


def generate_sd_jwt_payload(
    student: StudentEnrolment,
    approved_fields: List[str],
    all_attributes: Dict[str, Any],
    private_key_hex: Optional[str] = None,
) -> SdJwtPayload:
    """
    IETF-style Selective Disclosure JWT (SD-JWT):
    Each attribute is salted and hashed into the signed _sd array.
    Only disclosures for student-approved attributes are released.
    """
    sk = get_signing_key(private_key_hex)
    vk = sk.verify_key
    public_key_hex = vk.encode().hex()

    header = {"alg": "EdDSA", "typ": "sd+jwt"}

    disclosures_map: Dict[str, str] = {}  # field -> disclosure_str
    hash_to_field: Dict[str, str] = {}
    sd_hashes: List[str] = []

    for field_name, field_val in all_attributes.items():
        salt = os.urandom(16).hex()
        # IETF SD-JWT disclosure format: [salt, claim_name, claim_value]
        disclosure_obj = [salt, field_name, field_val]
        disclosure_json = json.dumps(disclosure_obj, sort_keys=True)
        disclosure_b64 = base64.urlsafe_b64encode(disclosure_json.encode("utf-8")).decode("utf-8").rstrip("=")

        d_hash = hashlib.sha256(disclosure_b64.encode("utf-8")).hexdigest()

        disclosures_map[field_name] = disclosure_b64
        hash_to_field[d_hash] = field_name
        sd_hashes.append(d_hash)

    sd_hashes.sort()

    student_id = student.apaar_id or student.provisional_token or "UNKNOWN_ID"
    now_ts = int(datetime.now(timezone.utc).timestamp())

    jwt_payload = {
        "iss": "https://apaarnet.gov.in/dpdp-gateway",
        "sub": student_id,
        "iat": now_ts,
        "exp": now_ts + 86400 * 30,  # 30 days
        "_sd": sd_hashes,
    }

    # Sign JWT payload
    canonical_payload_bytes = json.dumps(jwt_payload, sort_keys=True).encode("utf-8")
    sig_hex = sk.sign(canonical_payload_bytes).signature.hex()

    # Filter disclosures to ONLY approved fields
    released_disclosures = []
    disclosed_attributes = {}
    undisclosed_hashes = []

    approved_set = set(approved_fields)
    for d_hash in sd_hashes:
        fname = hash_to_field[d_hash]
        if fname in approved_set:
            released_disclosures.append(disclosures_map[fname])
            disclosed_attributes[fname] = all_attributes[fname]
        else:
            undisclosed_hashes.append(d_hash)

    return SdJwtPayload(
        header=header,
        payload=jwt_payload,
        disclosures=released_disclosures,
        disclosed_attributes=disclosed_attributes,
        undisclosed_attribute_hashes=undisclosed_hashes,
        ed25519_signature=sig_hex,
        issuer_public_key=public_key_hex,
    )


def verify_sd_jwt_disclosures(
    sd_jwt: SdJwtPayload,
    public_key_hex: Optional[str] = None,
) -> Tuple[bool, Dict[str, Any], str]:
    """
    Statelessly verifies an SD-JWT payload:
    1. Verifies the Ed25519 signature on payload.
    2. Hashes each presented disclosure and asserts presence in payload['_sd'].
    3. Reconstructs revealed attributes.
    """
    try:
        pk_hex = public_key_hex or sd_jwt.issuer_public_key
        vk = nacl.signing.VerifyKey(bytes.fromhex(pk_hex))

        canonical_payload_bytes = json.dumps(sd_jwt.payload, sort_keys=True).encode("utf-8")
        vk.verify(canonical_payload_bytes, bytes.fromhex(sd_jwt.ed25519_signature))
    except Exception as e:
        return False, {}, f"Cryptographic signature check failed: {str(e)}"

    sd_set = set(sd_jwt.payload.get("_sd", []))
    revealed_attributes = {}

    for disc_str in sd_jwt.disclosures:
        computed_hash = hashlib.sha256(disc_str.encode("utf-8")).hexdigest()
        if computed_hash not in sd_set:
            return False, {}, f"Disclosure hash '{computed_hash}' does not match signed _sd digest."

        # Decode disclosure
        # Add padding back if necessary
        padded = disc_str + "=" * ((4 - len(disc_str) % 4) % 4)
        try:
            decoded_json = base64.urlsafe_b64decode(padded).decode("utf-8")
            disc_obj = json.loads(decoded_json)
            # disc_obj is [salt, field_name, field_val]
            if len(disc_obj) == 3:
                revealed_attributes[disc_obj[1]] = disc_obj[2]
        except Exception as e:
            return False, {}, f"Failed to decode disclosure string: {str(e)}"

    return True, revealed_attributes, "SD-JWT successfully verified with authentic selective disclosure."
