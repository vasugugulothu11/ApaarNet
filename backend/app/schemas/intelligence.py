import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class EnrolmentReference(BaseModel):
    enrolment_id: uuid.UUID
    institutional_student_id: str
    institution_id: uuid.UUID
    institution_name: str
    state: str
    program_name: str
    course_code: str
    delivery_mode: str
    validation_status: str


class ExactCollisionResult(BaseModel):
    apaar_id: str
    student_name: str
    verdict: str  # LAWFUL_UGC_DUAL_DEGREE or ILLEGAL_CONCURRENT_REGULAR
    is_lawful: bool
    delivery_modes: List[str]
    enrolments: List[EnrolmentReference]
    explanation: str
    dispute_ticket_id: Optional[uuid.UUID] = None


class PhoneticMatchResult(BaseModel):
    anchor_student: Dict[str, Any]
    candidate_student: Dict[str, Any]
    name_similarity: float
    dob_match: bool
    parent_initials_match: bool
    pincode_match: bool
    is_twin_disambiguated: bool
    match_probability: float
    verdict: str  # HIGH_CONFIDENCE_DUPLICATE_EVASION, DISAMBIGUATED_GENUINE_TWINS, or UNLIKELY_MATCH
    explanation: str
    dispute_ticket_id: Optional[uuid.UUID] = None


class CollisionsResponse(BaseModel):
    total_exact_collisions: int
    lawful_ugc_dual_degrees: int
    illegal_concurrent_regular: int
    exact_collisions: List[ExactCollisionResult]
    phonetic_matches: List[PhoneticMatchResult]


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "student", "phone", "bank", "institution"
    data: Dict[str, Any]


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str


class SyndicateRingSummary(BaseModel):
    ring_id: str
    student_count: int
    colleges_involved: List[str]
    colleges_count: int
    shared_identifiers: List[str]
    dob_uniformity_pct: float
    burst_window_minutes: float
    risk_category: str
    student_ids: List[str]


class GhostRingGraphResponse(BaseModel):
    total_rings_detected: int
    total_students_in_rings: int
    rings: List[SyndicateRingSummary]
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class ShapFeatureImpact(BaseModel):
    feature_name: str
    feature_value: float
    shap_value: float
    contribution_pts: float
    interpretation: str


class InstitutionalRiskProfile(BaseModel):
    rank: int
    institution_id: uuid.UUID
    aicte_permanent_id: str
    name: str
    state: str
    district: str
    risk_score: float  # 0 to 100
    is_anomaly: bool
    raw_anomaly_score: float
    metrics: Dict[str, float]
    shap_waterfall: List[ShapFeatureImpact]
    plain_english_summary: str


class RiskRankingsResponse(BaseModel):
    total_institutions: int
    anomalous_institutions_count: int
    rankings: List[InstitutionalRiskProfile]


class DisputeResolutionRequest(BaseModel):
    decision: str = Field(..., description="RESOLVED_VALID or CONFIRMED_DUPLICATE")
    officer_decision_reason: str = Field(..., min_length=5, description="Official adjudication rationale")
    additional_evidence: Optional[Dict[str, Any]] = Field(default_factory=dict)
    retained_institution_id: Optional[uuid.UUID] = None


class DisputeTicketResponse(BaseModel):
    id: uuid.UUID
    student_apaar_or_token: str
    college_a_id: uuid.UUID
    college_a_name: str
    college_b_id: uuid.UUID
    college_b_name: str
    collision_type: str
    status: str
    evidence_log: Dict[str, Any]
    officer_decision_reason: Optional[str] = None
    created_at: datetime
