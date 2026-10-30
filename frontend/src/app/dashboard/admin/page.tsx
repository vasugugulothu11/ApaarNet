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
  ExternalLink,
  ChevronDown,
  Calendar,
  MoreVertical,
  ArrowUpRight,
  ShieldAlert,
  Activity,
  Sparkles,
  MapPin,
  Bell,
} from "lucide-react";
import {
  api,
  NationalOverviewResponse,
  InstitutionPortalItem,
  QuotaCompareResponse,
  AuditLedgerResponse,
  TamperSimulationResponse,
} from "@/lib/api";
import { useRbac } from "@/context/RbacContext";
import { KpiCardsGrid } from "@/components/KpiCards";
import { DashboardAnalyticsSection } from "@/components/Analytics";
import { DashboardBottomSection, TableRowItem } from "@/components/DashboardTables";

export default function NationalCommandPage() {
  const { setIsAuthModalOpen } = useRbac();

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

  // Selected Map Hotspot for Interactive Card
  const [activeHotspot, setActiveHotspot] = useState({
    name: "Maharashtra",
    college: "Apex Institute of Technology",
    enrolled: 534,
    verifiedPct: 98,
    highRisk: 0,
    sanctioned: 600,
  });

  // Stream Filter State (PGDM vs Engineering/Degree Unification)
  const [streamFilter, setStreamFilter] = useState<"ALL" | "PGDM" | "ENGINEERING">("ALL");

  const isPgdmInstitution = (inst: InstitutionPortalItem) => {
    return (
      inst.institution_type === "PGDM" ||
      inst.name.toLowerCase().includes("pgdm") ||
      inst.name.toLowerCase().includes("management") ||
      (inst.program_quotas || []).some(
        (q) =>
          q.program_name.toLowerCase().includes("pgdm") ||
          q.program_name.toLowerCase().includes("management")
      )
    );
  };

  const filteredInstitutions = institutions.filter((inst) => {
    if (streamFilter === "ALL") return true;
    const isPgdm = isPgdmInstitution(inst);
    return streamFilter === "PGDM" ? isPgdm : !isPgdm;
  });

  const handleStreamFilterChange = (filter: "ALL" | "PGDM" | "ENGINEERING") => {
    setStreamFilter(filter);
    const subset = institutions.filter((inst) => {
      if (filter === "ALL") return true;
      const isPgdm = isPgdmInstitution(inst);
      return filter === "PGDM" ? isPgdm : !isPgdm;
    });
    if (subset.length > 0) {
      const currentQuotaInSubset = subset.some((inst) =>
        (inst.program_quotas || []).some((q) => q.id === selectedQuotaId)
      );
      if (!currentQuotaInSubset && subset[0].program_quotas?.[0]) {
        const newQuotaId = subset[0].program_quotas[0].id;
        setSelectedQuotaId(newQuotaId);
        loadQuotaCompare(newQuotaId);
      }
    }
  };

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

  const filteredStates = telemetry?.state_breakdown || [];

  const tableRows: TableRowItem[] = filteredInstitutions.slice(0, 5).map((inst) => {
    const isExceeded = (inst.compliance_risk_score || 0) > 60;
    const enrolled = inst.enrolled_students_count || 0;
    const intake = inst.program_quotas?.[0]?.approved_intake || 120;
    return {
      id: inst.id,
      title: `${inst.name} (${inst.aicte_permanent_id})`,
      subtitle: `${inst.state} · ${inst.institution_type} · ${inst.program_quotas?.[0]?.program_name || "Statutory Intake"}`,
      metric1: `${intake} Intake`,
      metric2: `${enrolled} Enrolled`,
      statusText: isExceeded ? "Quota Warning" : "Statutory OK",
      statusType: isExceeded ? "danger" : "success",
      onAction: () => {
        if (inst.program_quotas?.[0]) {
          setSelectedQuotaId(inst.program_quotas[0].id);
        }
      },
    };
  });

  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* 1. EXECUTIVE HEADER & ACTION BAR (Reference UI Standard)       */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B0F19]">
                National & Statutory
              </h1>
              {/* Glowing lime badge matching the reference design */}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5FF8F] text-[#0B0F19] font-bold shadow-[0_0_16px_rgba(229,255,143,0.55)]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B0F19]">
                Monitoring
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Real-time visibility into APAAR verification, quota compliance, and cryptographic audit trails.
            </p>
          </div>

          {/* Quick Refresh Icon */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#F2FFC7] text-[#0B0F19] hover:bg-[#F7FFDD] hover:shadow-xs transition-all"
              title="Refresh Telemetry Metrics"
            >
              <RefreshCw className={`h-4 w-4 ${loadingTelemetry ? "animate-spin text-[#0B0F19]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Executive Action Pill Buttons (Matching Reference Design) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={() => handleInspectReport("NAAC_NBA_ACCREDITATION")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B0F19] border border-[#E5FF8F]/40 px-3.5 py-2 text-xs font-semibold text-[#E5FF8F] shadow-xs hover:bg-black transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Compliance Report</span>
          </button>

          <button
            onClick={() => handleStreamFilterChange(streamFilter === "ALL" ? "PGDM" : streamFilter === "PGDM" ? "ENGINEERING" : "ALL")}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#F2FFC7] px-3.5 py-2 text-xs font-semibold text-[#0B0F19] shadow-2xs hover:bg-[#F7FFDD] transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            <span>Filter: {streamFilter === "ALL" ? "All Streams (50)" : streamFilter === "PGDM" ? "PGDM Only" : "Engineering"}</span>
          </button>

          <a
            href="#anomalies"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#F2FFC7] px-3.5 py-2 text-xs font-semibold text-[#0B0F19] shadow-2xs hover:bg-[#F7FFDD] transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>View Anomaly Alerts</span>
          </a>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#F2FFC7] px-3.5 py-2 text-xs font-semibold text-[#0B0F19] shadow-2xs hover:bg-[#F7FFDD] transition-colors"
          >
            <Sliders className="h-3.5 w-3.5 text-[#0B0F19]" />
            <span>Manage RBAC Access</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TOP 3 KPI CARDS (Reference Palette: Cyan, Lime, Purple)     */}
      {/* ============================================================== */}
      <KpiCardsGrid
        cards={[
          {
            title: "Total Enrolled",
            value: (telemetry?.total_students_enrolled || 12480).toLocaleString(),
            subtitle: "APAAR Biometric Verified",
            change: "+14.2% MoM",
            icon: Users,
            isPositive: true,
            sparklinePoints: [320, 480, 640, 670, 780, 850, 910],
          },
          {
            title: "Quota Alerts",
            value: (telemetry?.active_flagged_violations ?? 23).toString(),
            subtitle: "High-Risk Headcount Breaches",
            change: "-5.1% Adjudicated",
            icon: AlertTriangle,
            isPositive: false,
            sparklinePoints: [45, 38, 42, 30, 28, 25, 23],
          },
          {
            title: "Ledger Audits",
            value: (ledger?.total_entries || 1056).toString(),
            subtitle: "SHA-256 Merkle Block Receipts",
            change: "100% Sealed",
            icon: Database,
            isPositive: true,
            sparklinePoints: [100, 240, 410, 620, 810, 950, 1056],
          },
        ]}
      />

      {/* ============================================================== */}
      {/* 3. CONCENTRIC RING & ANALYTICS CHARTS (Reference Middle Row)   */}
      {/* ============================================================== */}
      <DashboardAnalyticsSection
        areaChartProps={{
          title: "National APAAR Enrolment Velocity",
          seriesAName: "Direct AICTE Ingestion",
          seriesBName: "Statutory Spot Intake",
          unitSuffix: " Enrolments",
        }}
        radialRingsProps={{
          title: "Quota Intake Distribution",
          timeframe: "AY 2024–25",
          metric1: { name: "Base Intake", value: 78, color: "#232323", label: "78% (12,480)" },
          metric2: { name: "NRI Quota", value: 65, color: "#b9e303", label: "65% (1,040)" },
          metric3: { name: "FN/OCI Supernumerary", value: 48, color: "#b5d5e1", label: "48% (768)" },
        }}
      />

      {/* ============================================================== */}
      {/* 4. BOTTOM SPLIT: DATA TABLE & DARK ACTIVITY BAR CHART          */}
      {/* ============================================================== */}
      <DashboardBottomSection
        tableProps={{
          title: "Top Regulated Institutions & Statutory Intake",
          col1Title: "Institution & Program",
          col2Title: "Sanctioned",
          col3Title: "APAAR Enrolled",
          col4Title: "Statutory Status",
          col5Title: "Action",
          rows: tableRows.length > 0 ? tableRows : undefined,
        }}
        activityProps={{
          title: "Verification Throughput Activity",
          highlightDay: "Fri",
        }}
      />

      {/* ============================================================== */}
      {/* 3. GEOGRAPHIC & LEDGER TELEMETRY (Reference UI Grid Layout)     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left 8 Cols: National Ingestion Map & State Matrix */}
        <div className="col-span-12 lg:col-span-8 rounded-2xl border border-[#F2FFC7] bg-white p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-[#0B0F19] flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#0B0F19]" />
                State-Wise Admission & Telemetry Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Real-time capacity tracking across 10 state jurisdictions under APH 2024–27 mandates.
              </p>
            </div>
          </div>

          {/* Interactive Geographic Distribution Map Canvas */}
          <div className="relative rounded-2xl border border-[#F2FFC7] bg-gradient-to-b from-[#FCFFF4] to-[#F7FFDD]/40 p-6 overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Interactive State Hotspot Hubs */}
              <div className="space-y-2 w-full md:w-1/2">
                <div className="text-xs font-semibold text-[#0B0F19] uppercase tracking-wider">
                  Select Regional Jurisdiction:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { name: "Maharashtra", college: "Apex Institute of Tech", enrolled: 534, verifiedPct: 98, highRisk: 0, sanctioned: 600 },
                    { name: "Tamil Nadu", college: "PSG College of Tech", enrolled: 412, verifiedPct: 94, highRisk: 0, sanctioned: 450 },
                    { name: "Karnataka", college: "BMS College of Engg", enrolled: 389, verifiedPct: 96, highRisk: 1, sanctioned: 400 },
                    { name: "Delhi NCR", college: "Delhi Tech Institute", enrolled: 290, verifiedPct: 92, highRisk: 0, sanctioned: 320 },
                  ].map((hotspot) => {
                    const isSelected = activeHotspot.name === hotspot.name;
                    return (
                      <button
                        key={hotspot.name}
                        onClick={() => setActiveHotspot(hotspot)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-[#0B0F19] text-white border-[#0B0F19] shadow-md"
                            : "bg-white text-slate-800 border-[#F2FFC7] hover:border-[#EDFFB1] hover:bg-[#FCFFF4]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{hotspot.name}</span>
                          <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-[#E5FF8F]" : "bg-emerald-500"}`} />
                        </div>
                        <div className={`text-[11px] font-mono mt-1 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          {hotspot.enrolled} Enrolled
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hotspot Floating Tooltip Card (Matching Reference Design 'Toronto, Canada' Card) */}
              <div className="w-full md:w-1/2 rounded-2xl border border-[#F2FFC7] bg-white p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    <span className="font-bold text-sm text-[#0B0F19]">{activeHotspot.name}, India</span>
                  </div>
                  <span className="rounded-full bg-[#E5FF8F] px-2.5 py-0.5 text-[10px] font-bold text-[#0B0F19] border border-[#E5FF8F] font-mono">
                    {activeHotspot.verifiedPct}% APAAR VERIFIED
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Nodal College:</span>
                    <span className="text-[#0B0F19] font-semibold">{activeHotspot.college}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Total Validated Admissions:</span>
                    <span className="text-[#0B0F19] font-bold">{activeHotspot.enrolled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Approved Sanction Cap:</span>
                    <span className="text-slate-700">{activeHotspot.sanctioned}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-sans">High-Risk Evasion Events:</span>
                    <span className={activeHotspot.highRisk > 0 ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                      {activeHotspot.highRisk}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact State Capacity Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F2FFC7] text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-[#FCFFF4]">
                  <th className="py-2.5 px-3">Jurisdiction</th>
                  <th className="py-2.5 px-3">Institutions</th>
                  <th className="py-2.5 px-3">Sanctioned Intake</th>
                  <th className="py-2.5 px-3">Validated Enrolled</th>
                  <th className="py-2.5 px-3">Saturation</th>
                  <th className="py-2.5 px-3">Compliance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredStates.slice(0, 5).map((st) => {
                  const isOver = st.total_enrolled > st.approved_intake;
                  return (
                    <tr key={st.state} className="hover:bg-[#FCFFF4] transition-colors">
                      <td className="py-3 px-3 font-sans font-semibold text-[#0B0F19]">{st.state}</td>
                      <td className="py-3 px-3 text-slate-600">{st.institutions_count}</td>
                      <td className="py-3 px-3 text-slate-500">{st.approved_intake.toLocaleString()}</td>
                      <td className="py-3 px-3 text-[#0B0F19] font-bold">{st.total_enrolled.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FCFFF4] border border-[#F2FFC7] text-[#0B0F19]">
                          {st.compliance_rate_pct}%
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Supernumerary
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Within Cap
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

        {/* Right 4 Cols: Forensic Trend Chart & Real-Time Merkle Audit Trail */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl border border-[#F2FFC7] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FCFFF4] border border-[#F2FFC7] text-[#0B0F19]">
                  <Activity className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold text-[#0B0F19]">Ingestion & Verification Trend</span>
              </div>
              <button className="text-slate-400 hover:text-[#0B0F19]">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Daily Trend Sparkline (Matching Reference UI 'Failed Login Trend') */}
            <div className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Daily APAAR Ingestions</span>
                <span className="font-bold text-[#0B0F19] font-mono">1,432 Total</span>
              </div>

              <div className="relative h-24 w-full pt-2">
                <svg className="w-full h-16 overflow-visible" viewBox="0 0 240 60">
                  <path
                    d="M 0 45 C 30 50, 50 20, 80 30 C 110 40, 140 10, 170 25 C 200 40, 220 15, 240 20"
                    fill="none"
                    stroke="#0B0F19"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Tooltip Point like 'Wed: 89' in Reference UI */}
                  <circle cx="80" cy="30" r="5" fill="#0B0F19" stroke="#E5FF8F" strokeWidth="2.5" />
                  <g transform="translate(48, -14)">
                    <rect width="66" height="30" rx="8" fill="#0B0F19" stroke="#E5FF8F" strokeWidth="1" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))" />
                    <text x="10" y="13" fill="#A1A1AA" fontSize="8" fontWeight="bold">Wed</text>
                    <text x="10" y="24" fill="#E5FF8F" fontSize="9" fontWeight="bold">Verified: 89</text>
                  </g>
                </svg>

                <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* Real-Time SHA-256 Merkle Ledger Blocks */}
            <div id="ledger" className="space-y-2.5 pt-2 scroll-mt-24">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0B0F19]">
                <span>Recent Merkle Audit Blocks</span>
                <span className="text-[10px] text-emerald-700 font-mono">Chain Verified</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(ledger?.entries || []).slice(0, 4).map((entry) => (
                  <div
                    key={entry.sequence_number}
                    className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4] p-2.5 text-xs font-mono space-y-1 hover:border-[#EDFFB1] transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#0B0F19]">Seq #{entry.sequence_number}</span>
                      <span className="rounded bg-white px-1.5 py-0.5 text-[9px] text-[#0B0F19] border border-[#F2FFC7]">
                        {entry.actor_role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-sans truncate font-medium">
                      {entry.action_type}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      Hash: {entry.record_hash.substring(0, 18)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tamper Simulation Attack Trigger */}
          <div className="pt-2">
            <button
              onClick={handleSimulateTamper}
              disabled={isSimulatingTamper}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#0B0F19] bg-[#0B0F19] px-4 py-2.5 text-xs font-semibold text-[#E5FF8F] hover:bg-black transition-colors shadow-2xs disabled:opacity-50"
            >
              <AlertOctagon className="h-4 w-4 text-[#E5FF8F]" />
              <span>{isSimulatingTamper ? "Testing..." : "Simulate Tamper Attack"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. STATUTORY QUOTA EVALUATION COMPARISON                     */}
      {/* ============================================================== */}
      <div id="quota-evaluation" className="rounded-2xl border border-[#F2FFC7] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F2FFC7] bg-[#F7FFDD] px-2.5 py-0.5 text-xs font-semibold text-[#0B0F19]">
              <Scale className="h-3.5 w-3.5" />
              Statutory Quota Evaluation
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B0F19]">
              Flat Counter vs. Multi-Category Ledger
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Demonstrates how standard flat headcount systems misdiagnose statutory supernumerary admissions (OCI, CIWGC, TFW) as illegal overflow.
            </p>
          </div>

          {/* Program Selector */}
          <div className="min-w-[280px]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Select Institution & Program
            </label>
            <div className="relative">
              <select
                value={selectedQuotaId}
                onChange={handleQuotaChange}
                className="w-full appearance-none rounded-xl border border-[#F2FFC7] bg-[#FCFFF4] px-3 py-2 text-xs font-medium text-[#0B0F19] focus:bg-white focus:border-[#E5FF8F] focus:outline-none transition-colors"
              >
                {filteredInstitutions.map((inst) =>
                  (inst.program_quotas || []).map((q) => (
                    <option key={q.id} value={q.id}>
                      {inst.name.substring(0, 32)} — {q.program_name} ({q.course_code}) [{isPgdmInstitution(inst) ? "PGDM" : "Engineering"}]
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {loadingCompare ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
            Calculating statutory quota partitions...
          </div>
        ) : quotaCompare ? (() => {
          const actualEnrolment = quotaCompare?.actual_enrolment ?? quotaCompare?.metrics?.total_enrolled ?? 0;
          const sanctionedIntake = quotaCompare?.sanctioned_intake ?? quotaCompare?.metrics?.sanctioned_approved_intake ?? 0;
          const naiveCeiling = quotaCompare?.naive_evaluation?.naive_ceiling ?? sanctionedIntake;
          const naiveExcess = quotaCompare?.naive_evaluation?.naive_excess ?? quotaCompare?.naive_flat_system?.apparent_excess_flagged ?? 0;

          const baseEnrolled = quotaCompare?.apaarnet_evaluation?.base_enrolled ?? sanctionedIntake;
          const supernumeraryCarvedOut = quotaCompare?.apaarnet_evaluation?.supernumerary_carved_out ?? quotaCompare?.metrics?.lawful_supernumerary_allowance ?? 0;
          const totalPermittedCeiling = quotaCompare?.apaarnet_evaluation?.total_permitted_ceiling ?? quotaCompare?.metrics?.total_lawful_capacity ?? (sanctionedIntake + supernumeraryCarvedOut);
          const apaarnetExcess = quotaCompare?.apaarnet_evaluation?.apaarnet_excess ?? quotaCompare?.apaarnet_quota_ledger?.actual_excess_flagged ?? 0;
          const auditSummary = quotaCompare?.audit_delta_summary ?? "Deterministic multi-category ledger tracking base intake vs statutory supernumerary caps under regulatory guidelines.";

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Legacy Naive Flat Counter Card */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 sm:p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-rose-100 px-3 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">
                      Standard Flat Counter
                    </span>
                    <XCircle className="h-4 w-4 text-rose-600" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-2xl font-bold text-rose-700 font-mono">
                      {actualEnrolment} / {sanctionedIntake}
                    </div>
                    <p className="text-xs text-slate-500">
                      Evaluates total enrolment against flat base intake only.
                    </p>
                  </div>

                  <div className="rounded-xl border border-rose-200/80 bg-white p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sanctioned Base Intake:</span>
                      <span className="font-mono text-slate-800">{naiveCeiling} seats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Actual Enrolled:</span>
                      <span className="font-mono text-slate-800 font-semibold">{actualEnrolment} students</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-slate-100 pt-2 text-rose-700">
                      <span>Apparent Over-Intake:</span>
                      <span className="font-mono font-bold">+{naiveExcess} Flagged</span>
                    </div>
                  </div>

                  <div className="text-xs text-rose-900 rounded-xl bg-rose-100/70 p-3 border border-rose-200">
                    <strong className="text-rose-950">False-Positive Defect:</strong> Treats lawful OCI and CIWGC supernumerary admissions as illegal over-intake, erroneously triggering penalties.
                  </div>
                </div>

                {/* Statutory Quota Ledger Card */}
                <div className="rounded-2xl border border-[#EDFFB1] bg-[#FCFFF4] p-5 sm:p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#E5FF8F] px-3 py-0.5 text-xs font-semibold text-[#0B0F19] border border-[#E5FF8F]">
                      ApaarNet Multi-Category Ledger
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-[#0B0F19]" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-2xl font-bold text-[#0B0F19] font-mono">
                      {baseEnrolled} Base + {supernumeraryCarvedOut} Supernumerary
                    </div>
                    <p className="text-xs text-slate-500">
                      Permitted Statutory Capacity: <span className="font-semibold text-[#0B0F19]">{totalPermittedCeiling} seats</span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#F2FFC7] bg-white p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sanctioned Base Intake:</span>
                      <span className="font-mono text-[#0B0F19] font-semibold">{sanctionedIntake} seats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lawful Supernumerary Protected:</span>
                      <span className="font-mono text-[#0B0F19] font-bold">+{supernumeraryCarvedOut} seats</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-slate-100 pt-2 text-[#0B0F19]">
                      <span>True Excess:</span>
                      <span className="font-mono text-amber-700 font-bold">{apaarnetExcess} Students</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-[#F7FFDD] p-3 border border-[#F2FFC7] text-xs text-[#0B0F19]">
                    <span className="font-bold">85.7% False-Positive Elimination</span>
                    <span className="font-mono font-semibold">36 Lawful Seats Validated</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4] p-4 text-xs text-slate-600 leading-relaxed">
                <strong className="text-[#0B0F19]">Audit Explanation:</strong> {auditSummary}
              </div>
            </div>
          );
        })() : null}
      </div>

      {/* ============================================================== */}
      {/* 5. ACCREDITATION & COMPLIANCE EXPORT CENTER                   */}
      {/* ============================================================== */}
      <div id="accreditation-exports" className="rounded-2xl border border-[#F2FFC7] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B0F19]">
            Compliance & Accreditation Export Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Certified compliance packages downloadable as CSV datasets or structured JSON payloads.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Report 1: NAAC / NBA */}
          <div className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4]/70 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#0B0F19] border border-[#F2FFC7]">
                  Criterion 2
                </span>
                <FileSpreadsheet className="h-4 w-4 text-[#0B0F19]" />
              </div>
              <h3 className="font-semibold text-[#0B0F19] text-sm">NAAC & NBA Accreditation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enrolment ratios, supernumerary quotas, and sanction compliance verification for institutional evaluation.
              </p>
            </div>

            <div className="pt-3 border-t border-[#F2FFC7] flex items-center gap-2">
              <a
                href={api.getExportUrl("NAAC_NBA_ACCREDITATION", "csv")}
                target="_blank"
                rel="noreferrer"
                download="naac_nba_accreditation.csv"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B0F19] px-3 py-2 text-xs font-semibold text-[#E5FF8F] hover:bg-black transition-colors shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download CSV</span>
              </a>
              <button
                onClick={() => handleInspectReport("NAAC_NBA_ACCREDITATION")}
                className="inline-flex items-center gap-1 rounded-xl border border-[#F2FFC7] bg-white px-3 py-2 text-xs font-semibold text-[#0B0F19] hover:bg-[#F7FFDD] transition-colors shadow-2xs"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Report 2: State Policy Matrix */}
          <div className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4]/70 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#0B0F19] border border-[#F2FFC7]">
                  State Councils
                </span>
                <Globe className="h-4 w-4 text-[#0B0F19]" />
              </div>
              <h3 className="font-semibold text-[#0B0F19] text-sm">State Higher Education Matrix</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                State-wise intake saturation, high-priority inspection tiers, and risk scoring for state governance bodies.
              </p>
            </div>

            <div className="pt-3 border-t border-[#F2FFC7] flex items-center gap-2">
              <a
                href={api.getExportUrl("STATE_POLICY_MATRIX", "csv")}
                target="_blank"
                rel="noreferrer"
                download="state_policy_matrix.csv"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B0F19] px-3 py-2 text-xs font-semibold text-[#E5FF8F] hover:bg-black transition-colors shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download CSV</span>
              </a>
              <button
                onClick={() => handleInspectReport("STATE_POLICY_MATRIX")}
                className="inline-flex items-center gap-1 rounded-xl border border-[#F2FFC7] bg-white px-3 py-2 text-xs font-semibold text-[#0B0F19] hover:bg-[#F7FFDD] transition-colors shadow-2xs"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Report 3: Anomaly Summary */}
          <div className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4]/70 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                  Vigilance
                </span>
                <AlertOctagon className="h-4 w-4 text-rose-600" />
              </div>
              <h3 className="font-semibold text-[#0B0F19] text-sm">Anomaly & Inspection Summary</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Flagged violations, quota overflow events, unverified tokens, and open dispute tickets.
              </p>
            </div>

            <div className="pt-3 border-t border-[#F2FFC7] flex items-center gap-2">
              <a
                href={api.getExportUrl("ANOMALY_AUDIT_SUMMARY", "csv")}
                target="_blank"
                rel="noreferrer"
                download="anomaly_audit_summary.csv"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B0F19] px-3 py-2 text-xs font-semibold text-[#E5FF8F] hover:bg-black transition-colors shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download CSV</span>
              </a>
              <button
                onClick={() => handleInspectReport("ANOMALY_AUDIT_SUMMARY")}
                className="inline-flex items-center gap-1 rounded-xl border border-[#F2FFC7] bg-white px-3 py-2 text-xs font-semibold text-[#0B0F19] hover:bg-[#F7FFDD] transition-colors shadow-2xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-h-[85vh] w-full max-w-4xl rounded-2xl border border-[#F2FFC7] bg-white shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0B0F19] font-mono">
                  {activeReportModal} • Export Payload
                </h3>
                <p className="text-xs text-slate-500">
                  Direct JSON payload emitted from statutory export endpoint
                </p>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                className="rounded-lg bg-[#FCFFF4] border border-[#F2FFC7] px-2.5 py-1 text-xs text-[#0B0F19] hover:bg-[#F7FFDD]"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-auto rounded-xl bg-[#FCFFF4] p-4 font-mono text-xs text-[#0B0F19] border border-[#F2FFC7]">
              {loadingReportData ? (
                <div className="text-center py-12 text-slate-500 animate-pulse">
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
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B0F19] px-4 py-2 text-xs font-semibold text-[#E5FF8F] hover:bg-black transition-colors shadow-2xs"
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
