"use client";

import React, { useEffect, useState } from "react";
import {
  Lock,
  ShieldCheck,
  KeyRound,
  EyeOff,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  Copy,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  RefreshCw,
} from "lucide-react";
import {
  api,
  ConsentRequestResponse,
  ConsentApprovalResponse,
  StudentConsentWalletItem,
} from "@/lib/api";

const PRESET_STUDENTS = [
  { name: "Aarav Sharma", apaar_id: "482910384715", program: "B.Tech Mechanical (Apex Tech)" },
  { name: "Priya Nair", apaar_id: "739201846297", program: "B.Tech CSE (PSG Tech)" },
  { name: "Mohammed Rayyan Khan", apaar_id: "PROV-APN-9001", program: "Provisional Token (Evasion Test)" },
];

const ALL_ATTRIBUTES = [
  { id: "full_name", label: "Candidate Full Name", sensitive: false },
  { id: "program_name", label: "Program Name", sensitive: false },
  { id: "institution_name", label: "Institution Name", sensitive: false },
  { id: "institutional_student_id", label: "Institutional Roll Number", sensitive: false },
  { id: "validation_status", label: "AICTE Validation Status", sensitive: false },
  { id: "seat_category", label: "Quota / Social Category", sensitive: true },
  { id: "dob", label: "Date of Birth", sensitive: true },
];

