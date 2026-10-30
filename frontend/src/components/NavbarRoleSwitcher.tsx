"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  Building2,
  BrainCircuit,
  Award,
  RefreshCw,
  CheckCircle2,
  Lock,
  Database,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { api, ReseedDemoResponse } from "@/lib/api";

const PORTALS = [
  {
    name: "National Command",
    path: "/",
    shortTag: "Telemetry & Statutory Ledger",
    icon: Globe,
  },
  {
    name: "Institution Registrar",
    path: "/institution-portal",
    shortTag: "Ingestion Sandbox & Quotas",
    icon: Building2,
  },
  {
    name: "Intelligence Chamber",
    path: "/intelligence-chamber",
    shortTag: "Anomaly Detection & Disputes",
    icon: BrainCircuit,
  },
  {
    name: "Consent Wallet",
    path: "/consent-wallet",
    shortTag: "DPDP Zero-Exposure Verification",
    icon: Lock,
  },
  {
    name: "Degree Studio",
    path: "/degree-studio",
    shortTag: "W3C Credential Issuer & QR",
    icon: Award,
  },
];

export function NavbarRoleSwitcher() {
  const pathname = usePathname();
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [merkleValid, setMerkleValid] = useState<boolean | null>(null);
  const [isReseeding, setIsReseeding] = useState(false);
  const [reseedResult, setReseedResult] = useState<ReseedDemoResponse | null>(null);
  const [showReseedToast, setShowReseedToast] = useState(false);

  const checkStatus = async () => {
    try {
      const ready = await api.getReady();
      setDbReady(ready.database === "connected");
    } catch {
      setDbReady(false);
    }

    try {
      const ledger = await api.getAuditLedger(5);
      setMerkleValid(ledger.chain_integrity_valid);
    } catch {
      setMerkleValid(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      const res = await api.reseedDemo();
      setReseedResult(res);
      setShowReseedToast(true);
      await checkStatus();
      setTimeout(() => setShowReseedToast(false), 8000);
    } catch (err: any) {
      alert(`Reseed failed: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* 1. Indian National Tricolor Stripe */}
      <div className="h-[3.5px] w-full bg-tricolor-stripe" aria-hidden="true" />

      {/* 2. National Verification Utility Bar */}
      <div className="border-b border-slate-200 bg-slate-50/95 px-4 py-1 sm:px-6 lg:px-8 text-[11px] text-slate-700">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#FF7A1A] via-white to-[#046A38] border border-slate-300" />
            <span className="font-semibold text-slate-900">National Student Data & Statutory Quota Verification Mesh</span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-600 hidden sm:inline">APH 2024–27 Statutory Architecture</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="hidden md:inline text-slate-600 hover:text-[#003366] cursor-pointer">
              Screen Reader Access
            </span>
            <span className="hidden md:inline text-slate-300">|</span>
            <div className="hidden sm:flex items-center gap-1 font-bold text-slate-700">
              <span className="cursor-pointer px-1 hover:text-[#003366]" title="Decrease font size">A-</span>
              <span className="cursor-pointer px-1 hover:text-[#003366]" title="Normal font size">A</span>
              <span className="cursor-pointer px-1 hover:text-[#003366]" title="Increase font size">A+</span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="font-semibold text-[#003366] hover:underline cursor-pointer">
              हिन्दी
            </span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-bold text-[#003366] border border-blue-200/80">
              <span>Mesh Status: Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Brand & Operational Controls */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* ApaarNet Project Brand */}
          <Link href="/landing" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#003366] to-[#0A4D8C] text-white shadow-sm ring-1 ring-slate-200">
              <Layers className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[#003366]">
                  ApaarNet
                </span>
                <span className="rounded bg-[#003366]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#003366] border border-[#003366]/20">
                  Verification Mesh
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span>National Student Data & Quota Verification</span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-[#0A4D8C] font-bold hidden sm:inline">Multi-Institution Statutory Ledger</span>
              </p>
            </div>
          </Link>

          {/* Status Indicators & Reseed Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Overview / Landing Link */}
            <Link
              href="/landing"
              className={`hidden md:inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                pathname === "/landing"
                  ? "bg-[#003366] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>Portal Overview</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            {/* DB Ready Status */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 font-medium">
              <Database className="h-3.5 w-3.5 text-[#003366]" />
              <span
                className={`h-2 w-2 rounded-full ${
                  dbReady === true
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : dbReady === false
                    ? "bg-rose-500"
                    : "bg-amber-400 animate-pulse"
                }`}
              />
              <span className="text-[11px] hidden lg:inline">
                {dbReady === true ? "Database Live" : dbReady === false ? "Offline" : "Connecting"}
              </span>
            </div>

            {/* Merkle Chain Badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 font-medium">
              <span
                className={`h-2 w-2 rounded-full ${
                  merkleValid ? "bg-[#003366]" : "bg-amber-400"
                }`}
              />
              <span className="text-[11px]">
                {merkleValid ? "SHA-256 Ledger Verified" : "Verifying Ledger"}
              </span>
            </div>

            {/* Reset Demo Data Button */}
            <button
              onClick={handleReseed}
              disabled={isReseeding}
              className="flex items-center gap-1.5 rounded-lg border border-[#003366] bg-[#003366] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#002244] shadow-xs disabled:opacity-50"
              title="Reset test data according to AICTE statutory scenarios"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-amber-300 ${isReseeding ? "animate-spin" : ""}`}
              />
              <span>{isReseeding ? "Resetting..." : "Reset Demo Data"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. AICTE Institutional Navigation Ribbon */}
      <div className="bg-[#003366] px-2 sm:px-6 shadow-inner">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isActive = pathname === portal.path;
            return (
              <Link
                key={portal.path}
                href={portal.path}
                className={`group flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#002244] text-white shadow-xs border-b-2 border-[#FF7A1A]"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-[#FF7A1A]" : "text-slate-300 group-hover:text-white"
                  }`}
                />
                <span>{portal.name}</span>
                <span className="text-[10.5px] opacity-75 font-normal hidden xl:inline">
                  • {portal.shortTag}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Toast Notification on Reseed */}
      {showReseedToast && reseedResult && (
        <div className="absolute right-4 top-20 z-50 max-w-md animate-in fade-in duration-200">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#003366] text-sm">
                    ApaarNet Mesh Seeded Successfully
                  </h4>
                  <button
                    onClick={() => setShowReseedToast(false)}
                    className="text-slate-500 hover:text-slate-900 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-1 text-slate-700 font-medium">
                  {reseedResult.institutions_seeded} institutions, {reseedResult.quotas_seeded} statutory quotas, and{" "}
                  {reseedResult.students_seeded} student records updated.
                </p>
                <div className="mt-2.5 space-y-1 rounded-lg bg-slate-50 p-2.5 text-[11px] font-mono text-slate-700 border border-slate-200">
                  <div className="text-slate-800">
                    ✓ Supernumerary Quota: 240 Base + 36 Supernumerary (APH 2024–27)
                  </div>
                  <div className="text-emerald-700">
                    ✓ Dual Degree: Concurrent lawful physical + online enrolment validated
                  </div>
                  <div className="text-rose-700">
                    ✓ Duplicate Detection: Cross-institution regular collision flagged
                  </div>
                  <div className="text-amber-800">
                    ✓ Identity Matching: Jaro-Winkler & phonetic disambiguation
                  </div>
                  <div className="text-[#003366]">
                    ✓ Anomaly Ring: Multi-institution enrolment network tracked
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
