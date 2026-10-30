import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ColumnMappingItem(BaseModel):
    target_field: Optional[str] = Field(None, description="Mapped canonical field in StudentEnrolment")
    confidence: float = Field(..., description="Mapping confidence score from 0.0 to 1.0")
    match_type: str = Field(..., description="EXACT, SYNONYM, FUZZY_JARO_WINKLER, or UNMAPPED")
    is_required: bool = Field(False, description="Whether this canonical field is required")


class PreviewMappingRequest(BaseModel):
    headers: Optional[List[str]] = Field(None, description="List of raw column headers from file/ERP")
    records: Optional[List[Dict[str, Any]]] = Field(None, description="Sample records from ERP or payload")


class PreviewMappingResponse(BaseModel):
    source_headers: List[str]
    mappings: Dict[str, ColumnMappingItem]
    mapped_canonical_fields: List[str]
    missing_required_fields: List[str]
    sample_preview: List[Dict[str, Any]]


class SandboxRowDiff(BaseModel):
    row_index: int
    institutional_student_id: str
    full_name: str
    apaar_id: Optional[str] = None
    provisional_token: Optional[str] = None
    seat_category: str
    delta_type: str = Field(
        ...,
        description="NEW_INSERT, FIELD_MODIFIED_DIFF, IDEMPOTENT_NO_CHANGE, or REJECTED_OR_FLAGGED"
    )
    field_diffs: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Map of changed fields: { field: { 'old': ..., 'new': ... } }"
    )
    validation_status: str
    flag_reasons: List[Dict[str, Any]] = Field(default_factory=list)


class SandboxDiffRequest(BaseModel):
    institution_id: uuid.UUID
    program_quota_id: uuid.UUID
    simulate_registry_downtime: bool = False
    column_mapping: Optional[Dict[str, str]] = None
    rows: List[Dict[str, Any]] = Field(..., description="Raw student records or mapped student rows")


class SandboxDiffResponse(BaseModel):
    institution_id: uuid.UUID
    program_quota_id: uuid.UUID
    total_rows: int
    new_insert_count: int
    field_modified_diff_count: int
    idempotent_no_change_count: int
    flagged_or_rejected_count: int
    simulated_quota_status: Dict[str, Any]
    rows: List[SandboxRowDiff]
    error_report_csv: str


class CommitBatchRequest(BaseModel):
    institution_id: uuid.UUID
    program_quota_id: uuid.UUID
    rows: List[Dict[str, Any]] = Field(..., description="Sandbox evaluated rows or canonical student dicts to commit")
    allow_flagged_with_warning: bool = Field(
        True,
        description="If True, commits flagged records as FLAGGED_VIOLATION for officer dispute review; if False, skips them"
    )


class CommitBatchResponse(BaseModel):
    status: str
    institution_id: uuid.UUID
    program_quota_id: uuid.UUID
    total_processed: int
    committed_new_inserts: int
    committed_updates: int
    skipped_idempotent: int
    flagged_committed: int
    audit_sequence_number: int
    audit_record_hash: str
    merkle_signature: Optional[str] = None
