"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Building2,
  UploadCloud,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronDown,
  FileCheck,
  ToggleLeft,
  ToggleRight,
  AlertOctagon,
  Copy,
  Info,
  GitCommit,
} from "lucide-react";
import {
  api,
  InstitutionPortalItem,
  QuotaLedgerResponse,
  PreviewMappingResponse,
  SandboxDiffResponse,
  SandboxRowDiff,
  CommitBatchResponse,
} from "@/lib/api";

// 5 Messy ERP Test Rows with drifted headers and edge cases
const SAMPLE_MESSY_ERP_ROWS = [
  {
    Student_APAAR_No: "827104928174", // Valid 12-digit Verhoeff APAAR
    Candidate_Full_Name: "Vikas Deshpande",
    Inst_Roll_No: "NEW-2026-CS-091",
    Birth_Date: "2005-07-19",
    Admitted_Quota: "GENERAL_BASE",
    Gender: "Male",
    Mobile_No: "+91-9844112233",
    Pincode: "560012",
    Parent_Initials: "S.D.",
    Email_Address: "vikas.d@student.ac.in",
  },
  {
    Student_APAAR_No: "482910384715", // Existing Student (Aarav Sharma) with updated phone
    Candidate_Full_Name: "Aarav Sharma",
    Inst_Roll_No: "ROLL-CSE-001",
    Birth_Date: "2004-05-14",
    Admitted_Quota: "GENERAL_BASE",
    Gender: "Male",
    Mobile_No: "+91-9999000111", // Changed phone -> FIELD_MODIFIED_DIFF
    Pincode: "560001",
    Parent_Initials: "R.S.",
    Email_Address: "aarav.sharma.updated@student.ac.in",
  },
  {
    Student_APAAR_No: "739201846297", // Existing Student (Priya Nair) unchanged -> IDEMPOTENT_NO_CHANGE
    Candidate_Full_Name: "Priya Nair",
    Inst_Roll_No: "ROLL-CSE-002",
    Birth_Date: "2004-08-20",
    Admitted_Quota: "GENERAL_BASE",
    Gender: "Female",
    Mobile_No: "+91-9876543210",
    Pincode: "600001",
    Parent_Initials: "K.N.",
    Email_Address: "priya.nair@student.ac.in",
  },
  {
    Student_APAAR_No: "", // FN without APAAR
    Candidate_Full_Name: "Tariq Al-Mansoor",
    Inst_Roll_No: "FN-2026-CS-101",
    Birth_Date: "2004-11-05",
    Admitted_Quota: "FN_SUPERNUMERARY",
    Gender: "Male",
    Passport_OCI_Doc: "", // MISSING passport -> triggers APH-2026-SEC-4.2 REJECTED_OR_FLAGGED
    Mobile_No: "+971-501234567",
    Pincode: "999999",
    Email_Address: "tariq.mansoor@uae.edu",
  },
  {
    Student_APAAR_No: "827104928179", // INVALID Verhoeff Checksum (9 instead of 4) -> REJECTED_OR_FLAGGED
    Candidate_Full_Name: "Ankit Verma",
    Inst_Roll_No: "BAD-2026-CS-102",
    Birth_Date: "2005-03-30",
    Admitted_Quota: "GENERAL_BASE",
    Gender: "Male",
    Mobile_No: "+91-9776655443",
    Pincode: "201301",
    Email_Address: "ankit.verma@student.ac.in",
  },
];

