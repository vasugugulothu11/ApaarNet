"use client";

import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  GitCompare,
  Network,
  Scale,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  FileText,
  Lock,
  Phone,
  Landmark,
  BadgeAlert,
  Check,
  X,
} from "lucide-react";
import {
  api,
  GhostRingGraphResponse,
  RiskRankingsResponse,
  CollisionsResponse,
  DisputeTicketResponse,
  InstitutionalRiskProfile,
  GraphNode,
} from "@/lib/api";

export default function IntelligenceChamberPage() {
  // Navigation Modules Tabs
  const [activeTab, setActiveTab] = useState<
    "ghost-rings" | "risk-rankings" | "collisions-twins" | "disputes"
  >("ghost-rings");

  // Sub-tab for Collisions vs Twins
  const [collisionSubTab, setCollisionSubTab] = useState<"exact-collisions" | "phonetic-twins">(
    "exact-collisions"
  );

  // Module 1 State: Ghost Rings
  const [ghostRings, setGhostRings] = useState<GhostRingGraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loadingGhostRings, setLoadingGhostRings] = useState(false);

  // Module 2 State: Risk Rankings & SHAP Waterfall
  const [riskRankings, setRiskRankings] = useState<RiskRankingsResponse | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<InstitutionalRiskProfile | null>(null);
  const [searchInstitution, setSearchInstitution] = useState("");
  const [loadingRankings, setLoadingRankings] = useState(false);

  // Module 3 State: Collisions & Phonetic Twins
  const [collisions, setCollisions] = useState<CollisionsResponse | null>(null);
  const [loadingCollisions, setLoadingCollisions] = useState(false);

  // Module 4 State: Dispute Tickets & Adjudication
  const [disputes, setDisputes] = useState<DisputeTicketResponse[]>([]);
  const [adjudicatingTicketId, setAdjudicatingTicketId] = useState<string | null>(null);
  const [adjudicationDecision, setAdjudicationDecision] = useState<
    "RESOLVED_VALID" | "CONFIRMED_DUPLICATE"
  >("RESOLVED_VALID");
  const [adjudicationReason, setAdjudicationReason] = useState("");
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [lastAdjudicatedReceipt, setLastAdjudicatedReceipt] = useState<{
    ticketId: string;
    decision: string;
    reason: string;
  } | null>(null);

  // Initial load
  useEffect(() => {
    loadAllIntelligence();
  }, []);

  const loadAllIntelligence = async () => {
    setLoadingGhostRings(true);
    setLoadingRankings(true);
    setLoadingCollisions(true);
    setLoadingDisputes(true);

    try {
      const [ringsData, rankingsData, collisionsData, disputesData] = await Promise.all([
        api.getGhostRings(),
        api.getRiskRankings(),
        api.getCollisions(),
        api.getDisputes(),
      ]);

      setGhostRings(ringsData);
      if (ringsData.nodes.length > 0) {
        // default select the shared phone node
        const phoneNode = ringsData.nodes.find((n) => n.type === "phone") || ringsData.nodes[0];
        setSelectedNode(phoneNode);
      }

      setRiskRankings(rankingsData);
      if (rankingsData.rankings.length > 0) {
        setSelectedProfile(rankingsData.rankings[0]);
      }

      setCollisions(collisionsData);
      setDisputes(disputesData);
    } catch (err) {
      console.error("Failed to load intelligence data:", err);
    } finally {
      setLoadingGhostRings(false);
      setLoadingRankings(false);
      setLoadingCollisions(false);
      setLoadingDisputes(false);
    }
  };

  // Handle dispute adjudication
  const handleResolveDispute = async (ticketId: string) => {
    if (!adjudicationReason.trim()) {
      alert("Please enter an official adjudication rationale.");
      return;
    }
    setSubmittingDispute(true);
    try {
      const updated = await api.resolveDispute(
        ticketId,
        adjudicationDecision,
        adjudicationReason.trim()
      );

      // update dispute list locally
      setDisputes((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      setLastAdjudicatedReceipt({
        ticketId,
        decision: adjudicationDecision,
        reason: adjudicationReason.trim(),
      });
      setAdjudicatingTicketId(null);
      setAdjudicationReason("");
    } catch (err: any) {
      alert(`Dispute adjudication failed: ${err.message}`);
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Quick preset reasons for adjudication
  const quickReasons = [
    "Confirmed illegal concurrent physical attendance across state lines based on conflicting biometric attendance logs.",
    "Valid migration exception: candidate withdrew from College A before joining College B with verifiable TC.",
    "Simultaneous dual-degree verified lawful under UGC 2022 Guidelines (Physical Regular + Online ODL).",
  ];

  // Filtered institutions in Risk Rankings
  const filteredRankings = (riskRankings?.rankings || []).filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchInstitution.toLowerCase()) ||
      inst.aicte_permanent_id.toLowerCase().includes(searchInstitution.toLowerCase()) ||
      inst.state.toLowerCase().includes(searchInstitution.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* ============================================================== */}
      {/* HEADER & MODULE SWITCHER NAVIGATION TABS                       */}
      {/* ============================================================== */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E3E6E] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-medium text-[#003366]">
                Anomaly Intelligence & Arbitration
              </span>
              <span className="text-xs text-slate-600 font-mono">
                Cross-State Resolution
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#003366] mt-1">
              Intelligence Chamber & Tri-Party Disputes
            </h1>
          </div>

          <button
            onClick={loadAllIntelligence}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-[#003366] hover:border-[#003366] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
            <span>Reload AI Models</span>
          </button>
        </div>

        {/* 4 Interactive Module Tabs */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={() => setActiveTab("ghost-rings")}
            className={`flex items-center gap-2.5 rounded-xl p-3 text-left transition-all ${
              activeTab === "ghost-rings"
                ? "bg-purple-50 border border-purple-300 text-purple-900 shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
            }`}
          >
            <Network className="h-5 w-5 text-purple-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Module 1: Ghost-Ring Graph</div>
              <div className="text-[10px] text-slate-600">Case E Bipartite Topology</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("risk-rankings")}
            className={`flex items-center gap-2.5 rounded-xl p-3 text-left transition-all ${
              activeTab === "risk-rankings"
                ? "bg-indigo-50 border border-indigo-300 text-indigo-900 shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
            }`}
          >
            <BrainCircuit className="h-5 w-5 text-indigo-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Module 2: SHAP Waterfall</div>
              <div className="text-[10px] text-slate-600">Isolation Forest Risk</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("collisions-twins")}
            className={`flex items-center gap-2.5 rounded-xl p-3 text-left transition-all ${
              activeTab === "collisions-twins"
                ? "bg-blue-50 border border-blue-300 text-blue-900 shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
            }`}
          >
            <GitCompare className="h-5 w-5 text-cyan-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Module 3: Cases B, C & D</div>
              <div className="text-[10px] text-slate-600">UGC Dual-Degree & Twins</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("disputes")}
            className={`flex items-center gap-2.5 rounded-xl p-3 text-left transition-all ${
              activeTab === "disputes"
                ? "bg-amber-50 border border-amber-300 text-amber-900 shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
            }`}
          >
            <Scale className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Module 4: Dispute Chamber</div>
              <div className="text-[10px] text-slate-600">Tri-Party Adjudication</div>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODULE 1: CASE E BIPARTITE GHOST-RING GRAPH VISUALIZER         */}
      {/* ============================================================== */}
      {activeTab === "ghost-rings" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-950/70 px-3 py-0.5 text-xs font-bold text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                CASE E DEMONSTRATION • NETWORKX GRAPH AI
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Bipartite Syndicate Admission Ring Visualizer
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Detects multi-institution ghost admission rings sharing identical contact & banking coordinates.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-rose-950/80 px-2.5 py-1 text-rose-300 font-bold border border-rose-800">
                Ring #882: 8 Students Across 2 Colleges
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Interactive SVG Graph Canvas */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-xs p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                  Deccan Valley Students (5)
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Metro Tech Students (3)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                  Shared Syndicate Hubs (2)
                </span>
              </div>

              {/* SVG Topology Canvas */}
              <div className="w-full h-[440px] flex items-center justify-center pt-8">
                <svg className="w-full h-full max-w-2xl" viewBox="0 0 800 440">
                  <defs>
                    <linearGradient id="edgeGradRose" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="edgeGradAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Edges from Deccan Valley (Left) to Hubs (Center) */}
                  {[60, 130, 200, 270, 340].map((y, idx) => (
                    <g key={`deccan-edges-${idx}`}>
                      {/* Connection to Phone Hub (400, 160) */}
                      <path
                        d={`M 140 ${y} C 260 ${y}, 280 160, 400 160`}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        className="opacity-60 hover:opacity-100 transition-opacity"
                      />
                      {/* Connection to Bank Hub (400, 280) */}
                      <path
                        d={`M 140 ${y} C 260 ${y}, 280 280, 400 280`}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        className="opacity-50 hover:opacity-100 transition-opacity"
                      />
                    </g>
                  ))}

                  {/* Edges from Metro Tech (Right) to Hubs (Center) */}
                  {[120, 200, 280].map((y, idx) => (
                    <g key={`metro-edges-${idx}`}>
                      {/* Connection to Phone Hub (400, 160) */}
                      <path
                        d={`M 660 ${y} C 540 ${y}, 520 160, 400 160`}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        className="opacity-60 hover:opacity-100 transition-opacity"
                      />
                      {/* Connection to Bank Hub (400, 280) */}
                      <path
                        d={`M 660 ${y} C 540 ${y}, 520 280, 400 280`}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        className="opacity-50 hover:opacity-100 transition-opacity"
                      />
                    </g>
                  ))}

                  {/* Deccan Valley Student Nodes (Left Column) */}
                  {[
                    { name: "Aman Gupta", y: 60, id: "stu-1" },
                    { name: "Rohit Jain", y: 130, id: "stu-2" },
                    { name: "Suresh Rao", y: 200, id: "stu-3" },
                    { name: "Neha Roy", y: 270, id: "stu-4" },
                    { name: "Aditi Sen", y: 340, id: "stu-5" },
                  ].map((stu) => {
                    const isSelected = selectedNode?.label === stu.name;
                    return (
                      <g
                        key={stu.id}
                        onClick={() =>
                          setSelectedNode({
                            id: stu.id,
                            label: stu.name,
                            type: "student",
                            data: {
                              institution: "Deccan Valley Engineering College",
                              course: "B.Tech CSE",
                              dob: "2006-01-01",
                              phone: "+91-9876543210",
                              bank: "BANK-RING-999",
                              burst: "12 mins",
                            },
                          })
                        }
                        className="cursor-pointer group"
                      >
                        <circle
                          cx="140"
                          cy={stu.y}
                          r={isSelected ? "14" : "10"}
                          fill="#082f49"
                          stroke="#06b6d4"
                          strokeWidth="2.5"
                          className="transition-all group-hover:scale-125"
                        />
                        <text
                          x="120"
                          y={stu.y + 4}
                          fill="#e2e8f0"
                          fontSize="10"
                          fontWeight="600"
                          textAnchor="end"
                          className="font-sans"
                        >
                          {stu.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Metro Tech Student Nodes (Right Column) */}
                  {[
                    { name: "Kunal Ghosh", y: 120, id: "stu-6" },
                    { name: "Tarun Das", y: 200, id: "stu-7" },
                    { name: "Simran K.", y: 280, id: "stu-8" },
                  ].map((stu) => {
                    const isSelected = selectedNode?.label === stu.name;
                    return (
                      <g
                        key={stu.id}
                        onClick={() =>
                          setSelectedNode({
                            id: stu.id,
                            label: stu.name,
                            type: "student",
                            data: {
                              institution: "Metro Tech Institute",
                              course: "B.Tech IT",
                              dob: "2006-01-01",
                              phone: "+91-9876543210",
                              bank: "BANK-RING-999",
                              burst: "14 mins",
                            },
                          })
                        }
                        className="cursor-pointer group"
                      >
                        <circle
                          cx="660"
                          cy={stu.y}
                          r={isSelected ? "14" : "10"}
                          fill="#451a03"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          className="transition-all group-hover:scale-125"
                        />
                        <text
                          x="680"
                          y={stu.y + 4}
                          fill="#e2e8f0"
                          fontSize="10"
                          fontWeight="600"
                          textAnchor="start"
                          className="font-sans"
                        >
                          {stu.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Center Hub 1: Shared Phone Node (400, 160) */}
                  <g
                    onClick={() =>
                      setSelectedNode({
                        id: "hub-phone",
                        label: "+91-9876543210",
                        type: "phone",
                        data: {
                          syndicate_role: "Shared Mobile Number Hub",
                          connected_students: 8,
                          institutions: "Deccan Valley (5) + Metro Tech (3)",
                          burst_window: "<= 15 mins",
                          dob_entropy: "0.0 (100% Born 2006-01-01)",
                        },
                      })
                    }
                    className="cursor-pointer group"
                  >
                    <circle cx="400" cy="160" r="26" fill="#881337" opacity="0.4" />
                    <circle
                      cx="400"
                      cy="160"
                      r="20"
                      fill="#4c0519"
                      stroke="#f43f5e"
                      strokeWidth="3"
                      className="transition-all group-hover:scale-110"
                    />
                    <text
                      x="400"
                      y="164"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      PHONE
                    </text>
                    <text
                      x="400"
                      y="195"
                      fill="#f43f5e"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      +91-9876543210
                    </text>
                  </g>

                  {/* Center Hub 2: Shared Bank Hash Node (400, 280) */}
                  <g
                    onClick={() =>
                      setSelectedNode({
                        id: "hub-bank",
                        label: "BANK-RING-999",
                        type: "bank",
                        data: {
                          syndicate_role: "Shared Fee Reimbursement Bank Hash",
                          connected_students: 8,
                          institutions: "Deccan Valley (5) + Metro Tech (3)",
                          suspicion: "Dummy Fee Diversion Syndicate",
                        },
                      })
                    }
                    className="cursor-pointer group"
                  >
                    <circle cx="400" cy="280" r="26" fill="#78350f" opacity="0.4" />
                    <circle
                      cx="400"
                      cy="280"
                      r="20"
                      fill="#451a03"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      className="transition-all group-hover:scale-110"
                    />
                    <text
                      x="400"
                      y="284"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      BANK
                    </text>
                    <text
                      x="400"
                      y="315"
                      fill="#f59e0b"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      BANK-RING-999
                    </text>
                  </g>
                </svg>
              </div>

              <div className="text-[11px] text-slate-500 text-center mt-2">
                Click on any node (students or hubs) to inspect cryptographic syndicate forensics.
              </div>
            </div>

            {/* Right 1 Col: Syndicate Forensics Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    Node Forensic Inspector
                  </span>
                  <span className="rounded bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-300 font-mono border border-rose-800">
                    {selectedNode?.type?.toUpperCase() || "SYNDICATE"}
                  </span>
                </div>

                {selectedNode ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">
                        Identifier / Name
                      </div>
                      <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                        {selectedNode.label}
                      </div>
                    </div>

                    {Object.entries(selectedNode.data || {}).map(([key, val]) => (
                      <div key={key} className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                        <div className="text-[10px] text-slate-600 uppercase font-semibold">
                          {key.replace(/_/g, " ")}
                        </div>
                        <div className="text-slate-800 font-mono mt-0.5">
                          {String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Select a node in the graph
                  </div>
                )}
              </div>

              {/* Ring Metrics Box */}
              <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 space-y-2 text-xs">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <BadgeAlert className="h-4 w-4" />
                  Syndicate Anomaly Signature
                </div>
                <div className="text-[11px] text-rose-200/80 leading-relaxed">
                  <strong>100% DOB Uniformity:</strong> All 8 students share identical date of birth (2006-01-01),
                  uploaded within a burst window of &le; 15 minutes before the admissions portal deadline.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODULE 2: ISOLATION FOREST & SHAP WATERFALL STUDIO             */}
      {/* ============================================================== */}
      {activeTab === "risk-rankings" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-950/70 px-3 py-0.5 text-xs font-bold text-indigo-300">
                <BrainCircuit className="h-3.5 w-3.5" />
                EXPLAINABLE AI • SHAP TREE EXPLAINER
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Institutional Anomaly Risk Rankings & SHAP Waterfalls
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Isolation Forest model ranking all 50 colleges by anomaly score, backed by mathematical SHAP feature attributions.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search college or ID..."
                value={searchInstitution}
                onChange={(e) => setSearchInstitution(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white shadow-xs pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left 1 Col: Priority Inspection Queue */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-4 space-y-3 overflow-hidden">
              <div className="flex justify-between items-center px-2 text-xs font-bold text-slate-600">
                <span>Priority Inspection Queue</span>
                <span>Risk Score</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredRankings.map((inst) => {
                  const isSelected = selectedProfile?.institution_id === inst.institution_id;
                  const isHighRisk = inst.risk_score >= 80;
                  return (
                    <div
                      key={inst.institution_id}
                      onClick={() => setSelectedProfile(inst)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-950/40 shadow-md"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-slate-600">#{inst.rank}</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${
                            isHighRisk
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          }`}
                        >
                          {inst.risk_score.toFixed(1)} / 100
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1 truncate">
                        {inst.name}
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                        {inst.aicte_permanent_id} • {inst.state}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 2 Cols: SHAP Waterfall Studio */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-xs p-6 space-y-6">
              {selectedProfile ? (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {selectedProfile.name}
                        </h3>
                        <span className="text-xs font-mono text-slate-600">
                          ({selectedProfile.aicte_permanent_id})
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {selectedProfile.district}, {selectedProfile.state} • Rank #{selectedProfile.rank}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Anomaly Rating:</span>
                      <span
                        className={`text-sm font-black px-2.5 py-1 rounded font-mono ${
                          selectedProfile.risk_score >= 80
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}
                      >
                        {selectedProfile.risk_score.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* SHAP Feature Attribution Waterfall Bars */}
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      <span>SHAP Feature Attribution (TreeExplainer)</span>
                      <span className="text-[11px] text-slate-600 font-mono">
                        Base Value: 20.0 pts
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedProfile.shap_waterfall.map((f) => {
                        const isPositive = f.contribution_pts >= 0;
                        return (
                          <div key={f.feature_name} className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-700 font-semibold">
                                {f.feature_name}
                              </span>
                              <span
                                className={`font-bold ${
                                  isPositive ? "text-rose-400" : "text-emerald-400"
                                }`}
                              >
                                {isPositive ? `+${f.contribution_pts.toFixed(1)}` : f.contribution_pts.toFixed(1)} pts
                              </span>
                            </div>

                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isPositive ? "bg-rose-500" : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.abs(f.contribution_pts) * 2.5)}%`,
                                }}
                              />
                            </div>

                            <div className="text-[11px] text-slate-600 leading-tight">
                              {f.interpretation}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plain English Summary */}
                  <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/30 p-4 text-xs text-indigo-200 leading-relaxed">
                    <span className="font-bold text-slate-900">AI Auditor Recommendation:</span>{" "}
                    {selectedProfile.plain_english_summary}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">
                  Select an institution on the left to inspect its SHAP waterfall.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODULE 3: CASES B, C & D ENTITY RESOLUTION                     */}
      {/* ============================================================== */}
      {activeTab === "collisions-twins" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/70 px-3 py-0.5 text-xs font-bold text-cyan-300">
                <GitCompare className="h-3.5 w-3.5" />
                CASES B, C & D • UGC 2022 & FELLEGI-SUNTER
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Cross-Institution Entity Resolution & Dual-Degree Matrix
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Disambiguates lawful simultaneous degrees under UGC 2022 while detecting duplicate evasion and protecting twins.
              </p>
            </div>

            {/* Sub-tab Switcher */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-xs p-1">
              <button
                onClick={() => setCollisionSubTab("exact-collisions")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  collisionSubTab === "exact-collisions"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cases B & C: Exact APAAR Matrix
              </button>
              <button
                onClick={() => setCollisionSubTab("phonetic-twins")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  collisionSubTab === "phonetic-twins"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Case D: Indic Phonetic & Twins
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Exact APAAR Matrix (Cases B & C) */}
          {collisionSubTab === "exact-collisions" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Case B: Lawful UGC Dual-Degree */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-950/20 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-700">
                    CASE B • LAWFUL UGC 2022
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-bold text-slate-900">Aarav Sharma</div>
                  <div className="text-xs font-mono text-cyan-300">APAAR: 482910384715</div>
                </div>

                {/* Side-by-side enrolment cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3 space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Enrolment #1</div>
                    <div className="font-semibold text-slate-900">Apex Institute of Tech</div>
                    <div className="text-slate-700">B.Tech Mechanical</div>
                    <div className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono inline-block">
                      REGULAR_PHYSICAL
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3 space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Enrolment #2</div>
                    <div className="font-semibold text-slate-900">COEP Technological Univ</div>
                    <div className="text-slate-700">Diploma Data Science</div>
                    <div className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-purple-300 font-mono inline-block">
                      ONLINE_ODL
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/60 p-3.5 space-y-1 text-xs text-emerald-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Verdict: LAWFUL_UGC_DUAL_DEGREE
                  </div>
                  <div className="text-[11px] text-emerald-300/80 leading-relaxed">
                    UGC Regulation 2022 allows 1 physical regular program combined with 1 online/ODL program.
                    ApaarNet auto-permits this candidate without false-positive penalty.
                  </div>
                </div>
              </div>

              {/* Case C: Illegal Cross-State Concurrent Regular */}
              <div className="rounded-2xl border-2 border-rose-500/40 bg-rose-950/20 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-rose-950 px-2 py-0.5 text-xs font-bold text-rose-300 border border-rose-700">
                    CASE C • FRAUD COLLISION
                  </span>
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-bold text-slate-900">Priya Nair</div>
                  <div className="text-xs font-mono text-cyan-300">APAAR: 739201846297</div>
                </div>

                {/* Side-by-side enrolment cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3 space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Enrolment #1 (Tamil Nadu)</div>
                    <div className="font-semibold text-slate-900">PSG College of Tech</div>
                    <div className="text-slate-700">B.Tech Computer Science</div>
                    <div className="rounded bg-rose-950 px-1.5 py-0.5 text-[10px] text-rose-300 font-mono inline-block">
                      REGULAR_PHYSICAL
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-3 space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Enrolment #2 (Karnataka)</div>
                    <div className="font-semibold text-slate-900">BMS College of Engg</div>
                    <div className="text-slate-700">B.Tech Electronics</div>
                    <div className="rounded bg-rose-950 px-1.5 py-0.5 text-[10px] text-rose-300 font-mono inline-block">
                      REGULAR_PHYSICAL
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3.5 space-y-1 text-xs text-rose-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Verdict: ILLEGAL_CONCURRENT_REGULAR
                  </div>
                  <div className="text-[11px] text-rose-300/80 leading-relaxed">
                    Student concurrently occupies 2 physical full-time seats 350 km apart. Flagged as regulatory
                    breach and escalated to Tri-Party Dispute Chamber.
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setActiveTab("disputes")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300"
                  >
                    <span>Open Adjudication Chamber</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Indic Phonetic Fellegi-Sunter & Twin Disambiguation (Case D) */}
          {collisionSubTab === "phonetic-twins" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Case D1: Phonetic Evasion Caught */}
              <div className="rounded-2xl border-2 border-rose-500/40 bg-rose-950/20 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-rose-950 px-2 py-0.5 text-xs font-bold text-rose-300 border border-rose-700">
                    CASE D1 • PHONETIC EVASION
                  </span>
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                </div>

                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900">
                    Mohammed Rayyan Khan vs. Mohd. Rayan Khan
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    Token: PROV-APN-9001 (Evasion Attempt)
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-200/80 py-1.5">
                    <span className="text-slate-600 font-sans">Name Tokens:</span>
                    <span className="text-slate-900">MHMD RYN KHN (Exact Phonetic)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 py-1.5">
                    <span className="text-slate-600 font-sans">Date of Birth:</span>
                    <span className="text-emerald-400">2006-05-14 (MATCH)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 py-1.5">
                    <span className="text-slate-600 font-sans">Parent Initials:</span>
                    <span className="text-emerald-400">S.K. (MATCH)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 py-1.5">
                    <span className="text-slate-600 font-sans">Pincode:</span>
                    <span className="text-emerald-400">500032 (MATCH)</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold">
                    <span className="text-rose-400 font-sans">Fellegi-Sunter P(Match):</span>
                    <span className="text-rose-400 text-sm">99.9%</span>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-800/60 bg-rose-950/60 p-3 text-xs text-rose-200">
                  <span className="font-bold">Evasion Neutralized:</span> Student attempted to bypass
                  duplicate detection using abbreviated initials under a provisional token.
                </div>
              </div>

              {/* Case D2: Genuine Twins Protected */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-950/20 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-700">
                    CASE D2 • TWIN DISAMBIGUATION
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900">
                    Rohan Deshmukh vs. Sohan Deshmukh
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    Distinct APAAR IDs • Genuine Twin Siblings
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-200/80 py-1.5">
                    <span className="text-slate-600 font-sans">Given Names:</span>
                    <span className="text-emerald-400">Rohan != Sohan (DISTINCT)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 py-1.5">
                    <span className="text-slate-600 font-sans">Date of Birth:</span>
                    <span className="text-slate-700">2006-08-19 (Shared Twins)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 py-1.5">
                    <span className="text-slate-600 font-sans">Parent Initials:</span>
                    <span className="text-slate-700">V.D. (Shared Family)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/80 py-1.5">
                    <span className="text-slate-600 font-sans">Address / Pincode:</span>
                    <span className="text-slate-700">411001 (Shared Home)</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold">
                    <span className="text-emerald-400 font-sans">Twin Disambiguated P(Match):</span>
                    <span className="text-emerald-400 text-sm">5.0%</span>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/60 p-3 text-xs text-emerald-200">
                  <span className="font-bold">Zero False Rejection:</span> Twin Disambiguation Guard
                  verifies distinct roll numbers and verified APAAR IDs, protecting genuine siblings.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODULE 4: TRI-PARTY DISPUTE ADJUDICATION CHAMBER              */}
      {/* ============================================================== */}
      {activeTab === "disputes" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E3E6E] pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-medium text-[#003366]">
                <Scale className="h-3.5 w-3.5 text-[#0A4D8C]" />
                <span>Inter-State Arbitration</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#003366] mt-1">
                Tri-Party Inter-State Dispute Adjudication Console
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                AICTE-hearing officer console for resolving concurrent enrolment collisions with Ed25519-signed audit checkpoints.
              </p>
            </div>

            <div className="text-xs font-mono text-slate-600">
              Active Tickets: <span className="text-amber-400 font-bold">{disputes.length}</span>
            </div>
          </div>

          {/* Adjudication Success Receipt Alert */}
          {lastAdjudicatedReceipt && (
            <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Dispute Adjudicated & Sealed in Merkle Ledger
                </span>
                <button
                  onClick={() => setLastAdjudicatedReceipt(null)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  ✕
                </button>
              </div>
              <div className="text-emerald-200">
                Ticket <code className="font-mono text-cyan-300">{lastAdjudicatedReceipt.ticketId.slice(0, 8)}...</code>{" "}
                adjudicated as <strong>{lastAdjudicatedReceipt.decision}</strong>.
              </div>
              <div className="text-[11px] text-slate-600 font-mono">
                Rationale: {lastAdjudicatedReceipt.reason}
              </div>
            </div>
          )}

          {/* Dispute Tickets List */}
          <div className="space-y-4">
            {disputes.map((ticket) => {
              const isOpen = ticket.status === "OPEN_TRI_PARTY";
              const isSelectedForAction = adjudicatingTicketId === ticket.id;

              return (
                <div
                  key={ticket.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6 space-y-5 transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          Dispute #{ticket.id.slice(0, 8)}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            isOpen
                              ? "bg-amber-950 text-amber-300 border border-amber-800 animate-pulse"
                              : ticket.status === "RESOLVED_VALID"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : "bg-rose-950 text-rose-300 border border-rose-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <div className="text-xs text-cyan-400 font-mono mt-0.5">
                        Student APAAR / Token: {ticket.student_apaar_or_token}
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-500">
                      Filed: {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Inter-State College Conflict View */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">
                        Originating Institution (College A)
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        {ticket.college_a_name}
                      </div>
                      <div className="text-slate-600 font-mono text-[11px]">
                        ID: {ticket.college_a_id}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">
                        Contesting Institution (College B)
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        {ticket.college_b_name}
                      </div>
                      <div className="text-slate-600 font-mono text-[11px]">
                        ID: {ticket.college_b_id}
                      </div>
                    </div>
                  </div>

                  {/* Evidence Timeline */}
                  {ticket.evidence_log && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1 text-xs">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-cyan-400" />
                        Forensic Evidence Log
                      </div>
                      <div className="text-slate-600 text-[11px] font-mono leading-relaxed">
                        {JSON.stringify(ticket.evidence_log)}
                      </div>
                      {ticket.officer_decision_reason && (
                        <div className="text-emerald-300 font-semibold pt-1">
                          Officer Order: {ticket.officer_decision_reason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Adjudication Action Area */}
                  {isOpen && (
                    <div className="pt-2">
                      {isSelectedForAction ? (
                        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">
                              AICTE Adjudication Hearing Console
                            </span>
                            <button
                              onClick={() => setAdjudicatingTicketId(null)}
                              className="text-xs text-slate-600 hover:text-slate-900"
                            >
                              ✕ Cancel
                            </button>
                          </div>

                          {/* Decision Selector */}
                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <label className="flex items-center gap-2 cursor-pointer text-emerald-300">
                              <input
                                type="radio"
                                name="decision"
                                checked={adjudicationDecision === "RESOLVED_VALID"}
                                onChange={() => setAdjudicationDecision("RESOLVED_VALID")}
                                className="accent-emerald-500"
                              />
                              Approve as Lawful Exception (RESOLVED_VALID)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-rose-300">
                              <input
                                type="radio"
                                name="decision"
                                checked={adjudicationDecision === "CONFIRMED_DUPLICATE"}
                                onChange={() => setAdjudicationDecision("CONFIRMED_DUPLICATE")}
                                className="accent-rose-500"
                              />
                              Confirm Duplicate Violation (CONFIRMED_DUPLICATE)
                            </label>
                          </div>

                          {/* Quick Reasons */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] text-slate-600 uppercase font-semibold">
                              Pre-Filled AICTE Statutory Rationale:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {quickReasons.map((qr, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setAdjudicationReason(qr)}
                                  className="rounded bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700 hover:text-slate-900 hover:border-slate-300 text-left"
                                >
                                  {qr.slice(0, 48)}...
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Reason Textbox */}
                          <div>
                            <textarea
                              rows={2}
                              value={adjudicationReason}
                              onChange={(e) => setAdjudicationReason(e.target.value)}
                              placeholder="Enter official adjudication order rationale..."
                              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                            />
                          </div>

                          {/* Submit Button */}
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleResolveDispute(ticket.id)}
                              disabled={submittingDispute}
                              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              <span>
                                {submittingDispute
                                  ? "Sealing in Merkle Ledger..."
                                  : "Commit Adjudication Order"}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setAdjudicatingTicketId(ticket.id);
                              setAdjudicationReason(quickReasons[0]);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-950/60 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-900/60 hover:text-slate-900 transition-colors"
                          >
                            <Scale className="h-4 w-4" />
                            <span>Adjudicate Dispute as AICTE Officer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
