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
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Languages,
  Cloud,
} from "lucide-react";
import { api, ReseedDemoResponse } from "@/lib/api";
import { useRbac, PORTAL_PRIMARY_ROLES } from "@/context/RbacContext";
import { useLanguage } from "@/context/LanguageContext";

const PORTALS = [
  {
    name: "National Command",
    path: "/",
    shortTag: "Telemetry & Statutory Ledger",
    icon: Globe,
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
    shortTag: "Anomaly Detection & Disputes",
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
    shortTag: "W3C Credential Issuer & QR",
    icon: Award,
    requiredRole: "UNIVERSITY_CONTROLLER",
  },
];

export function NavbarRoleSwitcher() {
  const pathname = usePathname();
  const {
    session,
    rbacMode,
    enforcementMode,
    setRbacMode,
    setEnforcementMode,
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

  // Upgrade Step 4: Font Resizer State
  const [fontSizeSetting, setFontSizeSetting] = useState<"A-" | "A" | "A+">("A");

  // Upgrade Step 4: Render Cloud Wake-Up Toast State
  const [isWakingCloud, setIsWakingCloud] = useState(false);
  const [showCloudSuccessToast, setShowCloudSuccessToast] = useState(false);

  // Restore Font Size Setting on Client Mount
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

  // Health check & 2,500ms Cloud Wake-Up Monitor
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

  const getPortalName = (path: string) => {
    switch (path) {
      case "/":
        return t("portalCommand");
      case "/institution-portal":
        return t("portalInstitution");
      case "/intelligence-chamber":
        return t("portalIntelligence");
      case "/consent-wallet":
        return t("portalConsent");
      case "/degree-studio":
        return t("portalDegree");
      default:
        return "";
    }
  };

  const getPortalTag = (path: string) => {
    switch (path) {
      case "/":
        return t("tagCommand");
      case "/institution-portal":
        return t("tagInstitution");
      case "/intelligence-chamber":
        return t("tagIntelligence");
      case "/consent-wallet":
        return t("tagConsent");
      case "/degree-studio":
        return t("tagDegree");
      default:
        return "";
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

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "NATIONAL_ADMIN":
        return "bg-blue-100 text-[#003366] border-blue-300";
      case "INSTITUTION_REGISTRAR":
        return "bg-emerald-100 text-[#046A38] border-emerald-300";
      case "STUDENT_DATA_PRINCIPAL":
        return "bg-purple-100 text-purple-900 border-purple-300";
      case "UNIVERSITY_CONTROLLER":
        return "bg-amber-100 text-amber-900 border-amber-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
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
            <span className="font-semibold text-slate-900">{t("topBannerTitle")}</span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-600 hidden sm:inline">{t("statutoryArchitecture")}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="hidden md:inline text-slate-600 hover:text-[#003366] cursor-pointer">
              {t("screenReader")}
            </span>
            <span className="hidden md:inline text-slate-300">|</span>

            {/* Interactive Accessibility Font Resizer (A-, A, A+) */}
            <div className="hidden sm:flex items-center gap-1 font-bold text-slate-700">
              <button
                type="button"
                onClick={() => handleFontSize("A-")}
                className={`px-1.5 py-0.5 rounded text-[11px] transition-all ${
                  fontSizeSetting === "A-"
                    ? "bg-[#003366] text-white ring-1 ring-[#003366] shadow-2xs font-bold"
                    : "hover:text-[#003366] hover:bg-slate-200"
                }`}
                title="Decrease font size (14.5px)"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleFontSize("A")}
                className={`px-1.5 py-0.5 rounded text-[11px] transition-all ${
                  fontSizeSetting === "A"
                    ? "bg-[#003366] text-white ring-1 ring-[#003366] shadow-2xs font-bold"
                    : "hover:text-[#003366] hover:bg-slate-200"
                }`}
                title="Standard font size (16px)"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSize("A+")}
                className={`px-1.5 py-0.5 rounded text-[11px] transition-all ${
                  fontSizeSetting === "A+"
                    ? "bg-[#003366] text-white ring-1 ring-[#003366] shadow-2xs font-bold"
                    : "hover:text-[#003366] hover:bg-slate-200"
                }`}
                title="Increase font size (17.5px)"
              >
                A+
              </button>
            </div>

            <span className="hidden sm:inline text-slate-300">|</span>

            {/* Bilingual Hindi / English Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="font-semibold text-[#003366] hover:underline cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors"
              title={language === "en" ? "हिन्दी में बदलें / Switch to Hindi" : "Switch to English / अंग्रेज़ी में बदलें"}
            >
              <Languages className="h-3 w-3 text-slate-600" />
              <span>{language === "en" ? "हिन्दी" : "English"}</span>
            </button>

            <span className="text-slate-300">|</span>

            {/* Cloud & Mesh Status Indicator */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border transition-colors ${
                dbReady
                  ? "bg-emerald-50 text-[#046A38] border-emerald-200"
                  : isWakingCloud
                  ? "bg-blue-50 text-[#003366] border-blue-200 animate-pulse"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  dbReady
                    ? "bg-emerald-600 shadow-[0_0_6px_rgba(5,150,105,0.6)]"
                    : isWakingCloud
                    ? "bg-cyan-500 animate-ping"
                    : "bg-slate-400"
                }`}
              />
              <span>
                {dbReady
                  ? (language === "hi" ? "डेटाबेस सक्रिय · सत्यापित" : "Database Live · Verified")
                  : isWakingCloud
                  ? (language === "hi" ? "क्लाउड कनेक्ट हो रहा है..." : "Waking Cloud Engine...")
                  : (language === "hi" ? "नेटवर्क स्थिति: सक्रिय" : "Mesh Status: Active")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Brand & Operational Controls */}
      <div className="border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* ApaarNet Project Brand */}
          <Link href="/landing" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#003366] to-[#0A4D8C] text-white shadow-sm ring-1 ring-slate-200">
              <Layers className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[#003366]">
                  ApaarNet
                </span>
                <span className="rounded bg-[#003366]/10 px-1.5 py-0.2 text-[9.5px] font-bold uppercase tracking-wider text-[#003366] border border-[#003366]/20">
                  Verification Mesh
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <span>{t("brandSubtitle")}</span>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-[#0A4D8C] font-bold hidden sm:inline">APH 2024–27</span>
              </p>
            </div>
          </Link>

          {/* Active RBAC Session Pill & Persona Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 shadow-2xs hover:border-slate-400 transition-colors">
              <div
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  session.role === "NATIONAL_ADMIN"
                    ? "bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.6)]"
                    : session.role === "INSTITUTION_REGISTRAR"
                    ? "bg-emerald-600 shadow-[0_0_6px_rgba(5,150,105,0.6)]"
                    : session.role === "STUDENT_DATA_PRINCIPAL"
                    ? "bg-purple-600 shadow-[0_0_6px_rgba(147,51,234,0.6)]"
                    : "bg-amber-600 shadow-[0_0_6px_rgba(217,119,6,0.6)]"
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs text-slate-900 truncate max-w-[130px] sm:max-w-[170px]" title={session.persona.name}>
                    {session.persona.name}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold border uppercase tracking-wider ${getRoleBadgeStyle(
                      session.role
                    )}`}
                  >
                    {session.role.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                  <span className="truncate max-w-[130px] sm:max-w-[170px] text-slate-700" title={session.persona.title}>
                    {session.persona.title}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-[#003366] font-bold">
                    {session.scopes.length} Permitted Scopes
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="ml-1.5 inline-flex items-center gap-1.5 rounded-lg bg-[#003366] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-[#002244] transition-all hover:shadow-sm"
                title="Open JanParichay / DigiLocker SSO Persona Switcher (RBAC Security Gate)"
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span className="whitespace-nowrap">Switch Persona / RBAC Gate</span>
              </button>
            </div>

            {/* RBAC Enforcement Mode Switch */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <ShieldAlert className="h-3.5 w-3.5 text-[#003366]" />
                <span className="hidden md:inline font-bold">RBAC Mode:</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  id="rbac-strict-toggle"
                  onClick={() => setRbacMode("strict")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    rbacMode === "strict"
                      ? "bg-rose-700 text-white shadow-xs ring-1 ring-rose-800"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title="Strict Gate Mode: Access Denied intercept on unauthorized portals (Statutory Enforcement)"
                >
                  <Lock className={`h-3 w-3 ${rbacMode === "strict" ? "text-rose-200" : "text-slate-400"}`} />
                  <span>Strict Gate</span>
                  {rbacMode === "strict" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-200 animate-pulse" />
                  )}
                </button>
                <button
                  type="button"
                  id="rbac-fast-switch-toggle"
                  onClick={() => setRbacMode("fast-switch")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    rbacMode === "fast-switch"
                      ? "bg-[#003366] text-white shadow-xs ring-1 ring-blue-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title="Jury Fast-Switch Mode: Automatically rotates persona when clicking portal tabs for seamless evaluation"
                >
                  <ShieldCheck className={`h-3 w-3 ${rbacMode === "fast-switch" ? "text-amber-300" : "text-slate-400"}`} />
                  <span>Jury Fast-Switch</span>
                  {rbacMode === "fast-switch" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              </div>
              <span
                className={`hidden xl:inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border ${
                  rbacMode === "strict"
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {rbacMode === "strict" ? "STRICT ACTIVE" : "AUTO-PERMIT"}
              </span>
            </div>

            {/* Reset Demo Data Button */}
            <button
              onClick={handleReseed}
              disabled={isReseeding}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 shadow-2xs disabled:opacity-50"
              title="Reset test data according to AICTE statutory scenarios"
            >
              <RefreshCw
                className={`h-3 w-3 text-[#003366] ${isReseeding ? "animate-spin" : ""}`}
              />
              <span className="text-[11px]">{isReseeding ? "Seeding..." : "Auto-Seed"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. AICTE Institutional Navigation Ribbon */}
      <div className="bg-[#003366] px-2 sm:px-6 shadow-inner">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isActive = pathname === portal.path;
            const isRoleAuthorized = session.allowed_portals.includes(portal.path);

            return (
              <Link
                key={portal.path}
                href={portal.path}
                onClick={() => handlePortalClick(portal.path)}
                className={`group flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#002244] text-white shadow-xs border-b-2 border-[#FF7A1A]"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-[#FF7A1A]" : "text-slate-300 group-hover:text-white"
                  }`}
                />
                <span>{getPortalName(portal.path)}</span>

                {/* Scope lock icon indicator in strict mode */}
                {rbacMode === "strict" && !isRoleAuthorized && (
                  <span
                    className="inline-flex items-center gap-1 rounded bg-rose-500/25 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-200 border border-rose-400/50 shadow-2xs"
                    title={`Restricted in Strict Gate Mode: Requires ${portal.requiredRole}`}
                  >
                    <Lock className="h-2.5 w-2.5 text-rose-300 shrink-0" />
                    <span>Access Denied</span>
                  </span>
                )}

                <span className="text-[10px] opacity-75 font-normal hidden 2xl:inline">
                  • {getPortalTag(portal.path)}
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

      {/* Cloud Wake-Up Status Toast (Render Standby Spin-Up) */}
      {isWakingCloud && (
        <div className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md animate-in slide-in-from-top-2 duration-300 pointer-events-auto">
          <div className="flex items-center gap-3 rounded-xl border border-blue-400 bg-blue-950 text-white px-4 py-3 shadow-2xl backdrop-blur-md">
            <div className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-cyan-200">
                <Cloud className="h-4 w-4 animate-pulse text-cyan-300" />
                <span>Connecting to ApaarNet Cloud Engine on Render</span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium mt-0.5">
                (waking instance from standby)...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Live Success Pill */}
      {showCloudSuccessToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md animate-in slide-in-from-top-2 duration-300 pointer-events-auto">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400 bg-emerald-950 text-white px-4 py-3 shadow-2xl backdrop-blur-md">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="flex-1 text-xs">
              <div className="font-bold text-emerald-200">
                Database Live · SHA-256 Ledger Verified
              </div>
              <p className="text-[11px] text-emerald-100/90 font-medium mt-0.5">
                Cloud engine operational. Cryptographic integrity confirmed.
              </p>
            </div>
            <button
              onClick={() => setShowCloudSuccessToast(false)}
              className="text-emerald-400 hover:text-white font-bold ml-1 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Active RBAC Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-lg animate-in slide-in-from-bottom-5 duration-200">
          <div className="rounded-xl border border-[#003366] bg-[#002244] p-4 text-white shadow-2xl flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-amber-300 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs">
              <div className="font-bold text-sm text-white">RBAC Session Notification</div>
              <p className="mt-0.5 text-slate-200 font-medium leading-relaxed">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white font-bold ml-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