export default function InstitutionPortalPage() {
  // Selector State
  const [institutions, setInstitutions] = useState<InstitutionPortalItem[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>("");
  const [selectedQuotaId, setSelectedQuotaId] = useState<string>("");
  const [quotaStatus, setQuotaStatus] = useState<QuotaLedgerResponse | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);

  // Ingestion Step 1 State: Schema Mapping
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mappingResult, setMappingResult] = useState<PreviewMappingResponse | null>(null);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ingestion Step 2 State: Sandbox Diff
  const [simulateOutage, setSimulateOutage] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<SandboxDiffResponse | null>(null);
  const [loadingSandbox, setLoadingSandbox] = useState(false);

  // Ingestion Step 3 State: Batch Commit
  const [commitResult, setCommitResult] = useState<CommitBatchResponse | null>(null);
  const [loadingCommit, setLoadingCommit] = useState(false);

  // Load institutions on mount
  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const list = await api.getInstitutions();
      setInstitutions(list);

      // Default to Apex Institute of Technology
      if (list.length > 0) {
        const apex = list.find((i) => i.aicte_permanent_id === "1-10000001") || list[0];
        setSelectedInstId(apex.id);
        if (apex.program_quotas && apex.program_quotas.length > 0) {
          const quota =
            apex.program_quotas.find((q) => q.course_code.includes("CSE")) ||
            apex.program_quotas[0];
          setSelectedQuotaId(quota.id);
          fetchQuotaStatus(quota.id);
        }
      }
    } catch (err) {
      console.error("Failed to load institutions:", err);
    }
  };

  const fetchQuotaStatus = async (quotaId: string) => {
    if (!quotaId) return;
    setLoadingQuota(true);
    try {
      const data = await api.getQuotaStatus(quotaId);
      setQuotaStatus(data);
    } catch (err) {
      console.error("Failed to fetch quota status:", err);
    } finally {
      setLoadingQuota(false);
    }
  };

  const handleSelectInstitution = (instId: string) => {
    setSelectedInstId(instId);
    const inst = institutions.find((i) => i.id === instId);
    if (inst && inst.program_quotas && inst.program_quotas.length > 0) {
      const q = inst.program_quotas[0];
      setSelectedQuotaId(q.id);
      fetchQuotaStatus(q.id);
    }
  };

  const handleSelectQuota = (quotaId: string) => {
    setSelectedQuotaId(quotaId);
    fetchQuotaStatus(quotaId);
  };

  // Step 1: Load Sample Messy ERP
  const handleLoadSampleERP = async () => {
    setLoadingMapping(true);
    setRawRows(SAMPLE_MESSY_ERP_ROWS);
    try {
      const res = await api.previewMappingJson(SAMPLE_MESSY_ERP_ROWS);
      setMappingResult(res);
      setActiveStep(1);
    } catch (err: any) {
      alert(`Schema mapping error: ${err.message}`);
    } finally {
      setLoadingMapping(false);
    }
  };

  // Step 1: Upload CSV/Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingMapping(true);
    try {
      const res = await api.previewMapping(file);
      setMappingResult(res);
      setRawRows(res.sample_preview);
      setActiveStep(1);
    } catch (err: any) {
      alert(`File parsing error: ${err.message}`);
    } finally {
      setLoadingMapping(false);
    }
  };

  // Step 2: Run Pre-Commit Sandbox
  const handleRunSandbox = async () => {
    if (!selectedInstId || !selectedQuotaId) {
      alert("Please select an institution and program quota first.");
      return;
    }
    if (rawRows.length === 0) {
      alert("Please load or upload student records first in Step 1.");
      return;
    }

    setLoadingSandbox(true);
    try {
      // Build column mapping dictionary from mappingResult
      const colMap: Record<string, string> = {};
      if (mappingResult) {
        Object.entries(mappingResult.mappings).forEach(([src, item]) => {
          if (item.target_field) colMap[src] = item.target_field;
        });
      }

      const res = await api.sandboxDiff({
        institution_id: selectedInstId,
        program_quota_id: selectedQuotaId,
        simulate_registry_downtime: simulateOutage,
        rows: rawRows,
      });

      setSandboxResult(res);
      setActiveStep(2);
    } catch (err: any) {
      alert(`Sandbox simulation failed: ${err.message}`);
    } finally {
      setLoadingSandbox(false);
    }
  };

  // Step 3: Batch Commit
  const handleCommitBatch = async () => {
    if (!selectedInstId || !selectedQuotaId || rawRows.length === 0) return;
    setLoadingCommit(true);
    try {
      const res = await api.commitBatch({
        institution_id: selectedInstId,
        program_quota_id: selectedQuotaId,
        rows: rawRows,
      });
      setCommitResult(res);
      setActiveStep(3);
      // Refresh live quota status to reflect newly committed records
      fetchQuotaStatus(selectedQuotaId);
    } catch (err: any) {
      alert(`Batch commit error: ${err.message}`);
    } finally {
      setLoadingCommit(false);
    }
  };

  // Download RFC 4180 Error Report CSV
  const handleDownloadErrorReport = () => {
    if (!sandboxResult?.error_report_csv) return;
    const blob = new Blob([sandboxResult.error_report_csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sandbox_error_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentInst = institutions.find((i) => i.id === selectedInstId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* 1. INSTITUTION & PROGRAM SELECTOR TOP BAR */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E3E6E] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-medium text-[#003366]">
                Automated Ingestion Sandbox
              </span>
              <span className="text-xs text-slate-600 font-mono">
                Statutory Quota Validation
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-[#003366] mt-1">
              Institution Registrar & Ingestion Sandbox
            </h1>
          </div>

          {/* Quick-Jump Institution Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium hidden sm:inline">
              Quick Select:
            </span>
            <button
              onClick={() => {
                const apex = institutions.find((i) => i.aicte_permanent_id === "1-10000001");
                if (apex) handleSelectInstitution(apex.id);
              }}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-[#003366] hover:border-[#003366] transition-colors"
            >
              Apex Tech
            </button>
            <button
              onClick={() => {
                const deccan = institutions.find((i) => i.name.includes("Deccan"));
                if (deccan) handleSelectInstitution(deccan.id);
              }}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-[#003366] hover:border-[#003366] transition-colors"
            >
              Deccan Valley
            </button>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Institution
            </label>
            <div className="relative">
              <select
                value={selectedInstId}
                onChange={(e) => handleSelectInstitution(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-[#003366] shadow-inner focus:border-[#003366] focus:outline-none"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.aicte_permanent_id}) — {inst.state}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Academic Program & Quota
            </label>
            <div className="relative">
              <select
                value={selectedQuotaId}
                onChange={(e) => handleSelectQuota(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-[#003366] shadow-inner focus:border-[#003366] focus:outline-none"
              >
                {(currentInst?.program_quotas || []).map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.program_name} ({q.course_code}) — Intake: {q.approved_intake} seats (
                    {q.delivery_mode})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. REAL-TIME AICTE APH 2024–27 QUOTA CAPACITY GAUGES          */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#046A38]" />
            <h2 className="text-sm font-bold text-[#003366] uppercase tracking-wider">
              Real-Time APH 2024–27 Quota Capacity Gauges
            </h2>
          </div>
          {quotaStatus && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded border ${
                quotaStatus.is_over_capacity
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {quotaStatus.is_over_capacity
                ? `Capacity Exceeded by +${quotaStatus.excess_students} students`
                : `${quotaStatus.intake_headroom_remaining} Seats Headroom Remaining`}
            </span>
          )}
        </div>

        {quotaStatus ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {/* Gauge 1: General Base + NRI Total */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3.5 space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>General Base + NRI</span>
                <span className="font-mono text-[#003366] font-bold">
                  {quotaStatus.enrolled_general_base + quotaStatus.enrolled_nri_internal} /{" "}
                  {quotaStatus.approved_intake}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quotaStatus.enrolled_general_base + quotaStatus.enrolled_nri_internal >
                    quotaStatus.approved_intake
                      ? "bg-rose-600"
                      : "bg-[#003366]"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      ((quotaStatus.enrolled_general_base + quotaStatus.enrolled_nri_internal) /
                        (quotaStatus.approved_intake || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-700 font-semibold">Approved Base Cap</div>
            </div>

            {/* Gauge 2: NRI Internal Carve-Out */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3.5 space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>NRI Internal</span>
                <span className="font-mono text-blue-800 font-bold">
                  {quotaStatus.enrolled_nri_internal} / {quotaStatus.nri_5pct_internal_cap}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (quotaStatus.enrolled_nri_internal /
                        (quotaStatus.nri_5pct_internal_cap || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-700 font-semibold">5% Internal Carve-Out</div>
            </div>

            {/* Gauge 3: FN / OCI / CIWGC Supernumerary */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3.5 space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span className="text-[#046A38] font-bold">FN / OCI / CIWGC</span>
                <span className="font-mono text-emerald-800 font-bold">
                  {quotaStatus.enrolled_fn_oci_ciwgc_supernumerary} /{" "}
                  {quotaStatus.fn_oci_ciwgc_15pct_supernumerary_cap}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#046A38] rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (quotaStatus.enrolled_fn_oci_ciwgc_supernumerary /
                        (quotaStatus.fn_oci_ciwgc_15pct_supernumerary_cap || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-emerald-800 font-semibold">15% Supernumerary Bucket</div>
            </div>

            {/* Gauge 4: TFW Supernumerary */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3.5 space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>TFW Scheme</span>
                <span className="font-mono text-purple-800 font-bold">
                  {quotaStatus.enrolled_tfw_supernumerary} / {quotaStatus.tfw_5pct_supernumerary_cap}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (quotaStatus.enrolled_tfw_supernumerary /
                        (quotaStatus.tfw_5pct_supernumerary_cap || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-700 font-semibold">5% Supernumerary Cap</div>
            </div>

            {/* Gauge 5: PMSSS */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3.5 space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>PMSSS (J&K)</span>
                <span className="font-mono text-amber-800 font-bold">
                  {quotaStatus.enrolled_pmsss_supernumerary} / {quotaStatus.pmsss_supernumerary_cap}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#FF7A1A] rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (quotaStatus.enrolled_pmsss_supernumerary /
                        (quotaStatus.pmsss_supernumerary_cap || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-700 font-semibold">Supernumerary Scholar</div>
            </div>

            {/* Gauge 6: Lateral Entry */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3.5 space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>Lateral Entry</span>
                <span className="font-mono text-rose-800 font-bold">
                  {quotaStatus.enrolled_lateral_entry} / {quotaStatus.lateral_entry_2nd_yr_cap}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (quotaStatus.enrolled_lateral_entry /
                        (quotaStatus.lateral_entry_2nd_yr_cap || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-700 font-semibold">Direct 2nd Year Cap</div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 p-4 text-center text-xs text-slate-700 font-medium bg-white">
            {loadingQuota ? "Loading live quota status..." : "Select an institution & quota above"}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3-STEP INGESTION WORKFLOW WIDGET                              */}
      {/* ============================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6 space-y-6">
        {/* Step Indicator Tabs */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
              activeStep === 1
                ? "bg-blue-50 border-2 border-[#003366] text-[#003366]"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs ${
                activeStep === 1 ? "bg-[#003366] text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              1
            </div>
            <div>
              <div className="text-xs font-bold">Step 1: Schema-Drift Ingestion</div>
              <div className="text-[11px] text-slate-600 font-medium">Fuzzy Jaro-Winkler Alignment</div>
            </div>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
              activeStep === 2
                ? "bg-amber-50 border-2 border-[#FF7A1A] text-amber-900"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs ${
                activeStep === 2 ? "bg-[#FF7A1A] text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              2
            </div>
            <div>
              <div className="text-xs font-bold">Step 2: Pre-Commit Sandbox</div>
              <div className="text-[11px] text-slate-600 font-medium">Delta Diff & Fallback L1 Outage</div>
            </div>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
              activeStep === 3
                ? "bg-emerald-50 border-2 border-[#046A38] text-emerald-900"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs ${
                activeStep === 3 ? "bg-[#046A38] text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              3
            </div>
            <div>
              <div className="text-xs font-bold">Step 3: Batch Commit & Merkle Seal</div>
              <div className="text-[11px] text-slate-600 font-medium">Idempotency & Checkpoint Signature</div>
            </div>
          </button>
        </div>

        {/* ============================================================== */}
        {/* STEP 1: SCHEMA-DRIFT COLUMN MAPPER VIEW                        */}
        {/* ============================================================== */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#003366] flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-[#003366]" />
                  Adaptive Schema-Drift Ingestion Pipeline
                </h3>
                <p className="text-xs text-slate-700 font-medium">
                  Accepts non-standard or legacy ERP headers. Automatically maps columns using Jaro-Winkler similarity.
                </p>
              </div>

              {/* 1-Click Load Sample Messy ERP Button */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
                >
                  Upload CSV/Excel File
                </button>
                <button
                  onClick={handleLoadSampleERP}
                  disabled={loadingMapping}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#003366] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#002244] transition-all active:scale-95"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>
                    {loadingMapping ? "Mapping..." : "1-Click Messy ERP Sample (Judge Demo)"}
                  </span>
                </button>
              </div>
            </div>

            {/* Jaro-Winkler Mapping Table */}
            {mappingResult ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#003366]">
                      Fuzzy Column Auto-Alignment ({Object.keys(mappingResult.mappings).length} Columns Aligned)
                    </span>
                    <span className="text-[11px] text-[#0A4D8C] font-mono font-semibold">
                      Jaro-Winkler Algorithm Active
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-700 text-[11px] bg-slate-50/50">
                          <th className="py-2.5 px-4 font-bold">Incoming Source Header</th>
                          <th className="py-2.5 px-4 font-bold">Auto-Mapped Canonical Field</th>
                          <th className="py-2.5 px-4 font-bold">Match Classification</th>
                          <th className="py-2.5 px-4 font-bold">Confidence Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {Object.entries(mappingResult.mappings).map(([srcCol, item]) => (
                          <tr key={srcCol} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                              {srcCol}
                            </td>
                            <td className="py-2.5 px-4 text-[#003366] font-bold">
                              {item.target_field || (
                                <span className="text-slate-500 font-normal">UNMAPPED</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-sans">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.match_type === "EXACT"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                    : item.match_type === "SYNONYM"
                                    ? "bg-blue-50 text-blue-800 border border-blue-300"
                                    : item.match_type === "FUZZY_JARO_WINKLER"
                                    ? "bg-purple-50 text-purple-800 border border-purple-300"
                                    : "bg-slate-100 text-slate-700 border border-slate-300"
                                }`}
                              >
                                {item.match_type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${Math.round(item.confidence * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-slate-700 font-semibold">
                                  {Math.round(item.confidence * 100)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action button to proceed to Step 2 */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#003366] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#002244] shadow-sm transition-all"
                  >
                    <span>Proceed to Pre-Commit Sandbox Diff Chamber</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3 bg-slate-50/50">
                <UploadCloud className="h-10 w-10 text-slate-500 mx-auto" />
                <div className="text-sm font-bold text-slate-800">
                  No ERP file loaded yet
                </div>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Click the <strong>&quot;1-Click Messy ERP Sample&quot;</strong> button above to test
                  with drifted headers, valid Verhoeff APAAR, duplicate updates, and invalid checksums.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: PRE-COMMIT SANDBOX DIFF CHAMBER & OUTAGE TOGGLE       */}
        {/* ============================================================== */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#003366] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#FF7A1A]" />
                  Pre-Commit Sandbox Diff Chamber (Non-Mutating)
                </h3>
                <p className="text-xs text-slate-700 font-medium">
                  Simulates student row insertions against APH quotas and Verhoeff checks before committing to PostgreSQL.
                </p>
              </div>

              {/* DigiLocker Outage Toggle & Run Button */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Outage Toggle */}
                <div
                  onClick={() => setSimulateOutage(!simulateOutage)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 cursor-pointer transition-all ${
                    simulateOutage
                      ? "border-amber-400 bg-amber-50 text-amber-900 shadow-xs"
                      : "border-slate-300 bg-white shadow-2xs text-slate-700 hover:border-slate-400"
                  }`}
                  title="Simulate external DigiLocker/ABC downtime (APH-2026-FALLBACK-L1)"
                >
                  {simulateOutage ? (
                    <ToggleRight className="h-5 w-5 text-[#FF7A1A]" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-slate-500" />
                  )}
                  <span className="text-xs font-bold">
                    {simulateOutage
                      ? "DigiLocker Outage: SIMULATED (Queue Mode)"
                      : "Registry Online"}
                  </span>
                </div>

                <button
                  onClick={handleRunSandbox}
                  disabled={loadingSandbox || rawRows.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#003366] px-4 py-2 text-xs font-bold text-white hover:bg-[#002244] transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingSandbox ? "animate-spin" : ""}`} />
                  <span>
                    {loadingSandbox ? "Evaluating Diff..." : "Run Pre-Commit Simulation"}
                  </span>
                </button>
              </div>
            </div>

            {/* Outage Mode Alert Banner */}
            {simulateOutage && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-center gap-3 shadow-xs">
                <AlertOctagon className="h-5 w-5 text-[#FF7A1A] flex-shrink-0" />
                <div>
                  <strong>APH-2026-FALLBACK-L1 Active:</strong> The national APAAR registry is simulated
                  as unreachable. Records are <em>NEVER</em> rejected; they are marked as{" "}
                  <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono font-bold">
                    UNVERIFIED_PENDING_REGISTRY
                  </code>{" "}
                  and queued for asynchronous idempotent retry.
                </div>
              </div>
            )}

            {/* Sandbox Results */}
            {sandboxResult ? (
              <div className="space-y-6">
                {/* 4 Summary Counter Pills */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-2xs">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase">
                      NEW_INSERT
                    </div>
                    <div className="text-2xl font-black text-emerald-950 mt-1">
                      {sandboxResult.new_insert_count}
                    </div>
                    <div className="text-[10px] text-emerald-800 font-semibold">Valid new admissions</div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-2xs">
                    <div className="text-[11px] font-bold text-amber-800 uppercase">
                      FIELD_MODIFIED_DIFF
                    </div>
                    <div className="text-2xl font-black text-amber-950 mt-1">
                      {sandboxResult.field_modified_diff_count}
                    </div>
                    <div className="text-[10px] text-amber-800 font-semibold">Updates to existing records</div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-2xs">
                    <div className="text-[11px] font-bold text-blue-800 uppercase">
                      IDEMPOTENT_NO_CHANGE
                    </div>
                    <div className="text-2xl font-black text-blue-950 mt-1">
                      {sandboxResult.idempotent_no_change_count}
                    </div>
                    <div className="text-[10px] text-blue-800 font-semibold">Duplicate rows skipped</div>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-2xs">
                    <div className="text-[11px] font-bold text-rose-800 uppercase">
                      REJECTED_OR_FLAGGED
                    </div>
                    <div className="text-2xl font-black text-rose-950 mt-1">
                      {sandboxResult.flagged_or_rejected_count}
                    </div>
                    <div className="text-[10px] text-rose-800 font-semibold">Checksum / Rule breaches</div>
                  </div>
                </div>

                {/* Row-by-Row Inspection Table */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#003366]">
                      Row-Level Delta Evaluation ({sandboxResult.rows.length} Rows Evaluated)
                    </span>
                    {sandboxResult.error_report_csv && (
                      <button
                        onClick={handleDownloadErrorReport}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 hover:text-rose-900 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download RFC 4180 Error Report CSV</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-700 text-[11px] bg-slate-50/50">
                          <th className="py-2.5 px-3 font-bold">Row #</th>
                          <th className="py-2.5 px-3 font-bold">Student / Roll No</th>
                          <th className="py-2.5 px-3 font-bold">APAAR / Provisional Token</th>
                          <th className="py-2.5 px-3 font-bold">Category</th>
                          <th className="py-2.5 px-3 font-bold">Delta Classification</th>
                          <th className="py-2.5 px-3 font-bold">Field Changes / Violations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {sandboxResult.rows.map((r) => {
                          const isFlagged =
                            r.delta_type === "REJECTED_OR_FLAGGED" ||
                            r.validation_status === "FLAGGED_VIOLATION";
                          return (
                            <tr key={r.row_index} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 text-slate-700 font-bold">
                                #{r.row_index + 1}
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                <div className="font-bold text-slate-900">{r.full_name}</div>
                                <div className="text-[10px] text-slate-600 font-mono font-medium">
                                  {r.institutional_student_id}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                {r.apaar_id ? (
                                  <span className="text-[#003366] font-mono font-bold">{r.apaar_id}</span>
                                ) : r.provisional_token ? (
                                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-800 border border-indigo-200 font-mono font-bold">
                                    {r.provisional_token}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-medium">None</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">
                                {r.seat_category}
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    r.delta_type === "NEW_INSERT"
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                      : r.delta_type === "FIELD_MODIFIED_DIFF"
                                      ? "bg-amber-50 text-amber-800 border border-amber-300"
                                      : r.delta_type === "IDEMPOTENT_NO_CHANGE"
                                      ? "bg-blue-50 text-blue-800 border border-blue-300"
                                      : "bg-rose-50 text-rose-800 border border-rose-300"
                                  }`}
                                >
                                  {r.delta_type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-sans text-xs">
                                {/* Field Diffs */}
                                {r.field_diffs && Object.keys(r.field_diffs).length > 0 && (
                                  <div className="space-y-1">
                                    {Object.entries(r.field_diffs).map(([f, vals]) => (
                                      <div key={f} className="text-[11px] font-mono">
                                        <span className="text-slate-700 font-semibold">{f}:</span>{" "}
                                        <span className="text-rose-700 line-through">
                                          {String(vals.old)}
                                        </span>{" "}
                                        <span className="text-emerald-800 font-bold">
                                          &rarr; {String(vals.new)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Flag Reasons */}
                                {r.flag_reasons && r.flag_reasons.length > 0 && (
                                  <div className="space-y-1">
                                    {r.flag_reasons.map((flag, idx) => (
                                      <div
                                        key={idx}
                                        className="text-[11px] text-rose-700 flex items-center gap-1 font-semibold"
                                      >
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>[{flag.code}]</span> {flag.message}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {!r.field_diffs && (!r.flag_reasons || r.flag_reasons.length === 0) && (
                                  <span className="text-slate-600 text-[11px] font-medium">No modifications</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action button to proceed to Step 3 */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="text-xs text-slate-700 hover:text-slate-900 font-bold"
                  >
                    &larr; Back to Schema Mapping
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#003366] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#002244] shadow-sm transition-all"
                  >
                    <span>Proceed to Batch Commit & Merkle Seal</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3 bg-slate-50/50">
                <ShieldCheck className="h-10 w-10 text-slate-500 mx-auto" />
                <div className="text-sm font-bold text-slate-800">
                  Sandbox simulation not run yet
                </div>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Click the <strong>&quot;Run Pre-Commit Simulation&quot;</strong> button above to
                  validate Verhoeff checks, compute quota headroom, and preview old-vs-new field diffs.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: IDEMPOTENT BATCH COMMIT & MERKLE SEAL                 */}
        {/* ============================================================== */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#003366] flex items-center gap-2">
                  <GitCommit className="h-5 w-5 text-[#046A38]" />
                  Idempotent Batch Commit & Cryptographic Merkle Seal
                </h3>
                <p className="text-xs text-slate-700 font-medium">
                  Commits validated student rows to student_enrolments and writes an immutable SHA-256 Merkle checkpoint.
                </p>
              </div>

              {/* Commit & Idempotency Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCommitBatch}
                  disabled={loadingCommit || rawRows.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#046A38] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#03532C] transition-colors shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className={`h-4 w-4 ${loadingCommit ? "animate-spin" : ""}`} />
                  <span>
                    {loadingCommit ? "Committing Records..." : "Commit Batch to Registry"}
                  </span>
                </button>

                {commitResult && (
                  <button
                    onClick={handleCommitBatch}
                    disabled={loadingCommit}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
                    title="Click again to test idempotency: inserted_count drops to 0 while skipped_idempotent increments"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#003366]" />
                    <span>Re-Run Commit (Test Idempotency)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Commit Receipt Card */}
            {commitResult ? (
              <div className="rounded-2xl border-2 border-emerald-300 bg-white p-6 space-y-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-[#046A38]" />
                    BATCH INGESTION COMMITTED SUCCESSFULLY & SEALED
                  </div>
                  <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-mono font-bold text-emerald-900 border border-emerald-300">
                    MERKLE SEQ #{commitResult.audit_sequence_number}
                  </span>
                </div>

                {/* Counters Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-2xs">
                    <div className="text-[10px] text-emerald-800 font-sans font-bold uppercase">
                      New Inserts Committed
                    </div>
                    <div className="text-2xl font-black text-emerald-950 mt-1">
                      {commitResult.committed_new_inserts}
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-2xs">
                    <div className="text-[10px] text-amber-800 font-sans font-bold uppercase">
                      Field Updates Applied
                    </div>
                    <div className="text-2xl font-black text-amber-950 mt-1">
                      {commitResult.committed_updates}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-2xs">
                    <div className="text-[10px] text-blue-800 font-sans font-bold uppercase">
                      Skipped Idempotent (Duplicates)
                    </div>
                    <div className="text-2xl font-black text-blue-950 mt-1">
                      {commitResult.skipped_idempotent}
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-2xs">
                    <div className="text-[10px] text-rose-800 font-sans font-bold uppercase">
                      Flagged Records Logged
                    </div>
                    <div className="text-2xl font-black text-rose-950 mt-1">
                      {commitResult.flagged_committed}
                    </div>
                  </div>
                </div>

                {/* Merkle Cryptographic Audit Proof */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-sans font-bold text-[#003366] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#046A38]" />
                      Cryptographic Merkle Record Digest
                    </span>
                    <span className="text-[11px] text-emerald-800 font-bold">Immutable Checkpoint</span>
                  </div>
                  <div className="text-[#003366] font-bold break-all bg-white p-2.5 rounded border border-slate-300 shadow-2xs">
                    {commitResult.audit_record_hash}
                  </div>
                  {commitResult.merkle_signature && (
                    <div className="text-[11px] text-slate-700 font-medium">
                      Ed25519 Checkpoint Signature:{" "}
                      <span className="text-slate-900 font-mono font-bold">
                        {commitResult.merkle_signature.substring(0, 32)}...
                      </span>
                    </div>
                  )}
                </div>

                {/* Idempotency Proof Explanation */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-950 leading-relaxed font-medium">
                  <span className="font-bold text-[#003366]">Idempotency Guarantee:</span> Clicking the{" "}
                  <strong>&quot;Re-Run Commit (Test Idempotency)&quot;</strong> button above re-submits the
                  identical payload. Notice that <code>committed_new_inserts</code> drops to{" "}
                  <strong>0</strong> and <code>skipped_idempotent</code> increases—proving that network
                  retries never result in duplicate student registrations.
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3 bg-slate-50/50">
                <GitCommit className="h-10 w-10 text-slate-500 mx-auto" />
                <div className="text-sm font-bold text-slate-800">Ready for batch commit</div>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Click <strong>&quot;Commit Batch to Registry&quot;</strong> to write the
                  records into PostgreSQL and seal the transaction with a SHA-256 Merkle checkpoint.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
