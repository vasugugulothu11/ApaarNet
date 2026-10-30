"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  BrainCircuit,
  Scale,
  Database,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Clock,
  Sliders,
  Award,
  FileCheck2,
  Scan,
  LogOut,
  Bell,
  ShieldAlert,
} from "lucide-react";
import { useRbac } from "@/context/RbacContext";
import { LogoMark } from "@/components/Logo";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Strictly Role-Isolated Navigation Menus (Zero Feature Duplication)
const ROLE_NAV_ITEMS: Record<string, NavItem[]> = {
  NATIONAL_ADMIN: [
    { name: "Overview", path: "/dashboard/admin", icon: LayoutGrid },
    { name: "Intelligence Chamber", path: "/intelligence-chamber", icon: BrainCircuit },
    { name: "Dispute Tribunal", path: "/intelligence-chamber?tab=disputes", icon: Scale },
    { name: "Audit Ledger", path: "/dashboard/admin#ledger", icon: Database },
  ],
  INSTITUTION_REGISTRAR: [
    { name: "Overview", path: "/dashboard/registrar", icon: Building2 },
    { name: "Ingestion Sandbox", path: "/dashboard/registrar#sandbox", icon: FileSpreadsheet },
    { name: "Quota Allocations", path: "/dashboard/registrar#quotas", icon: Scale },
    { name: "Commit Registry", path: "/dashboard/registrar#commit", icon: CheckCircle2 },
  ],
  STUDENT_DATA_PRINCIPAL: [
    { name: "Consent Wallet", path: "/dashboard/student", icon: Lock },
    { name: "Pending Requests", path: "/dashboard/student#requests", icon: Clock },
    { name: "Selective Disclosure", path: "/dashboard/student#disclosure", icon: Sliders },
    { name: "Verifiable Identity", path: "/dashboard/student#identity", icon: Award },
  ],
  UNIVERSITY_CONTROLLER: [
    { name: "Degree Studio", path: "/dashboard/coe", icon: Award },
    { name: "Issue W3C Degree", path: "/dashboard/coe#issue", icon: FileCheck2 },
    { name: "Bitstring Revocation", path: "/dashboard/coe#revocation", icon: ShieldAlert },
    { name: "Offline QR Verifier", path: "/dashboard/coe#verify", icon: Scan },
  ],
};

const ROLE_IDENTITIES: Record<string, { name: string; email: string; avatar: string; bg: string }> = {
  NATIONAL_ADMIN: {
    name: "Dr. R. K. Verma",
    email: "admin@aicte-india.org",
    avatar: "👨‍💼",
    bg: "bg-[#ede9fe]",
  },
  INSTITUTION_REGISTRAR: {
    name: "Prof. S. Kulkarni",
    email: "registrar@apex-inst.ac.in",
    avatar: "🏛️",
    bg: "bg-[#dbeafe]",
  },
  STUDENT_DATA_PRINCIPAL: {
    name: "Aarav Sharma",
    email: "aarav.sharma@student.apaar.in",
    avatar: "🧑‍🎓",
    bg: "bg-[#fef3c7]",
  },
  UNIVERSITY_CONTROLLER: {
    name: "Dr. M. Nair",
    email: "coe@tech-univ.ac.in",
    avatar: "🎓",
    bg: "bg-[#e0e7ff]",
  },
};

const ROUTE_CONFIG: Record<string, { title: string; action: string }> = {
  "/dashboard/admin": { title: "Overview", action: "Share insights" },
  "/intelligence-chamber": { title: "Intelligence Chamber", action: "Reload AI Models" },
  "/dashboard/intelligence": { title: "Intelligence Chamber", action: "Reload AI Models" },
  "/dashboard/registrar": { title: "Institution Registrar", action: "New Ingestion" },
  "/dashboard/institution": { title: "Institution Registrar", action: "New Ingestion" },
  "/dashboard/student": { title: "Consent Wallet", action: "Export Pass" },
  "/dashboard/coe": { title: "Degree Studio", action: "Issue Degree" },
  "/dashboard/university": { title: "Degree Studio", action: "Issue Degree" },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  actionButtonText?: string;
  onActionButtonClick?: () => void;
}

