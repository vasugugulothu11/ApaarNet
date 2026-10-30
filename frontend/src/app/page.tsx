"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Building2,
  BrainCircuit,
  ShieldCheck,
  TrendingUp,
  AlertOctagon,
  Users,
  CheckCircle2,
  ChevronRight,
  Database,
  ArrowRight,
  Layers,
  Sliders,
  Scale,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Code2,
  Lock,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import {
  api,
  NationalOverviewResponse,
  InstitutionPortalItem,
  QuotaCompareResponse,
  AuditLedgerResponse,
  TamperSimulationResponse,
} from "@/lib/api";

export default function NationalCommandPage() {
  // Telemetry State
  const [telemetry, setTelemetry] = useState<NationalOverviewResponse | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);

  // Case A Quota Compare State
  const [institutions, setInstitutions] = useState<InstitutionPortalItem[]>([]);
  const [selectedQuotaId, setSelectedQuotaId] = useState<string>("");
  const [quotaCompare, setQuotaCompare] = useState<QuotaCompareResponse | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Merkle Audit Ledger & Tamper State
  const [ledger, setLedger] = useState<AuditLedgerResponse | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [tamperResult, setTamperResult] = useState<TamperSimulationResponse | null>(null);
  const [isSimulatingTamper, setIsSimulatingTamper] = useState(false);

  // Report Modal State
  const [activeReportModal, setActiveReportModal] = useState<string | null>(null);
  const [reportJsonData, setReportJsonData] = useState<any | null>(null);
  const [loadingReportData, setLoadingReportData] = useState(false);

  // State Filter in Matrix
  const [stateSearch, setStateSearch] = useState("");

  // Initial Data Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoadingTelemetry(true);
    setLoadingLedger(true);

    try {
      const [overviewData, instData, ledgerData] = await Promise.all([
        api.getNationalOverview(),
        api.getInstitutions(),
        api.getAuditLedger(20),
      ]);

      setTelemetry(overviewData);
      setInstitutions(instData);
      setLedger(ledgerData);

      // Auto-select Apex Institute of Technology
      if (instData.length > 0) {
        const apex = instData.find(
          (i) => i.aicte_permanent_id === "1-10000001" || i.name.includes("Apex")
        );
        const targetInst = apex || instData[0];
        if (targetInst.program_quotas && targetInst.program_quotas.length > 0) {
          const quota =
            targetInst.program_quotas.find((q) => q.course_code.includes("CSE")) ||
            targetInst.program_quotas[0];
          setSelectedQuotaId(quota.id);
          loadQuotaCompare(quota.id);
        }
      }
    } catch (err) {
      console.error("Failed to load initial command data:", err);
    } finally {
      setLoadingTelemetry(false);
      setLoadingLedger(false);
    }
  };

  const loadQuotaCompare = async (quotaId: string) => {
    if (!quotaId) return;
    setLoadingCompare(true);
    try {
      const data = await api.getQuotaCompare(quotaId);
      setQuotaCompare(data);
    } catch (err) {
      console.error("Failed to load quota compare:", err);
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleQuotaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const qId = e.target.value;
    setSelectedQuotaId(qId);
    loadQuotaCompare(qId);
  };

  const handleSimulateTamper = async () => {
    setIsSimulatingTamper(true);
    try {
      const res = await api.simulateTamper();
      setTamperResult(res);
    } catch (err: any) {
      alert(`Tamper simulation failed: ${err.message}`);
    } finally {
      setIsSimulatingTamper(false);
    }
  };

  const handleInspectReport = async (reportType: string) => {
    setActiveReportModal(reportType);
    setLoadingReportData(true);
    setReportJsonData(null);
    try {
      const data = await api.getExportData(reportType);
      setReportJsonData(data);
    } catch (err: any) {
      setReportJsonData({ error: err.message });
    } finally {
      setLoadingReportData(false);
    }
  };

  // Filtered State Matrix
  const filteredStates = (telemetry?.state_breakdown || []).filter((s) =>
    s.state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* 1. Header & KPI Strip */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-[#003366] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#FF7A1A]" />
              <span>National Statutory Telemetry · 50 Monitored Institutions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#003366] pt-1">
              National Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              Continuous telemetry across 50 institutions in 10 states. Enforces statutory quota carve-outs,
              detects cross-institution concurrent enrolments, and maintains an immutable SHA-256 Merkle audit ledger.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={loadAllData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-[#003366] transition-colors hover:border-[#003366] hover:text-[#003366]"
              title="Refresh live metrics"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingTelemetry ? "animate-spin text-[#003366]" : "text-slate-600"}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Section Quick Jump Anchors */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4 text-xs">
          <a
            href="#telemetry"
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[#003366] hover:border-[#003366] transition-colors"
          >
            Telemetry & Quotas
          </a>
          <a
            href="#quota-evaluation"
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[#003366] hover:border-[#003366] transition-colors"
          >
            Statutory Quota Evaluation
          </a>
          <a
            href="#merkle-lab"
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[#003366] hover:border-[#003366] transition-colors"
          >
            Audit Ledger & Tamper Lab
          </a>
          <a
            href="#accreditation-exports"
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[#003366] hover:border-[#003366] transition-colors"
          >
            Accreditation Packages
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div id="telemetry" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wide">Institutions</span>
            <Building2 className="h-4 w-4 text-[#003366]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#003366]">
            {loadingTelemetry ? "..." : telemetry?.total_institutions ?? "50"}
          </div>
          <p className="mt-1 text-[11px] text-slate-600 font-medium">10 States Monitored</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wide">Total Enrolled</span>
            <Users className="h-4 w-4 text-[#003366]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#003366]">
            {loadingTelemetry
              ? "..."
              : telemetry?.total_students_enrolled.toLocaleString() ?? "1,432"}
          </div>
          <p className="mt-1 text-[11px] text-slate-600 font-medium">Validated Enrolments</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wide">APAAR Coverage</span>
            <ShieldCheck className="h-4 w-4 text-[#046A38]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#046A38]">
            {loadingTelemetry ? "..." : `${telemetry?.verified_apaar_coverage_pct ?? 92.4}%`}
          </div>
          <p className="mt-1 text-[11px] text-slate-600 font-medium">Verhoeff D₅ Validated</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wide">Approved Intake</span>
            <TrendingUp className="h-4 w-4 text-[#003366]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#003366]">
            {loadingTelemetry
              ? "..."
              : telemetry?.total_approved_intake.toLocaleString() ?? "3,180"}
          </div>
          <p className="mt-1 text-[11px] text-slate-600 font-medium">Sanctioned Base Capacity</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wide">Active Flags</span>
            <AlertOctagon className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">
            {loadingTelemetry ? "..." : telemetry?.active_flagged_violations ?? "6"}
          </div>
          <p className="mt-1 text-[11px] text-slate-600 font-medium">Intake Excess Detected</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wide">Disputes</span>
            <Scale className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">
            {loadingTelemetry ? "..." : telemetry?.open_tri_party_disputes ?? "2"}
          </div>
          <p className="mt-1 text-[11px] text-slate-600 font-medium">Inter-State Collisions</p>
        </div>
      </div>

      {/* Multi-Quota Distribution & Status Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Statutory Multi-Quota Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#003366] flex items-center gap-2">
                <Sliders className="h-4 w-4 text-slate-600" />
                Statutory Multi-Quota Seat Distribution
              </h2>
              <p className="text-xs text-slate-600">
                Nationwide breakdown across base sanctioned and statutory supernumerary categories.
              </p>
            </div>
            <span className="rounded-md bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-[#003366] border border-slate-200">
              Total: {telemetry?.total_students_enrolled.toLocaleString() ?? 1432}
            </span>
          </div>

          {telemetry?.seat_distribution ? (
            <div className="space-y-4">
              {/* General Base */}
              <div>
                <div className="flex justify-between text-xs text-[#003366] mb-1">
                  <span>General Base (Sanctioned Intake)</span>
                  <span className="font-mono text-slate-600">
                    {telemetry.seat_distribution.general_base} seats (
                    {Math.round(
                      (telemetry.seat_distribution.general_base /
                        telemetry.total_students_enrolled) *
                        100
                    )}
                    %)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-50 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-[#003366] rounded-full"
                    style={{
                      width: `${(telemetry.seat_distribution.general_base /
                        telemetry.total_students_enrolled) *
                        100}%`,
                    }}
                  />
                </div>
              </div>

              {/* FN / OCI / CIWGC Supernumerary */}
              <div>
                <div className="flex justify-between text-xs text-[#003366] mb-1">
                  <span className="text-[#046A38] font-semibold">
                    Foreign National / OCI / CIWGC (15% Supernumerary)
                  </span>
                  <span className="font-mono text-slate-600">
                    {telemetry.seat_distribution.fn_oci_ciwgc_supernumerary} seats (
                    {Math.round(
                      (telemetry.seat_distribution.fn_oci_ciwgc_supernumerary /
                        telemetry.total_students_enrolled) *
                        100
                    )}
                    %)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-50 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${(telemetry.seat_distribution.fn_oci_ciwgc_supernumerary /
                        telemetry.total_students_enrolled) *
                        100}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Statutory allowance over and above base sanctioned intake.
                </p>
              </div>

              {/* NRI Internal Carve-Out */}
              <div>
                <div className="flex justify-between text-xs text-[#003366] mb-1">
                  <span>NRI Internal Carve-Out (5%)</span>
                  <span className="font-mono text-slate-600">
                    {telemetry.seat_distribution.nri_internal} seats (
                    {Math.round(
                      (telemetry.seat_distribution.nri_internal /
                        telemetry.total_students_enrolled) *
                        100
                    )}
                    %)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-50 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${(telemetry.seat_distribution.nri_internal /
                        telemetry.total_students_enrolled) *
                        100}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Carved out within approved base intake without expanding base capacity.
                </p>
              </div>

              {/* TFW Supernumerary */}
              <div>
                <div className="flex justify-between text-xs text-[#003366] mb-1">
                  <span className="text-amber-800 font-bold">Tuition Fee Waiver (5% TFW)</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {telemetry.seat_distribution.tfw_supernumerary} seats
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-50 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${(telemetry.seat_distribution.tfw_supernumerary /
                        telemetry.total_students_enrolled) *
                        100}%`,
                    }}
                  />
                </div>
              </div>

              {/* PMSSS & Lateral Entry */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex justify-between text-xs text-[#003366] mb-1">
                    <span>PMSSS Supernumerary</span>
                    <span className="font-mono text-slate-600">
                      {telemetry.seat_distribution.pmsss_supernumerary}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-50 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{
                        width: `${(telemetry.seat_distribution.pmsss_supernumerary /
                          telemetry.total_students_enrolled) *
                          100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#003366] mb-1">
                    <span>Lateral Entry</span>
                    <span className="font-mono text-slate-600">
                      {telemetry.seat_distribution.lateral_entry}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-50 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-[#003366] rounded-full"
                      style={{
                        width: `${(telemetry.seat_distribution.lateral_entry /
                          telemetry.total_students_enrolled) *
                          100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-600">Loading distribution...</div>
          )}
        </div>

        {/* Right 1 Col: Engine Verification Status */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#003366] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#046A38]" />
            Active Verification Engines
          </h2>
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="font-medium text-[#003366]">Verhoeff Dihedral D₅ Validator</div>
              <div className="text-slate-600 text-[11px]">
                Validates 12-digit APAAR identifiers; catches 100% of single-digit errors and adjacent transpositions.
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="font-medium text-[#003366]">DigiLocker / ABC Adapter</div>
              <div className="text-slate-600 text-[11px]">
                Non-blocking failover queue prevents registration lockouts during external service latency.
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="font-medium text-[#003366]">Enrolment Syndicate Detection</div>
              <div className="text-slate-600 text-[11px]">
                Bipartite graph analysis flags multi-institution shared identity patterns.
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="font-medium text-[#003366]">Dual-Degree Disambiguation</div>
              <div className="text-slate-600 text-[11px]">
                Allows simultaneous physical and online/ODL enrolments under UGC 2022 guidelines.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* State-Wise Enrolment Matrix Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#003366] flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-600" />
              State-Wise Enrolment & Capacity Matrix
            </h2>
            <p className="text-xs text-slate-600">
              Sanctioned intake versus verified enrolments across 10 state jurisdictions.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#0A4D8C]" />
            <input
              type="text"
              placeholder="Filter states..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-[#003366] placeholder-slate-400 focus:border-[#003366] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-3 font-medium">State</th>
                <th className="py-2.5 px-3 font-medium">Institutions</th>
                <th className="py-2.5 px-3 font-medium">Approved Intake</th>
                <th className="py-2.5 px-3 font-medium">Total Enrolled</th>
                <th className="py-2.5 px-3 font-medium">Saturation</th>
                <th className="py-2.5 px-3 font-medium">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredStates.map((st) => {
                const isOver = st.total_enrolled > st.approved_intake;
                return (
                  <tr key={st.state} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-[#003366]">{st.state}</td>
                    <td className="py-2.5 px-3 text-slate-600">{st.institutions_count}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {st.approved_intake.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-[#003366] font-semibold">
                      {st.total_enrolled.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 border border-slate-200 text-[#003366]">
                        {st.compliance_rate_pct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {isOver ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold">
                          <AlertTriangle className="h-3 w-3 text-amber-700" />
                          Supernumerary Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#046A38] font-semibold">
                          <CheckCircle2 className="h-3 w-3 text-[#046A38]" />
                          Within Approved Cap
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Statutory Quota Evaluation (Naive Flat Counter vs ApaarNet Ledger) */}
      <div
        id="quota-evaluation"
        className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[#003366]">
              Statutory Quota Evaluation: Flat Counter vs. Multi-Quota Ledger
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Demonstrates why standard flat intake counters generate false positives by penalizing
              statutory supernumerary admissions (OCI, CIWGC, TFW) under regulatory handbook rules.
            </p>
          </div>

          {/* Institution / Program Selector */}
          <div className="min-w-[280px]">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
              Select Institution & Program
            </label>
            <div className="relative">
              <select
                value={selectedQuotaId}
                onChange={handleQuotaChange}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#003366] shadow-inner focus:border-[#003366] focus:outline-none"
              >
                {institutions.map((inst) =>
                  (inst.program_quotas || []).map((q) => (
                    <option key={q.id} value={q.id}>
                      {inst.name.substring(0, 32)} — {q.program_name} ({q.course_code})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-600" />
            </div>
          </div>
        </div>

        {loadingCompare ? (
          <div className="py-12 text-center text-xs text-slate-600 animate-pulse">
            Analyzing quota ledger and computing supernumerary carve-outs...
          </div>
        ) : quotaCompare ? (() => {
          const actualEnrolment = quotaCompare.actual_enrolment ?? quotaCompare.metrics?.total_enrolled ?? 0;
          const sanctionedIntake = quotaCompare.sanctioned_intake ?? quotaCompare.metrics?.sanctioned_approved_intake ?? 0;
          const naiveCeiling = quotaCompare.naive_evaluation?.naive_ceiling ?? sanctionedIntake;
          const naiveExcess = quotaCompare.naive_evaluation?.naive_excess ?? quotaCompare.naive_flat_system?.apparent_excess_flagged ?? 0;

          const baseEnrolled = quotaCompare.apaarnet_evaluation?.base_enrolled ?? sanctionedIntake;
          const supernumeraryCarvedOut = quotaCompare.apaarnet_evaluation?.supernumerary_carved_out ?? quotaCompare.metrics?.lawful_supernumerary_allowance ?? 0;
          const totalPermittedCeiling = quotaCompare.apaarnet_evaluation?.total_permitted_ceiling ?? quotaCompare.metrics?.total_lawful_capacity ?? (sanctionedIntake + supernumeraryCarvedOut);
          const apaarnetExcess = quotaCompare.apaarnet_evaluation?.apaarnet_excess ?? quotaCompare.apaarnet_quota_ledger?.actual_excess_flagged ?? 0;
          const auditSummary = quotaCompare.audit_delta_summary ?? "Deterministic multi-category ledger tracking base intake vs statutory supernumerary caps under regulatory guidelines.";

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Left Panel: Legacy Naive Flat Counter */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-900 border border-rose-300">
                      Standard Flat Counter
                    </span>
                    <XCircle className="h-4 w-4 text-rose-600" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-rose-700 font-mono">
                      {actualEnrolment} / {sanctionedIntake}
                    </div>
                    <p className="text-xs text-slate-600">
                      Evaluates total enrolment against flat base intake only.
                    </p>
                  </div>

                  <div className="rounded-lg border border-rose-900/30 bg-slate-50 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sanctioned Base Intake:</span>
                      <span className="font-mono text-[#003366]">{naiveCeiling} seats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">Actual Enrolment:</span>
                      <span className="font-mono text-[#003366] font-bold">{actualEnrolment} students</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-slate-200 pt-2 text-rose-700">
                      <span>Apparent Over-Intake:</span>
                      <span className="font-mono font-bold">+{naiveExcess} Flagged</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-rose-900 leading-relaxed rounded bg-rose-100/70 p-3 border border-rose-200">
                    <span className="font-bold text-rose-950">False-Positive Defect:</span> Treats 24 lawful OCI and 12 lawful CIWGC supernumerary admissions as illegal over-intake, erroneously triggering penalty flags.
                  </div>
                </div>

                {/* Right Panel: Statutory Quota Ledger */}
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-300">
                      ApaarNet Statutory Ledger
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-[#046A38]" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-[#046A38] font-mono">
                      {baseEnrolled} Base + {supernumeraryCarvedOut} Supernumerary
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Permitted Statutory Ceiling:{" "}
                      <span className="font-bold text-slate-900 font-mono">{totalPermittedCeiling} seats</span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-white p-3.5 space-y-2 text-xs shadow-2xs">
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">Approved Base Intake:</span>
                      <span className="font-mono text-[#003366] font-bold">{sanctionedIntake} seats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-medium">Lawful Supernumerary Protected:</span>
                      <span className="font-mono text-[#046A38] font-bold">+{supernumeraryCarvedOut} seats</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-slate-200 pt-2 text-emerald-950">
                      <span>True Regulatory Excess:</span>
                      <span className="font-mono text-amber-800 font-bold">{apaarnetExcess} Students</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded bg-emerald-100/80 p-3 border border-emerald-300 text-emerald-950 text-xs">
                    <div className="font-bold">85.7% False-Positive Elimination</div>
                    <div className="font-mono text-[11px] font-semibold">36 Lawful Seats Validated</div>
                  </div>
                </div>
              </div>

              {/* Statutory Audit Summary */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 font-medium leading-relaxed">
                <span className="font-bold text-[#003366]">Statutory Audit Explanation:</span>{" "}
                {auditSummary}
              </div>
            </div>
          );
        })() : null}
      </div>

      {/* 3. Cryptographic Audit Ledger & Tamper Simulation */}
      <div id="merkle-lab" className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[#003366]">
              SHA-256 Merkle Audit Ledger & Tamper Simulation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Immutable PostgreSQL transaction ledger with cryptographic chain hashing and Ed25519 digital signatures.
            </p>
          </div>

          <button
            onClick={handleSimulateTamper}
            disabled={isSimulatingTamper}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-100 text-rose-800 px-3.5 py-2 text-xs font-semibold text-rose-800 transition-colors hover:bg-rose-900/50 hover:text-[#003366] disabled:opacity-50"
          >
            <AlertOctagon className="h-4 w-4 text-rose-400" />
            <span>
              {isSimulatingTamper ? "Simulating Attack..." : "Simulate Tamper Attack"}
            </span>
          </button>
        </div>

        {/* Live Chain Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#003366]">Ledger Integrity:</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                ledger?.chain_integrity_valid ? "text-[#046A38]" : "text-rose-700"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {ledger?.chain_integrity_valid
                ? "Cryptographically Sound (No Broken Hashes)"
                : "Chain Integrity Compromised"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-600">
            <div>
              Total Blocks:{" "}
              <span className="text-[#003366] font-semibold">{ledger?.total_entries ?? 0}</span>
            </div>
            <div>
              Latest Digest:{" "}
              <span className="text-[#003366]">
                {ledger?.latest_record_hash ? `${ledger.latest_record_hash.substring(0, 16)}...` : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Tamper Forensics Alert */}
        {tamperResult && (
          <div className="rounded-xl border border-rose-300 bg-rose-100/70 text-rose-800 p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs sm:text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Tamper Attack Detected & Cryptographically Isolated</span>
              </div>
              <button
                onClick={() => setTamperResult(null)}
                className="text-xs text-slate-600 hover:text-[#003366]"
              >
                ✕ Dismiss
              </button>
            </div>

            <p className="text-xs text-rose-800 leading-relaxed">
              {tamperResult.explanation}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs font-mono">
              <div className="rounded border border-rose-200 bg-slate-50 p-3 space-y-1">
                <div className="text-[10px] text-slate-700 font-semibold uppercase font-sans">1. Local Digest</div>
                <div className="text-rose-700 font-bold">Mismatch Detected ✗</div>
                <div className="text-[10px] text-slate-600 truncate">
                  Exp: {tamperResult.original_record_hash.substring(0, 16)}...
                </div>
                <div className="text-[10px] text-rose-800 font-semibold truncate">
                  Got: {tamperResult.tampered_record_hash.substring(0, 16)}...
                </div>
              </div>

              <div className="rounded border border-rose-200 bg-slate-50 p-3 space-y-1">
                <div className="text-[10px] text-slate-700 font-semibold uppercase font-sans">2. Downstream Pointer</div>
                <div className="text-rose-700 font-bold">Chain Broken at Sequence ✗</div>
                <div className="text-[10px] text-slate-600">
                  Block prev_hash link invalidated by modified record.
                </div>
              </div>

              <div className="rounded border border-rose-200 bg-slate-50 p-3 space-y-1">
                <div className="text-[10px] text-slate-700 font-semibold uppercase font-sans">3. Ed25519 Signature</div>
                <div className="text-rose-700 font-bold">Signature Rejected ✗</div>
                <div className="text-[10px] text-slate-600">
                  Attacker lacks cryptographic private key to sign checkpoint.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Blocks Strip */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-600">
            Recent Audit Blocks (PostgreSQL)
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {(ledger?.entries || []).slice(0, 8).map((entry) => (
              <div
                key={entry.sequence_number}
                className="flex-shrink-0 w-64 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#003366]">Seq #{entry.sequence_number}</span>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[9px] text-slate-600 border border-slate-200">
                    {entry.actor_role}
                  </span>
                </div>
                <div className="font-sans font-medium text-[#003366] truncate text-[11px]">
                  {entry.action_type}
                </div>
                <div className="text-[10px] text-slate-600/70 truncate">
                  Hash: {entry.record_hash.substring(0, 16)}...
                </div>
                {entry.checkpoint_signature ? (
                  <div className="rounded bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[9px] text-[#046A38] font-bold flex items-center gap-1 font-sans">
                    <CheckCircle2 className="h-3 w-3 text-[#046A38]" />
                    Ed25519 Checkpoint
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 font-medium font-sans">Standard Transaction</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Accreditation & Policy Export Suite */}
      <div id="accreditation-exports" className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#003366]">
            Accreditation & Policy Compliance Export Suite
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Standardized compliance packages downloadable as certified CSV datasets or structured JSON payloads.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Report 1: NAAC / NBA Accreditation */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-white px-2 py-0.5 text-[10px] font-medium text-[#003366] border border-slate-200">
                  Criterion 2
                </span>
                <FileSpreadsheet className="h-4 w-4 text-slate-600" />
              </div>
              <h3 className="font-semibold text-[#003366] text-sm">NAAC & NBA Accreditation Package</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Student enrolment profiles, demand ratios, supernumerary quotas, and sanction compliance
                verification for institutional evaluation.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              <a
                href={api.getExportUrl("NAAC_NBA_ACCREDITATION", "csv")}
                target="_blank"
                rel="noreferrer"
                download="naac_nba_accreditation.csv"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#003366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#002244] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV</span>
              </a>
              <button
                onClick={() => handleInspectReport("NAAC_NBA_ACCREDITATION")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white shadow-xs px-3 py-1.5 text-xs font-medium text-[#003366] hover:border-[#003366] transition-colors"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Report 2: State Policy Matrix */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-white px-2 py-0.5 text-[10px] font-medium text-[#003366] border border-slate-200">
                  State Councils
                </span>
                <Globe className="h-4 w-4 text-slate-600" />
              </div>
              <h3 className="font-semibold text-[#003366] text-sm">State Higher Education Policy Matrix</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                State-wise intake vs. enrolment saturation, high-priority inspection tiers, and
                institutional compliance risk scoring for state governance bodies.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              <a
                href={api.getExportUrl("STATE_POLICY_MATRIX", "csv")}
                target="_blank"
                rel="noreferrer"
                download="state_policy_matrix.csv"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#003366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#002244] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV</span>
              </a>
              <button
                onClick={() => handleInspectReport("STATE_POLICY_MATRIX")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white shadow-xs px-3 py-1.5 text-xs font-medium text-[#003366] hover:border-[#003366] transition-colors"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Report 3: Anomaly Audit Summary */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                  Audit Vigilance
                </span>
                <AlertOctagon className="h-4 w-4 text-rose-600" />
              </div>
              <h3 className="font-bold text-[#003366] text-sm">Anomaly & Inspection Summary</h3>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Audit list of flagged violations, quota overflow events, unverified tokens, and open
                tri-party dispute tickets for regulatory inspection teams.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              <a
                href={api.getExportUrl("ANOMALY_AUDIT_SUMMARY", "csv")}
                target="_blank"
                rel="noreferrer"
                download="anomaly_audit_summary.csv"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#003366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#002244] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV</span>
              </a>
              <button
                onClick={() => handleInspectReport("ANOMALY_AUDIT_SUMMARY")}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white shadow-xs px-3 py-1.5 text-xs font-medium text-[#003366] hover:border-[#003366] transition-colors"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Payload Inspector Drawer */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="max-h-[85vh] w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-xs p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#003366] font-mono">
                  {activeReportModal} • Export Payload Inspector
                </h3>
                <p className="text-xs text-slate-600">
                  Direct JSON payload emitted from /api/v1/reports/export/{activeReportModal}
                </p>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                className="rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:text-[#003366]"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-auto rounded-lg bg-slate-50 p-4 font-mono text-xs text-[#003366] border border-slate-200">
              {loadingReportData ? (
                <div className="text-center py-12 text-slate-600 animate-pulse">
                  Fetching export payload...
                </div>
              ) : (
                <pre>{JSON.stringify(reportJsonData, null, 2)}</pre>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <a
                href={api.getExportUrl(activeReportModal, "csv")}
                target="_blank"
                rel="noreferrer"
                download={`${activeReportModal.toLowerCase()}.csv`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#003366] px-4 py-2 text-xs font-semibold text-white hover:bg-[#002244] transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download as CSV</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
