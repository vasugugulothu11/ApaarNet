import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class IssueDegreeRequest(BaseModel):
    graduation_year: int = Field(2026, description="Graduation year")
    degree_level: str = Field("Bachelor of Technology", description="Degree title / level")
    specialization: Optional[str] = Field(None, description="Major / Specialization")
    cgpa: Optional[float] = Field(8.75, description="Final CGPA or Grade")


class W3CDegreeCredentialResponse(BaseModel):
    credential_id: str
    student_enrolment_id: uuid.UUID
    apaar_id: str
    institutional_student_id: str
    full_name: str
    institution_name: str
    aicte_permanent_id: str
    aishe_code: str
    program_name: str
    graduation_year: int
    revocation_bit_index: int
    w3c_vc_json: Dict[str, Any]
    qr_payload_string: str
    issuer_public_key_hex: str
    issued_at: str


class RevocationRequest(BaseModel):
    reason: str = Field("Degree revoked by University Senate due to academic malpractice", description="Revocation justification")


class RevocationResponse(BaseModel):
    status: str
    bit_index: int
    revocation_timestamp: str
    status_list_credential: str
    explanation: str


class OfflineVerifyRequest(BaseModel):
    w3c_vc_json: Dict[str, Any]
    issuer_public_key_hex: Optional[str] = None


class OfflineVerifyResponse(BaseModel):
    is_valid: bool
    status: str  # VALID, CRYPTOGRAPHICALLY_INVALID, or REVOKED
    apaar_id: Optional[str] = None
    institutional_student_id: Optional[str] = None
    student_name: Optional[str] = None
    program_name: Optional[str] = None
    institution_name: Optional[str] = None
    revocation_bit_index: Optional[int] = None
    is_revoked: bool
    explanation: str
