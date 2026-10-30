import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VerificationRequestCreate(BaseModel):
    apaar_id: str = Field(..., description="12-digit APAAR ID or provisional token")
    requester_name: str = Field(..., description="Name of organization requesting verification (e.g. TCS, Infosys)")
    requester_role: str = Field("EMPLOYER", description="EMPLOYER, AICTE, or UNIVERSITY")
    requested_fields: List[str] = Field(
        default_factory=lambda: ["full_name", "program_name", "institution_name", "validation_status"],
        description="Attributes requested for selective disclosure",
    )
    disclosure_mode: str = Field("ZERO_EXPOSURE_PREDICATE", description="ZERO_EXPOSURE_PREDICATE or SD_JWT_SELECTIVE")
    predicate_query: Optional[str] = Field(
        "Verified Enrolment in AICTE-Approved Program",
        description="Boolean predicate assertion for zero-exposure verification"
    )


class ConsentApprovalRequest(BaseModel):
    passkey_or_otp_code: str = Field("WEBAUTHN-PASSKEY-OK", description="Passkey assertion or OTP")
    approved_fields: Optional[List[str]] = Field(None, description="Subset of requested fields student approves")
    disclosure_mode: Optional[str] = Field(None, description="ZERO_EXPOSURE_PREDICATE or SD_JWT_SELECTIVE")


class PredicateAssertion(BaseModel):
    apaar_id: str
    predicate: str
    result: bool
    issuer: str
    public_key: str
    ed25519_signature: str
    verified_at: str


class SdJwtDisclosure(BaseModel):
    salt: str
    field_name: str
    field_value: Any
    disclosure_string: str
    disclosure_hash: str


class SdJwtPayload(BaseModel):
    header: Dict[str, str]
    payload: Dict[str, Any]
    disclosures: List[str]
    disclosed_attributes: Dict[str, Any]
    undisclosed_attribute_hashes: List[str]
    ed25519_signature: str
    issuer_public_key: str


class VerificationResultResponse(BaseModel):
    consent_id: uuid.UUID
    apaar_id: str
    student_name: str
    requester_name: str
    requester_role: str
    disclosure_mode: str
    status: str
    predicate_assertion: Optional[PredicateAssertion] = None
    sd_jwt: Optional[SdJwtPayload] = None
    audit_sequence_number: int
    audit_record_hash: str


class ConsentWalletItem(BaseModel):
    id: uuid.UUID
    apaar_id: str
    requester_name: str
    requester_role: str
    requested_fields: List[str]
    disclosure_mode: str
    passkey_or_otp_verified: bool
    status: str
    created_at: datetime
    expires_at: datetime
