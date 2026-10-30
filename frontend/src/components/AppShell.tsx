"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/SidebarNav";
import { RbacGateWrapper } from "@/components/RbacGateWrapper";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = pathname === "/" || pathname === "/login";
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // Dashboard routes are strictly role-isolated and protected via /app/dashboard/layout.tsx
  if (isDashboardRoute) {
    return <>{children}</>;
  }

  if (isPublicPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      {/* 1. Left Vertical Dark Navigation Sidebar */}
      <SidebarNav />

      {/* 2. Main Executive Content Canvas (Offset by sidebar width w-20) */}
      <div className="pl-20 min-h-screen flex flex-col bg-[#FCFFF4]">
        {/* Main Content Viewport with RBAC Gate Wrapper */}
        <main className="flex-1 overflow-x-hidden pt-14">
          <RbacGateWrapper>{children}</RbacGateWrapper>
        </main>

        {/* Sleek Executive Footer Strip */}
        <footer className="mt-auto border-t border-[#F2FFC7] bg-white px-8 py-5 text-xs text-slate-500">
          <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>ApaarNet · National Student Data & Quota Verification Mesh</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
              <span className="font-mono">APH 2024–27 Clause 4.2</span>
              <span>•</span>
              <span className="font-mono">Verhoeff D₅ Algorithmic Checksum</span>
              <span>•</span>
              <span className="font-mono">SHA-256 Merkle Ledger</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Statutory Compliance Active
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
