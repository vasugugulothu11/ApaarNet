"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Building2,
  BrainCircuit,
  Lock,
  Award,
  Bell,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Languages,
  Sliders,
  Scan,
  RefreshCw,
  CheckCircle2,
  Cloud,
  ChevronRight,
  Database,
  Sparkles,
  User,
} from "lucide-react";
import { api, ReseedDemoResponse } from "@/lib/api";
import { useRbac, PORTAL_PRIMARY_ROLES } from "@/context/RbacContext";
import { useLanguage } from "@/context/LanguageContext";
import { RbacAuthModal } from "@/components/RbacAuthModal";
import { LogoMark } from "@/components/Logo";

export const PORTALS = [
  {
    name: "National Command",
    path: "/dashboard/admin",
    shortTag: "Statutory Telemetry & Mesh",
    icon: LayoutGrid,
    requiredRole: "NATIONAL_ADMIN",
  },
  {
    name: "Institution Registrar",
    path: "/institution-portal",
    shortTag: "Ingestion Sandbox & Quotas",
    icon: Building2,
    requiredRole: "INSTITUTION_REGISTRAR",
  },
  {
    name: "Intelligence Chamber",
    path: "/intelligence-chamber",
    shortTag: "Anomaly Forensics & Disputes",
    icon: BrainCircuit,
    requiredRole: "NATIONAL_ADMIN",
  },
  {
    name: "Consent Wallet",
    path: "/consent-wallet",
    shortTag: "DPDP Zero-Exposure Verification",
    icon: Lock,
    requiredRole: "STUDENT_DATA_PRINCIPAL",
  },
  {
    name: "Degree Studio",
    path: "/degree-studio",
    shortTag: "W3C Verifiable Credentials",
    icon: Award,
    requiredRole: "UNIVERSITY_CONTROLLER",
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const {
    session,
    rbacMode,
    enforcementMode,
    setRbacMode,
    setEnforcementMode,
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginRole,
    toastMessage,
    setToastMessage,
  } = useRbac();
  const { language, toggleLanguage, t } = useLanguage();

  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [merkleValid, setMerkleValid] = useState<boolean | null>(null);
  const [isReseeding, setIsReseeding] = useState(false);
  const [reseedResult, setReseedResult] = useState<ReseedDemoResponse | null>(null);
  const [showReseedToast, setShowReseedToast] = useState(false);
  const [fontSizeSetting, setFontSizeSetting] = useState<"A-" | "A" | "A+">("A");
  const [isWakingCloud, setIsWakingCloud] = useState(false);
  const [showCloudSuccessToast, setShowCloudSuccessToast] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("apaarnet_font_size");
      if (saved === "14.5px") {
        setFontSizeSetting("A-");
        document.documentElement.style.fontSize = "14.5px";
      } else if (saved === "17.5px") {
        setFontSizeSetting("A+");
        document.documentElement.style.fontSize = "17.5px";
      } else {
        setFontSizeSetting("A");
        document.documentElement.style.fontSize = "16px";
      }
    } catch {}
  }, []);

  const handleFontSize = (size: "A-" | "A" | "A+") => {
    setFontSizeSetting(size);
    const px = size === "A-" ? "14.5px" : size === "A+" ? "17.5px" : "16px";
    document.documentElement.style.fontSize = px;
    try {
      localStorage.setItem("apaarnet_font_size", px);
    } catch {}
  };

  useEffect(() => {
    let wakeTimer: NodeJS.Timeout | null = null;
    let isFirstCheck = true;

    const checkStatus = async () => {
      if (isFirstCheck && dbReady === null) {
        wakeTimer = setTimeout(() => {
          setIsWakingCloud(true);
        }, 2500);
      }

      try {
        const ready = await api.getReady();
        const connected = ready.database === "connected";
        setDbReady(connected);

        if (wakeTimer) clearTimeout(wakeTimer);
        setIsWakingCloud((wasWaking) => {
          if (wasWaking) {
            setShowCloudSuccessToast(true);
            setTimeout(() => setShowCloudSuccessToast(false), 6000);
          }
          return false;
        });
      } catch {
        setDbReady(false);
      } finally {
        if (wakeTimer) clearTimeout(wakeTimer);
      }

      try {
        const ledger = await api.getAuditLedger(5);
        setMerkleValid(ledger.chain_integrity_valid);
      } catch {
        setMerkleValid(false);
      }

      isFirstCheck = false;
    };

    checkStatus();
    const interval = setInterval(checkStatus, 20000);
    return () => {
      if (wakeTimer) clearTimeout(wakeTimer);
      clearInterval(interval);
    };
  }, []);

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      const res = await api.reseedDemo();
      setReseedResult(res);
      setShowReseedToast(true);
      const ready = await api.getReady();
      setDbReady(ready.database === "connected");
      setTimeout(() => setShowReseedToast(false), 8000);
    } catch (err: any) {
      alert(`Reseed failed: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  const handlePortalClick = (targetPath: string) => {
    if (rbacMode === "fast-switch") {
      const targetRole = PORTAL_PRIMARY_ROLES[targetPath];
      if (targetRole && targetRole !== session.role) {
        loginRole(targetRole, session.auth_method).catch(() => {});
      }
    }
  };

  return (
    <>
      {/* 1. Left Vertical Dark Sidebar (Reference Design) */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 w-20 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col items-center py-6 justify-between select-none shadow-2xl">
        {/* Top: Logo / Squircle Crest */}
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/"
            className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B0F19] border border-slate-800 text-white shadow-inner transition-all hover:border-[#b9e303]/50 hover:scale-105"
            title="ApaarNet Executive Mesh"
          >
            <LogoMark className="h-9 w-9" />
          </Link>

          {/* Navigation Icon Stack */}
          <nav className="flex flex-col items-center gap-3">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const isActive = pathname === portal.path;

              return (
                <div key={portal.path} className="relative group">
                  <Link
                    href={portal.path}
                    onClick={() => handlePortalClick(portal.path)}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                      isActive
                        ? "bg-[#E5FF8F] text-[#0B0F19] font-bold shadow-[0_0_24px_rgba(229,255,143,0.55)] scale-105"
                        : "text-slate-400 hover:text-[#E5FF8F] hover:bg-slate-900/90"
                    }`}
                    title={portal.name}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>

                  {/* Modern Floating Hover Tooltip */}
                  <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#0B0F19] px-3 py-1.5 text-xs text-white shadow-xl border border-slate-800 opacity-0 transition-opacity group-hover:opacity-100 z-50">
                    <div className="font-semibold text-[#E5FF8F]">{portal.name}</div>
                    <div className="text-[10px] text-slate-400">{portal.shortTag}</div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Tools Stack */}
        <div className="flex flex-col items-center gap-4">
          {/* Notification Alert Icon with Live Dot */}
          <div className="relative group">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-[#E5FF8F] hover:bg-slate-900 transition-colors"
              title="System Notifications & Alerts"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#E5FF8F] ring-2 ring-[#0B0F19]" />
            </button>
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#0B0F19] px-3 py-1.5 text-xs text-white shadow-xl border border-slate-800 opacity-0 transition-opacity group-hover:opacity-100 z-50">
              <span className="font-semibold text-[#E5FF8F]">3 Anomaly Alerts</span>
              <div className="text-[10px] text-slate-400">Real-time Telemetry</div>
            </div>
          </div>

          {/* Bilingual Language Switcher Icon */}
          <div className="relative group">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-[#E5FF8F] hover:bg-slate-900 transition-colors font-semibold text-xs"
              title={language === "en" ? "Switch to Hindi (हिन्दी)" : "Switch to English"}
            >
              <Languages className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#0B0F19] px-3 py-1.5 text-xs text-white shadow-xl border border-slate-800 opacity-0 transition-opacity group-hover:opacity-100 z-50">
              <span className="font-semibold">{language === "en" ? "भाषा: हिन्दी" : "Language: English"}</span>
            </div>
          </div>

          {/* Accessibility Font Size Toggle */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                const next = fontSizeSetting === "A-" ? "A" : fontSizeSetting === "A" ? "A+" : "A-";
                handleFontSize(next);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-[#E5FF8F] hover:bg-slate-900 transition-colors font-bold text-xs font-mono"
              title="Toggle Accessibility Font Size"
            >
              {fontSizeSetting}
            </button>
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#0B0F19] px-3 py-1.5 text-xs text-white shadow-xl border border-slate-800 opacity-0 transition-opacity group-hover:opacity-100 z-50">
              <span className="font-semibold">Font Resizer: {fontSizeSetting}</span>
            </div>
          </div>

          {/* Settings / RBAC Switcher Persona Button */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0B0F19] to-slate-900 border border-slate-700/80 text-white shadow-md hover:border-[#E5FF8F]/60 hover:scale-105 transition-all"
              title="Stakeholder Persona & Access Control"
            >
              <Sliders className="h-4 w-4 text-slate-300" />
            </button>
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#0B0F19] px-3 py-2 text-xs text-white shadow-xl border border-slate-800 opacity-0 transition-opacity group-hover:opacity-100 z-50">
              <div className="font-semibold">{session.persona?.name || session.role}</div>
              <div className="text-[10px] text-[#E5FF8F] font-mono">{session.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Top Executive Sub-Header Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#FCFFF4]/85 backdrop-blur-md border-b border-[#F2FFC7] px-6 sm:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#E5FF8F] ring-2 ring-[#0B0F19] animate-pulse" />
          <span className="text-xs font-semibold text-[#0B0F19] tracking-tight">
            ApaarNet Executive Mesh
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-medium text-slate-500 hidden md:inline">
            APH 2024–27 Statutory & Biometric Compliance
          </span>
        </div>

        {/* Top Right Executive Profile & Controls */}
        <div className="flex items-center gap-3">
          {/* RBAC Mode Pill */}
          <div className="hidden lg:flex items-center rounded-xl border border-[#F2FFC7] bg-[#F7FFDD]/70 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setRbacMode("fast-switch")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                rbacMode === "fast-switch"
                  ? "bg-[#0B0F19] text-[#E5FF8F] font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-[#0B0F19]"
              }`}
            >
              Jury Fast-Switch
            </button>
            <button
              type="button"
              onClick={() => setRbacMode("strict")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                rbacMode === "strict"
                  ? "bg-[#0B0F19] text-[#E5FF8F] font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-[#0B0F19]"
              }`}
            >
              Strict Gate
            </button>
          </div>

          {/* Reseed Demo Button */}
          <button
            type="button"
            onClick={handleReseed}
            disabled={isReseeding}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#F2FFC7] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B0F19] hover:bg-[#F7FFDD] transition-colors shadow-2xs disabled:opacity-50"
            title="Auto-seed 50 institutions and demo records"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isReseeding ? "animate-spin text-[#0B0F19]" : ""}`} />
            <span>{isReseeding ? "Seeding..." : "Seed Data"}</span>
          </button>

          {/* Active Persona Pill */}
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2.5 rounded-xl border border-[#F2FFC7] bg-white px-3 py-1.5 text-xs font-medium text-[#0B0F19] hover:bg-[#F7FFDD] transition-colors shadow-2xs"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0B0F19] text-[11px] font-bold text-[#E5FF8F]">
              {(session.persona?.name || session.role).charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-[#0B0F19] leading-tight truncate max-w-[150px]">
                {session.persona?.name || session.role}
              </div>
              <div className="text-[10px] text-slate-500 font-mono leading-tight">
                {session.role}
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* 3. Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#0B0F19] text-white px-5 py-3.5 text-xs font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="h-2 w-2 rounded-full bg-[#E5FF8F] animate-pulse" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {showReseedToast && reseedResult && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-800 bg-slate-950 text-white px-5 py-3.5 text-xs shadow-2xl animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">Database Seeded Successfully</div>
            <div className="text-[11px] text-slate-400">
              {reseedResult.institutions_seeded} colleges • {reseedResult.students_seeded} students
            </div>
          </div>
          <button
            onClick={() => setShowReseedToast(false)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {showCloudSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-blue-800 bg-slate-950 text-white px-5 py-3.5 text-xs shadow-2xl animate-in fade-in duration-300">
          <Cloud className="h-4 w-4 text-cyan-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">Cloud Engine Connected</div>
            <div className="text-[11px] text-slate-400">
              PostgreSQL mesh and audit ledger active
            </div>
          </div>
          <button
            onClick={() => setShowCloudSuccessToast(false)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* RBAC Modal */}
      {isAuthModalOpen && <RbacAuthModal />}
    </>
  );
}