export default function ConsentWalletPage() {
  // Panel 1: Request Simulator State
  const [selectedStudentApaar, setSelectedStudentApaar] = useState("482910384715");
  const [requesterRole, setRequesterRole] = useState<"EMPLOYER" | "UNIVERSITY" | "AICTE">("EMPLOYER");
  const [requesterName, setRequesterName] = useState("Tata Consultancy Services (HR Recruitment)");
  const [disclosureMode, setDisclosureMode] = useState<"ZERO_EXPOSURE_PREDICATE" | "SD_JWT_SELECTIVE">("ZERO_EXPOSURE_PREDICATE");
  const [requestedAttributes, setRequestedAttributes] = useState<string[]>([
    "full_name",
    "program_name",
    "institution_name",
    "validation_status",
  ]);
  const [predicateQuery, setPredicateQuery] = useState("Verified Enrolment in AICTE-Approved Program");
  const [dispatchingRequest, setDispatchingRequest] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<ConsentRequestResponse | null>(null);

  // Panel 2: Consent Wallet Queue State
  const [consentQueue, setConsentQueue] = useState<StudentConsentWalletItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [selectedConsentId, setSelectedConsentId] = useState<string | null>(null);
  const [approvedFields, setApprovedFields] = useState<string[]>([
    "full_name",
    "program_name",
    "institution_name",
    "validation_status",
  ]);
  const [approving, setApproving] = useState(false);
  const [approvalMethod, setApprovalMethod] = useState<"WEBAUTHN" | "OTP">("WEBAUTHN");

  // Panel 3: Cryptographic Proof State
  const [proofResult, setProofResult] = useState<ConsentApprovalResponse | null>(null);

  // Fetch student consent requests whenever student changes
  useEffect(() => {
    loadStudentRequests(selectedStudentApaar);
  }, [selectedStudentApaar]);

  const loadStudentRequests = async (apaarId: string) => {
    if (!apaarId) return;
    setLoadingQueue(true);
    try {
      const items = await api.getStudentConsentRequests(apaarId);
      setConsentQueue(items);
      // Auto-select first pending request if any
      const pending = items.find((i) => i.status === "PENDING_STUDENT_APPROVAL");
      if (pending) {
        setSelectedConsentId(pending.consent_id);
        setApprovedFields(pending.requested_fields || []);
      } else if (items.length > 0) {
        setSelectedConsentId(items[0].consent_id);
      } else {
        setSelectedConsentId(null);
      }
    } catch (err) {
      console.error("Failed to load consent requests:", err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleRoleChange = (role: "EMPLOYER" | "UNIVERSITY" | "AICTE") => {
    setRequesterRole(role);
    if (role === "EMPLOYER") {
      setRequesterName("Tata Consultancy Services (HR Recruitment)");
    } else if (role === "UNIVERSITY") {
      setRequesterName("IIT Bombay (Postgraduate Admissions Office)");
    } else {
      setRequesterName("AICTE National Scholarship Vigilance Cell");
    }
  };

  const toggleRequestedAttribute = (id: string) => {
    if (requestedAttributes.includes(id)) {
      setRequestedAttributes(requestedAttributes.filter((a) => a !== id));
    } else {
      setRequestedAttributes([...requestedAttributes, id]);
    }
  };

  const toggleApprovedField = (id: string) => {
    if (approvedFields.includes(id)) {
      setApprovedFields(approvedFields.filter((f) => f !== id));
    } else {
      setApprovedFields([...approvedFields, id]);
    }
  };

  const handleDispatchRequest = async () => {
    setDispatchingRequest(true);
    setDispatchedSuccess(null);
    try {
      const res = await api.requestVerification({
        apaar_id: selectedStudentApaar,
        requester_name: requesterName,
        requester_role: requesterRole,
        requested_fields: requestedAttributes,
        disclosure_mode: disclosureMode,
        predicate_query: predicateQuery,
      });
      setDispatchedSuccess(res);
      // Refresh wallet queue
      await loadStudentRequests(selectedStudentApaar);
      setSelectedConsentId(res.id);
    } catch (err: any) {
      alert(`Failed to dispatch request: ${err.message}`);
    } finally {
      setDispatchingRequest(false);
    }
  };

  const handleApproveConsent = async (consentId: string) => {
    setApproving(true);
    setProofResult(null);
    try {
      const passkeyOrOtp =
        approvalMethod === "WEBAUTHN"
          ? "WEBAUTHN-PASSKEY-ASSERTION-OK"
          : "DIGILOCKER-OTP-778899";

      // find the request in queue to determine mode
      const req = consentQueue.find((c) => c.consent_id === consentId);
      const mode = (req?.disclosure_mode as "ZERO_EXPOSURE_PREDICATE" | "SD_JWT_SELECTIVE") || disclosureMode;

      const res = await api.approveConsent(consentId, {
        passkey_or_otp_code: passkeyOrOtp,
        disclosure_mode: mode,
        approved_attributes: approvedFields,
      });

      setProofResult(res);
      // Refresh wallet queue
      await loadStudentRequests(selectedStudentApaar);
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-medium text-[#003366]">
            DPDP Privacy Gateway
          </span>
          <span className="text-xs text-slate-600 font-mono">
            Zero-Exposure Predicates & SD-JWT Selective Disclosure
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#003366]">
          Student Consent Wallet & Verification Gateway
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Allows employers and universities to request cryptographic verification without over-exposing
          personal identifiable information. Students retain sovereign control via biometric passkey approvals.
        </p>
      </div>

      {/* Preset Student Selector Strip */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#003366] font-medium">
          <Users className="h-4 w-4 text-slate-600" />
          <span>Active Student Wallet Persona:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_STUDENTS.map((stu) => (
            <button
              key={stu.apaar_id}
              onClick={() => setSelectedStudentApaar(stu.apaar_id)}
              className={`px-3 py-1.5 rounded-lg border font-mono transition-all ${
                selectedStudentApaar === stu.apaar_id
                  ? "border-[#003366] bg-[#052659] text-[#003366] font-semibold"
                  : "border-slate-300 bg-white text-slate-600 hover:border-[#003366] hover:text-[#003366]"
              }`}
            >
              {stu.name} ({stu.apaar_id})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ============================================================== */}
        {/* PANEL 1: STAKEHOLDER VERIFICATION REQUEST SIMULATOR           */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-[#003366] text-base">
                <Briefcase className="h-5 w-5 text-cyan-400" />
                Stakeholder Verification Request Simulator
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Simulate an employer, university, or regulator requesting student credential verification.
              </p>
            </div>

            {/* Requester Role Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Requester Stakeholder Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "EMPLOYER", label: "Employer (HR)", icon: Briefcase },
                  { id: "UNIVERSITY", label: "University (PG)", icon: GraduationCap },
                  { id: "AICTE", label: "AICTE Audit", icon: Building2 },
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = requesterRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleChange(r.id as any)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                        isSelected
                          ? "border-[#003366] bg-blue-50 text-[#003366] font-bold shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px]">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Requester Name Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Requester Organization Name
              </label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white text-slate-800 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Target APAAR ID */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Student APAAR ID or Provisional Token
              </label>
              <input
                type="text"
                value={selectedStudentApaar}
                onChange={(e) => setSelectedStudentApaar(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white text-slate-800 px-3.5 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Disclosure Mode Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                DPDP Cryptographic Disclosure Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDisclosureMode("ZERO_EXPOSURE_PREDICATE")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    disclosureMode === "ZERO_EXPOSURE_PREDICATE"
                      ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <EyeOff className="h-4 w-4 text-emerald-400" />
                    <span>Zero-Exposure Predicate</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-normal mt-1 leading-tight">
                    Signed boolean proof only. Zero personal data disclosed.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDisclosureMode("SD_JWT_SELECTIVE")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    disclosureMode === "SD_JWT_SELECTIVE"
                      ? "border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <KeyRound className="h-4 w-4 text-cyan-400" />
                    <span>IETF SD-JWT Selective</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-normal mt-1 leading-tight">
                    Disclose approved fields; blind sensitive fields in SHA-256 digests.
                  </p>
                </button>
              </div>
            </div>

            {/* Attribute Checkboxes if SD-JWT */}
            {disclosureMode === "SD_JWT_SELECTIVE" && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="text-[11px] font-bold text-slate-700">
                  Select Requested Attributes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {ALL_ATTRIBUTES.map((attr) => {
                    const checked = requestedAttributes.includes(attr.id);
                    return (
                      <label
                        key={attr.id}
                        className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRequestedAttribute(attr.id)}
                          className="accent-cyan-500 rounded"
                        />
                        <span className={attr.sensitive ? "text-amber-300" : ""}>
                          {attr.label}
                          {attr.sensitive ? " (Sensitive)" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Predicate Query Input if Predicate Mode */}
            {disclosureMode === "ZERO_EXPOSURE_PREDICATE" && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Zero-Exposure Predicate Assertion Query
                </label>
                <input
                  type="text"
                  value={predicateQuery}
                  onChange={(e) => setPredicateQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white text-slate-800 px-3.5 py-2 text-xs text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={handleDispatchRequest}
              disabled={dispatchingRequest}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>
                {dispatchingRequest
                  ? "Dispatching Request..."
                  : "Dispatch DPDP Verification Request"}
              </span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PANEL 2: STUDENT DPDP CONSENT WALLET & PASSKEY AUTHENTICATOR  */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-[#003366] text-base">
                  <Lock className="h-5 w-5 text-amber-400" />
                  Student Sovereign Consent Wallet
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Incoming verification requests awaiting your biometric consent or OTP.
                </p>
              </div>

              <button
                onClick={() => loadStudentRequests(selectedStudentApaar)}
                className="text-slate-600 hover:text-white"
                title="Refresh consent queue"
              >
                <RefreshCw className={`h-4 w-4 ${loadingQueue ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Request Queue */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {consentQueue.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  No consent requests currently pending for APAAR {selectedStudentApaar}.
                  Use Panel 1 on the left to dispatch a request!
                </div>
              ) : (
                consentQueue.map((item) => {
                  const isSelected = selectedConsentId === item.consent_id;
                  const isPending = item.status === "PENDING_STUDENT_APPROVAL";
                  return (
                    <div
                      key={item.consent_id}
                      onClick={() => {
                        setSelectedConsentId(item.consent_id);
                        setApprovedFields(item.requested_fields || []);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-950/30"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate max-w-[200px]">
                          {item.requester_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPending
                              ? "bg-amber-950 text-amber-300 border border-amber-800 animate-pulse"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono mt-1">
                        <span>Role: {item.requester_role}</span>
                        <span>Mode: {item.disclosure_mode}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Interactive Attribute Consent Checkboxes */}
            {selectedConsentId && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">
                    Selectively Approve Attributes
                  </div>
                  <span className="text-[10px] text-slate-600">
                    Uncheck sensitive fields to cryptographically blind them
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {ALL_ATTRIBUTES.map((attr) => {
                    const checked = approvedFields.includes(attr.id);
                    return (
                      <label
                        key={attr.id}
                        className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleApprovedField(attr.id)}
                          className="accent-emerald-500 rounded"
                        />
                        <span className={!checked ? "text-slate-500 line-through" : ""}>
                          {attr.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Authentication Method Selector */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Auth Method:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setApprovalMethod("WEBAUTHN")}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        approvalMethod === "WEBAUTHN"
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      WebAuthn Passkey
                    </button>
                    <button
                      type="button"
                      onClick={() => setApprovalMethod("OTP")}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        approvalMethod === "OTP"
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      DigiLocker OTP
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Biometric Approval Trigger Button */}
          <div>
            <button
              onClick={() => selectedConsentId && handleApproveConsent(selectedConsentId)}
              disabled={approving || !selectedConsentId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Fingerprint className="h-4 w-4" />
              <span>
                {approving
                  ? "Verifying Biometric Passkey..."
                  : "Approve Consent via Biometric Passkey / OTP"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PANEL 3: CRYPTOGRAPHIC PROOF INSPECTOR                        */}
      {/* ============================================================== */}
      {proofResult && (
        <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-3 py-0.5 text-xs font-bold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                CRYPTOGRAPHIC DPDP DISCLOSURE PROOF
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Verifiable Presentation Issued ({proofResult.disclosure_mode})
              </h2>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-slate-600">Merkle Seq:</span>
              <span className="rounded bg-slate-50 px-2 py-0.5 text-cyan-400 font-bold border border-slate-200">
                #{proofResult.audit_sequence_number}
              </span>
            </div>
          </div>

          {/* Mode A: Zero-Exposure Predicate Proof */}
          {proofResult.predicate_assertion && (
            <div className="space-y-4 rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Ed25519-Signed Predicate Assertion
                </span>
                <span className="rounded bg-emerald-950 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300 border border-emerald-700">
                  RESULT: TRUE (CONFIRMED)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-slate-600 uppercase font-sans">
                    Predicate Query
                  </div>
                  <div className="text-[#003366] font-bold mt-0.5">
                    {proofResult.predicate_assertion.predicate}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-600 uppercase font-sans">
                    Subject APAAR ID
                  </div>
                  <div className="text-cyan-300 font-bold mt-0.5">
                    {proofResult.predicate_assertion.apaar_id}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-600 uppercase font-sans">
                    Issuer Sovereign Authority
                  </div>
                  <div className="text-slate-800 mt-0.5">
                    {proofResult.predicate_assertion.issuer}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-600 uppercase font-sans">
                    Verification Timestamp
                  </div>
                  <div className="text-slate-800 mt-0.5">
                    {proofResult.predicate_assertion.verified_at}
                  </div>
                </div>
              </div>

              {/* Signature Proof Box */}
              <div className="rounded-lg bg-white p-3 space-y-1.5 font-mono text-[11px] border border-slate-200">
                <div className="text-slate-600 flex justify-between">
                  <span>Ed25519 Digital Signature:</span>
                  <span className="text-emerald-400">VALID AUTHENTICATION</span>
                </div>
                <div className="text-cyan-400 break-all">
                  {proofResult.predicate_assertion.ed25519_signature}
                </div>
              </div>

              <div className="rounded-lg bg-emerald-950/60 p-3 text-xs text-emerald-200 border border-emerald-800/40">
                <strong>Zero PII Exposure Guarantee:</strong> The employer received a mathematically
                unforgeable proof confirming active enrolment in an AICTE-approved program without
                accessing the student&apos;s date of birth, category, gender, or marks.
              </div>
            </div>
          )}

          {/* Mode B: SD-JWT Selective Disclosure Proof */}
          {proofResult.sd_jwt && (
            <div className="space-y-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                  <KeyRound className="h-5 w-5 text-cyan-400" />
                  IETF Selective Disclosure JSON Web Token (SD-JWT)
                </span>
                <span className="text-xs text-slate-600 font-mono">
                  Subject: {proofResult.sd_jwt.subject}
                </span>
              </div>

              {/* Disclosed Attributes */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-400">
                  Disclosed Attributes (Approved by Student)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(proofResult.sd_jwt.disclosed_claims || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="rounded-lg bg-white p-2.5 border border-emerald-900/40 flex justify-between"
                    >
                      <span className="text-slate-600">{key}:</span>
                      <span className="text-emerald-300 font-bold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blinded Claims */}
              {proofResult.sd_jwt.blinded_claims && proofResult.sd_jwt.blinded_claims.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-amber-400">
                    Cryptographically Blinded Claims (_sd Digest Hashes)
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    {proofResult.sd_jwt.blinded_claims.map((claim) => (
                      <div
                        key={claim}
                        className="rounded-lg bg-white p-2 border border-amber-900/40 flex justify-between items-center"
                      >
                        <span className="text-amber-300">{claim}:</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          SHA256_SALTED_DIGEST_MASKED (Unexposed)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature Proof Box */}
              <div className="rounded-lg bg-white p-3 space-y-1.5 font-mono text-[11px] border border-slate-200">
                <div className="text-slate-600 flex justify-between">
                  <span>Ed25519 Issuer Signature:</span>
                  <span className="text-cyan-400">IETF SD-JWT SIGNATURE VALID</span>
                </div>
                <div className="text-cyan-400 break-all">
                  {proofResult.sd_jwt.ed25519_signature}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
