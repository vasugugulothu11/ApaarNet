import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class StateIntakeSummary(BaseModel):
    state: str
    institutions_count: int
    approved_intake: int
    total_enrolled: int
    compliance_rate_pct: float


class CategorySeatDistribution(BaseModel):
    general_base: int
    nri_internal: int
    fn_oci_ciwgc_supernumerary: int
    tfw_supernumerary: int
    pmsss_supernumerary: int
    lateral_entry: int


class NationalOverviewResponse(BaseModel):
    total_institutions: int
    total_students_enrolled: int
    total_approved_intake: int
    verified_apaar_count: int
    provisional_token_count: int
    verified_apaar_coverage_pct: float
    active_flagged_violations: int
    open_tri_party_disputes: int
    detected_ghost_rings: int
    state_breakdown: List[StateIntakeSummary]
    seat_distribution: CategorySeatDistribution
    timestamp: str


class InstitutionPortalItem(BaseModel):
    id: uuid.UUID
    aicte_permanent_id: str
    aishe_code: str
    name: str
    state: str
    district: str
    institution_type: str
    official_email_domain: str
    compliance_risk_score: float
    enrolled_students_count: int
    program_quotas: List[Dict[str, Any]]


class AuditLedgerEntry(BaseModel):
    sequence_number: int
    actor_role: str
    action_type: str
    entity_id: str
    payload_json: Dict[str, Any]
    prev_hash: Optional[str]
    record_hash: str
    checkpoint_signature: Optional[str]
    created_at: str


class AuditLedgerResponse(BaseModel):
    total_entries: int
    chain_integrity_valid: bool
    genesis_hash: Optional[str]
    latest_record_hash: Optional[str]
    entries: List[AuditLedgerEntry]