export function DashboardLayout({
  children,
  title,
  actionButtonText,
  onActionButtonClick,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useRbac();
  const [currentHash, setCurrentHash] = useState("");

  const activeRole = session.role || "NATIONAL_ADMIN";
  const userPersona = session.persona;
  const navItems = ROLE_NAV_ITEMS[activeRole] || ROLE_NAV_ITEMS.NATIONAL_ADMIN;
  const identity = ROLE_IDENTITIES[activeRole] || ROLE_IDENTITIES.NATIONAL_ADMIN;

  // Track hash changes for sub-navigation pill accuracy
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => setCurrentHash(window.location.hash);
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  const config = ROUTE_CONFIG[pathname] || { title: "Overview", action: "Share insights" };
  const resolvedTitle = title && title !== "Overview" ? title : config.title;
  const resolvedActionText = actionButtonText && actionButtonText !== "Share insights" ? actionButtonText : config.action;

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("apaarnet_session_token");
      localStorage.removeItem("apaarnet_rbac_session");
      localStorage.removeItem("apaarnet_role");
      localStorage.removeItem("apaarnet_dashboard_path");
      localStorage.removeItem("apaarnet_email");
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#232323] flex">
      {/* ============================================================== */}
      {/* 1. FIXED VERTICAL LEFT SIDEBAR (Reference Design: bg-[#232323])*/}
      {/* ============================================================== */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 w-64 bg-[#232323] text-[#a0a0a0] flex flex-col justify-between p-6 select-none shadow-2xl overflow-hidden">
        {/* Subtle CSS/SVG Contour Wave Pattern at Bottom-Left */}
        <div className="absolute -bottom-8 -left-8 w-56 h-56 pointer-events-none opacity-25">
          <svg className="w-full h-full stroke-slate-500 fill-none" viewBox="0 0 200 200">
            <path d="M 0,180 Q 50,140 100,170 T 200,160" strokeWidth="1.2" />
            <path d="M 0,160 Q 50,120 100,150 T 200,140" strokeWidth="1.2" />
            <path d="M 0,140 Q 50,100 100,130 T 200,120" strokeWidth="1.2" />
            <path d="M 0,120 Q 50,80 100,110 T 200,100" strokeWidth="1.2" />
            <path d="M 0,100 Q 50,60 100,90 T 200,80" strokeWidth="1.2" />
            <path d="M 0,80 Q 50,40 100,70 T 200,60" strokeWidth="1.2" />
            <path d="M 0,60 Q 50,20 100,50 T 200,40" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Top: Brand Header & User Persona */}
        <div className="space-y-5 relative z-10">
          <Link href="/" className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80 group">
            <LogoMark className="h-8 w-8" />
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-white group-hover:text-[#b9e303] transition-colors">
                Apaar<span className="text-[#b9e303]">Net</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#a0a0a0]">National Mesh</span>
            </div>
          </Link>

          <div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${identity.bg} text-2xl shadow-inner font-bold text-[#232323]`}>
              <span>{identity.avatar}</span>
            </div>
            <div className="mt-3">
              <h2 className="text-sm font-bold text-white tracking-tight leading-snug truncate">
                {userPersona?.name || identity.name}
              </h2>
              <p className="text-[11px] text-[#a0a0a0] font-mono truncate mt-0.5">
                {identity.email}
              </p>
            </div>
            <div className="mt-2.5">
              <span className="inline-block rounded-md bg-[#b9e303]/15 border border-[#b9e303]/30 px-2 py-0.5 text-[9.5px] font-bold text-[#b9e303] uppercase tracking-wider">
                {activeRole.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Middle: Strictly Role-Permitted Navigation Links */}
          <nav className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const itemBase = item.path.split("#")[0].split("?")[0];
              const itemHash = item.path.includes("#") ? item.path.slice(item.path.indexOf("#")) : "";
              const itemQuery = item.path.includes("?") ? item.path.slice(item.path.indexOf("?")) : "";
              
              // Match active state accurately
              const isActive =
                itemHash
                  ? pathname === itemBase && currentHash === itemHash
                  : itemQuery
                  ? pathname === itemBase && (typeof window !== "undefined" ? window.location.search === itemQuery : false)
                  : pathname === itemBase && !currentHash;

              return (
                <div key={item.name} className="relative">
                  {/* Active White Left-Indicator Pill (Exact Reference Design) */}
                  {isActive && (
                    <span className="absolute -left-6 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full bg-white shadow-sm" />
                  )}

                  <Link
                    href={item.path}
                    className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                      isActive
                        ? "text-white font-semibold"
                        : "text-[#a0a0a0] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#a0a0a0]"}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Clean Logout Button */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 text-xs font-semibold text-[#a0a0a0] hover:text-white transition-colors py-2 group w-full"
          >
            <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MAIN WORKSPACE CANVAS (Offset by w-64, bg-[#F8F9FA])        */}
      {/* ============================================================== */}
      <div className="pl-64 flex-1 min-h-screen flex flex-col bg-[#F8F9FA]">
        {/* Top Header Bar mirroring target reference */}
        <header className="sticky top-0 z-30 bg-[#F8F9FA]/90 backdrop-blur-md px-8 py-5 border-b border-slate-200/60 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#232323] tracking-tight">
              {resolvedTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-[#232323] shadow-2xs transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#b9e303] ring-1 ring-white" />
            </button>

            {/* Dark Action Button (e.g. "Share insights" in Reference) */}
            <button
              type="button"
              onClick={onActionButtonClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#232323] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-black transition-all hover:scale-105 active:scale-95"
            >
              <span>{resolvedActionText}</span>
            </button>
          </div>
        </header>

        {/* Main Body Viewport */}
        <main className="flex-1 p-6 sm:p-8 space-y-8 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
