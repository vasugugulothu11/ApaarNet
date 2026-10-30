/**
 * ApaarNet API Client & Typed SDK
 * Covers all 26 REST Endpoints for AICTE SIH26263 Platform
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // fallback to statusText
    }
    throw new Error(`API Error [${res.status}]: ${errorDetail}`);
  }
  return res.json();
}

// ==========================================
// 1. SYSTEM & ADMIN INTERFACES
// ==========================================
export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface ReadinessStatus {
  status: string;
  database: string;
  timestamp: string;
}

export interface ReseedDemoResponse {
  status: string;
  message: string;
  institutions_seeded: number;
  quotas_seeded: number;
  students_seeded: number;
  demonstration_cases: {
    case_a_supernumerary_quota_usp: Record<string, any>;
    case_b_ugc_dual_degree: Record<string, any>;
    case_c_illegal_duplicate: Record<string, any>;
    case_d_phonetic_evasion: Record<string, any>;
    case_e_ghost_ring: Record<string, any>;
  };
  timestamp: string;
}

// ==========================================
// 2. QUOTA LEDGER INTERFACES
// ==========================================
export interface QuotaLedgerResponse {
  program_quota_id: string;
  academic_year: string;
  program_name: string;
  course_code: string;
  delivery_mode: string;
  approved_intake: number;
  nri_5pct_internal_cap: number;
  fn_oci_ciwgc_15pct_supernumerary_cap: number;
  tfw_5pct_supernumerary_cap: number;
  pmsss_supernumerary_cap: number;
  lateral_entry_2nd_yr_cap: number;
  enrolled_general_base: number;
  enrolled_nri_internal: number;
  enrolled_fn_oci_ciwgc_supernumerary: number;
  enrolled_tfw_supernumerary: number;
  enrolled_pmsss_supernumerary: number;
  enrolled_lateral_entry: number;
  total_enrolled: number;
  total_permitted_ceiling: number;
  intake_headroom_remaining: number;
  is_over_capacity: boolean;
  excess_students: number;
  active_violations: string[];
}

export interface QuotaCompareResponse {
  program_quota_id?: string;
  academic_year?: string;
  program_name: string;
  course_code?: string;
  sanctioned_intake?: number;
  actual_enrolment?: number;
  naive_evaluation?: {
    naive_ceiling: number;
    naive_status: string;
    naive_excess: number;
    explanation: string;
  };
  apaarnet_evaluation?: {
    base_enrolled: number;
    supernumerary_carved_out: number;
    sanctioned_intake: number;
    total_permitted_ceiling: number;
    apaarnet_status: string;
    apaarnet_excess: number;
    explanation: string;
  };
  audit_delta_summary?: string;
  metrics?: {
    total_enrolled: number;
    sanctioned_approved_intake: number;
    lawful_supernumerary_allowance: number;
    total_lawful_capacity: number;
  };
  naive_flat_system?: {
    name: string;
    formula: string;
    apparent_excess_flagged: number;
    verdict: string;
    flaw: string;
  };
  apaarnet_quota_ledger?: {
    name: string;
    formula: string;
    actual_excess_flagged: number;
    verdict: string;
    violations_cited: any[];
    advantage: string;
  };
  impact_summary?: {
    false_positive_flags_eliminated: number;
    false_positive_reduction_percentage: number;
    aicte_compliance_accuracy: string;
  };
}

// ==========================================
// 3. INGESTION & SANDBOX INTERFACES
// ==========================================
export interface ColumnMappingItem {
  target_field: string | null;
  confidence: number;
  match_type: "EXACT" | "SYNONYM" | "FUZZY_JARO_WINKLER" | "UNMAPPED" | string;
  is_required: boolean;
}

export interface PreviewMappingResponse {
  source_headers: string[];
  mappings: Record<string, ColumnMappingItem>;
  mapped_canonical_fields: string[];
  missing_required_fields: string[];
  sample_preview: Record<string, any>[];
}

export interface SandboxRowDiff {
  row_index: number;
  institutional_student_id: string;
  full_name: string;
  apaar_id: string | null;
  provisional_token?: string | null;
  seat_category: string;
  delta_type:
    | "NEW_INSERT"
    | "FIELD_MODIFIED_DIFF"
    | "IDEMPOTENT_NO_CHANGE"
    | "REJECTED_OR_FLAGGED"
    | string;
  field_diffs: Record<string, { old: any; new: any }>;
  validation_status: string;
  flag_reasons: Array<{ code: string; message: string; severity?: string }>;
}

export interface SandboxDiffResponse {
  institution_id: string;
  program_quota_id: string;
  total_rows: number;
  new_insert_count: number;
  field_modified_diff_count: number;
  idempotent_no_change_count: number;
  flagged_or_rejected_count: number;
  simulated_quota_status: Record<string, any>;
  rows: SandboxRowDiff[];
  error_report_csv: string;
}

export interface CommitBatchResponse {
  status: string;
  institution_id: string;
  program_quota_id: string;
  total_processed: number;
  committed_new_inserts: number;
  committed_updates: number;
  skipped_idempotent: number;
  flagged_committed: number;
  audit_sequence_number: number;
  audit_record_hash: string;
  merkle_signature?: string | null;
}

// ==========================================
// 4. INTELLIGENCE & DISPUTES INTERFACES
// ==========================================
export interface EnrolmentReference {
  enrolment_id: string;
  institutional_student_id: string;
  institution_id: string;
  institution_name: string;
  state: string;
  program_name: string;
  course_code: string;
  delivery_mode: string;
  validation_status: string;
}

export interface ExactCollisionResult {
  apaar_id: string;
  student_name: string;
  verdict: "LAWFUL_UGC_DUAL_DEGREE" | "ILLEGAL_CONCURRENT_REGULAR" | string;
  is_lawful: boolean;
  delivery_modes: string[];
  enrolments: EnrolmentReference[];
  explanation: string;
  dispute_ticket_id?: string | null;
}

export interface PhoneticMatchResult {
  anchor_student: Record<string, any>;
  candidate_student: Record<string, any>;
  name_similarity: number;
  dob_match: boolean;
  parent_initials_match: boolean;
  pincode_match: boolean;
  is_twin_disambiguated: boolean;
  match_probability: number;
  verdict:
    | "HIGH_CONFIDENCE_DUPLICATE_EVASION"
    | "DISAMBIGUATED_GENUINE_TWINS"
    | "UNLIKELY_MATCH"
    | string;
  explanation: string;
  dispute_ticket_id?: string | null;
}

export interface CollisionsResponse {
  total_exact_collisions: number;
  lawful_ugc_dual_degrees: number;
  illegal_concurrent_regular: number;
  exact_collisions: ExactCollisionResult[];
  phonetic_matches: PhoneticMatchResult[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: "student" | "phone" | "bank" | "institution" | string;
  data: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface SyndicateRingSummary {
  ring_id: string;
  student_count: number;
  colleges_involved: string[];
  colleges_count: number;
  shared_identifiers: string[];
  dob_uniformity_pct: number;
  burst_window_minutes: number;
  risk_category: string;
  student_ids: string[];
}

export interface GhostRingGraphResponse {
  total_rings_detected: number;
  total_students_in_rings: number;
  rings: SyndicateRingSummary[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ShapFeatureImpact {
  feature_name: string;
  feature_value: number;
  shap_value: number;
  contribution_pts: number;
  interpretation: string;
}

export interface InstitutionalRiskProfile {
  rank: number;
  institution_id: string;
  aicte_permanent_id: string;
  name: string;
  state: string;
  district: string;
  risk_score: number; // 0 to 100
  is_anomaly: boolean;
  raw_anomaly_score: number;
  metrics: Record<string, number>;
  shap_waterfall: ShapFeatureImpact[];
  plain_english_summary: string;
}

export interface RiskRankingsResponse {
  total_institutions: number;
  anomalous_institutions_count: number;
  rankings: InstitutionalRiskProfile[];
}

export interface DisputeTicketResponse {
  id: string;
  student_apaar_or_token: string;
  college_a_id: string;
  college_a_name: string;
  college_b_id: string;
  college_b_name: string;
  collision_type: string;
  status: "OPEN_TRI_PARTY" | "RESOLVED_VALID" | "CONFIRMED_DUPLICATE" | string;
  evidence_log: Record<string, any>;
  officer_decision_reason?: string | null;
  created_at: string;
}

// ==========================================
// 5. DPDP VERIFICATION & CONSENT INTERFACES
// ==========================================
export interface ConsentRequestPayload {
  apaar_id: string;
  requester_name: string;
  requester_role: "EMPLOYER" | "AICTE" | "UNIVERSITY";
  requested_fields: string[];
  disclosure_mode: "ZERO_EXPOSURE_PREDICATE" | "SD_JWT_SELECTIVE";
  predicate_query?: string;
}

export interface ConsentRequestResponse {
  id: string;
  apaar_id: string;
  requester_name: string;
  requester_role: string;
  requested_fields: string[];
  disclosure_mode: string;
  status: string;
  created_at: string;
}

export interface ConsentApprovalResponse {
  consent_id: string;
  status: string;
  disclosure_mode: string;
  predicate_assertion?: {
    apaar_id: string;
    predicate: string;
    result: boolean;
    issuer: string;
    verified_at: string;
    ed25519_signature: string;
    public_key: string;
  };
  sd_jwt?: {
    issuer: string;
    subject: string;
    issued_at: string;
    disclosed_claims: Record<string, any>;
    blinded_claims: string[];
    ed25519_signature: string;
    public_key: string;
    disclosures: string[];
  };
  audit_sequence_number: number;
  audit_record_hash: string;
}

export interface StudentConsentWalletItem {
  consent_id: string;
  requester_name: string;
  requester_role: string;
  disclosure_mode: string;
  requested_fields: string[];
  status: string;
  created_at: string;
  decided_at: string | null;
}

// ==========================================
// 6. W3C DEGREE STUDIO INTERFACES
// ==========================================
export interface DegreeIssueResponse {
  credential_id: string;
  revocation_bit_index: number;
  issuer_public_key_hex: string;
  w3c_vc_json: any;
  qr_code_payload: string;
}

export interface DegreeRevocationResponse {
  bit_index: number;
  status: string;
  reason: string;
  timestamp: string;
}

export interface OfflineVerifyResponse {
  is_valid: boolean;
  status: string;
  is_revoked: boolean;
  tampered_fields: string[];
  credential_subject: Record<string, any>;
  explanation: string;
}

// ==========================================
// 7. REPORTS & MERKLE AUDIT INTERFACES
// ==========================================
export interface StateIntakeSummary {
  state: string;
  institutions_count: number;
  approved_intake: number;
  total_enrolled: number;
  compliance_rate_pct: number;
}

export interface CategorySeatDistribution {
  general_base: number;
  nri_internal: number;
  fn_oci_ciwgc_supernumerary: number;
  tfw_supernumerary: number;
  pmsss_supernumerary: number;
  lateral_entry: number;
}

export interface NationalOverviewResponse {
  total_institutions: number;
  total_students_enrolled: number;
  total_approved_intake: number;
  verified_apaar_count: number;
  provisional_token_count: number;
  verified_apaar_coverage_pct: number;
  active_flagged_violations: number;
  open_tri_party_disputes: number;
  detected_ghost_rings: number;
  state_breakdown: StateIntakeSummary[];
  seat_distribution: CategorySeatDistribution;
  timestamp: string;
}

export interface InstitutionPortalItem {
  id: string;
  aicte_permanent_id: string;
  aishe_code: string;
  name: string;
  state: string;
  district: string;
  institution_type: string;
  official_email_domain: string;
  compliance_risk_score: number;
  enrolled_students_count: number;
  program_quotas: Array<{
    id: string;
    academic_year: string;
    program_name: string;
    course_code: string;
    delivery_mode: string;
    approved_intake: number;
    nri_5pct_internal_cap: number;
    fn_oci_ciwgc_15pct_supernumerary_cap: number;
  }>;
}

export interface AuditLedgerEntry {
  sequence_number: number;
  actor_role: string;
  action_type: string;
  entity_id: string;
  payload_json: any;
  prev_hash: string;
  record_hash: string;
  checkpoint_signature: string | null;
  created_at: string;
}

export interface AuditLedgerResponse {
  total_entries: number;
  chain_integrity_valid: boolean;
  genesis_hash: string | null;
  latest_record_hash: string | null;
  entries: AuditLedgerEntry[];
}

export interface TamperSimulationResponse {
  status: string;
  original_chain_valid: boolean;
  tampered_seq_id: number;
  original_payload: any;
  tampered_payload: any;
  original_record_hash: string;
  tampered_record_hash: string;
  local_hash_mismatch_detected: boolean;
  chain_link_broken_detected: boolean;
  ed25519_checkpoint_signature_rejected: boolean;
  explanation: string;
}

// ==========================================
// 8. API CLIENT FUNCTION EXPORTS (ALL 26 ROUTES)
// ==========================================

export const api = {
  // --- System & Admin ---
  getHealth: () => request<HealthStatus>("/healthz"),
  getReady: () => request<ReadinessStatus>("/readyz"),
  reseedDemo: () => request<ReseedDemoResponse>("/api/v1/admin/reseed-demo", { method: "POST" }),

  // --- Quota Ledger ---
  getQuotaStatus: (programQuotaId: string) =>
    request<QuotaLedgerResponse>(`/api/v1/quota/status/${programQuotaId}`),
  getQuotaCompare: (programQuotaId: string) =>
    request<QuotaCompareResponse>(`/api/v1/quota/compare/${programQuotaId}`),

  // --- Ingestion & Sandbox ---
  previewMapping: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${BASE_URL}/api/v1/ingest/preview-mapping`, {
      method: "POST",
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error(`Mapping error: ${res.statusText}`);
      return res.json() as Promise<PreviewMappingResponse>;
    });
  },
  previewMappingJson: (sampleRows: Record<string, any>[]) =>
    request<PreviewMappingResponse>("/api/v1/ingest/preview-mapping-json", {
      method: "POST",
      body: JSON.stringify({
        records: sampleRows,
        headers: sampleRows.length > 0 ? Object.keys(sampleRows[0]) : [],
      }),
    }),
  sandboxDiff: (payload: {
    institution_id: string;
    program_quota_id: string;
    simulate_registry_downtime?: boolean;
    rows: Record<string, any>[];
  }) =>
    request<SandboxDiffResponse>("/api/v1/ingest/sandbox-diff", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  commitBatch: (payload: {
    institution_id: string;
    program_quota_id: string;
    rows: Record<string, any>[];
  }) =>
    request<CommitBatchResponse>("/api/v1/ingest/commit-batch", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // --- AI Intelligence & Disputes ---
  getCollisions: () => request<CollisionsResponse>("/api/v1/intelligence/collisions"),
  getDisputes: () => request<DisputeTicketResponse[]>("/api/v1/intelligence/disputes"),
  resolveDispute: (
    ticketId: string,
    decision: "RESOLVED_VALID" | "CONFIRMED_DUPLICATE" | string,
    officer_decision_reason: string,
    additional_evidence?: Record<string, any>,
    retained_institution_id?: string
  ) =>
    request<DisputeTicketResponse>(`/api/v1/intelligence/disputes/${ticketId}/resolve`, {
      method: "POST",
      body: JSON.stringify({
        decision,
        officer_decision_reason,
        additional_evidence,
        retained_institution_id,
      }),
    }),
  getGhostRings: () => request<GhostRingGraphResponse>("/api/v1/intelligence/ghost-rings"),
  getRiskRankings: () => request<RiskRankingsResponse>("/api/v1/intelligence/risk-rankings"),

  // --- DPDP Verification & Consent ---
  requestVerification: (payload: ConsentRequestPayload) =>
    request<ConsentRequestResponse>("/api/v1/verify/request", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  approveConsent: (
    consentId: string,
    payload: {
      passkey_or_otp_code?: string;
      disclosure_mode: "ZERO_EXPOSURE_PREDICATE" | "SD_JWT_SELECTIVE";
      approved_attributes?: string[];
    }
  ) =>
    request<ConsentApprovalResponse>(`/api/v1/verify/consent/${consentId}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getStudentConsentRequests: (apaarId: string) =>
    request<StudentConsentWalletItem[]>(`/api/v1/verify/student/${apaarId}/requests`),

  // --- W3C Degree Studio & Offline QR ---
  issueDegree: (
    studentEnrolmentId: string,
    metadata: {
      graduation_year: number;
      degree_level?: string;
      cgpa?: number;
      division?: string;
    }
  ) =>
    request<DegreeIssueResponse>(`/api/v1/degrees/issue/${studentEnrolmentId}`, {
      method: "POST",
      body: JSON.stringify(metadata),
    }),
  revokeDegree: (bitIndex: number, reason: string) =>
    request<DegreeRevocationResponse>(`/api/v1/degrees/revoke/${bitIndex}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  verifyOfflineDegree: (payload: {
    w3c_vc_json: any;
    issuer_public_key_hex?: string;
  }) =>
    request<OfflineVerifyResponse>("/api/v1/degrees/verify-offline", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // --- Reports & Merkle Audit ---
  getNationalOverview: () => request<NationalOverviewResponse>("/api/v1/reports/national-overview"),
  getInstitutions: () => request<InstitutionPortalItem[]>("/api/v1/reports/institutions"),
  getExportUrl: (reportType: string, format: "json" | "csv" = "csv") =>
    `${BASE_URL}/api/v1/reports/export/${reportType}?format=${format}`,
  getExportData: (reportType: string) =>
    request<any>(`/api/v1/reports/export/${reportType}?format=json`),
  getAuditLedger: (limit: number = 50) =>
    request<AuditLedgerResponse>(`/api/v1/audit/ledger?limit=${limit}`),
  simulateTamper: () =>
    request<TamperSimulationResponse>("/api/v1/audit/simulate-tamper", {
      method: "POST",
    }),
};
