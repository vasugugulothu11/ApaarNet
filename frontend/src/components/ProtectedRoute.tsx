"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Lock, ArrowRight, ArrowLeft, RefreshCw, KeyRound } from "lucide-react";
import { useRbac } from "@/context/RbacContext";

const DASHBOARD_ROLE_REQUIREMENTS: Record<string, string> = {
  "/dashboard/admin": "NATIONAL_ADMIN",
  "/dashboard/intelligence": "NATIONAL_ADMIN",
  "/intelligence-chamber": "NATIONAL_ADMIN",
  "/dashboard/registrar": "INSTITUTION_REGISTRAR",
  "/dashboard/institution": "INSTITUTION_REGISTRAR",
  "/dashboard/student": "STUDENT_DATA_PRINCIPAL",
  "/dashboard/coe": "UNIVERSITY_CONTROLLER",
  "/dashboard/university": "UNIVERSITY_CONTROLLER",
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useRbac();

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDashboardPath, setUserDashboardPath] = useState<string>("/login");

  // Determine required role for current route
  const expectedRole =
    requiredRole ||
    DASHBOARD_ROLE_REQUIREMENTS[pathname] ||
    Object.entries(DASHBOARD_ROLE_REQUIREMENTS).find(([p]) => pathname.startsWith(p))?.[1] ||
    "NATIONAL_ADMIN";

  useEffect(() => {
    let token: string | null = null;
    let storedRole: string | null = null;
    let storedPath: string | null = null;

    if (typeof window !== "undefined") {
      token = localStorage.getItem("apaarnet_session_token");
      storedRole = localStorage.getItem("apaarnet_role");
      storedPath = localStorage.getItem("apaarnet_dashboard_path");
    }

    if (!token && !session.access_token) {
      // Unauthenticated: kick immediately back to /login
      setIsAuthenticated(false);
      setIsChecking(false);
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Decode JWT payload
    const activeToken = token || session.access_token;
    const claims = parseJwt(activeToken);

    const activeRole = claims?.role || storedRole || session.role;
    const roleDashboardMap: Record<string, string> = {
      NATIONAL_ADMIN: "/dashboard/admin",
      INSTITUTION_REGISTRAR: "/dashboard/institution",
      STUDENT_DATA_PRINCIPAL: "/dashboard/student",
      UNIVERSITY_CONTROLLER: "/dashboard/university",
    };
    const allowedPath =
      roleDashboardMap[activeRole] ||
      claims?.allowed_dashboard_path ||
      storedPath ||
      "/dashboard/admin";

    setIsAuthenticated(true);
    setUserRole(activeRole);
    setUserDashboardPath(allowedPath);
    setIsChecking(false);
  }, [pathname, session, router]);

  // Initial checking state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-[#232323]" />
        <span className="text-xs font-mono text-slate-500 font-semibold">
          Verifying JWT security clearance...
        </span>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Role Mismatch: Strict Access Denied Screen
  const isAuthorized = userRole === expectedRole;
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 select-none">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xl space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-xs font-bold text-rose-800">
              <Lock className="h-3.5 w-3.5" />
              <span>403 FORBIDDEN • STATUTORY RBAC GATE</span>
            </div>
            <h1 className="text-2xl font-black text-[#232323] tracking-tight">
              Access Denied — Insufficient Role Clearance
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Your active session is authenticated as{" "}
              <strong className="text-[#232323] font-mono">{userRole || "UNKNOWN"}</strong>, which does not have
              clearance to access this route.
            </p>
          </div>

          {/* Role Comparison Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2 text-left font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Route Requested:</span>
              <span className="font-bold text-[#232323]">{pathname}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Clearance Required:</span>
              <span className="font-bold text-rose-700">{expectedRole}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Your Active Role:</span>
              <span className="font-bold text-slate-800">{userRole}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-2">
            <Link
              href={userDashboardPath}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#232323] py-3 text-xs font-bold text-white shadow-md hover:bg-black transition-all"
            >
              <span>Return to My Authorized Dashboard</span>
              <ArrowRight className="h-4 w-4 text-[#b9e303]" />
            </Link>

            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              <span>Switch Stakeholder Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authorized: Render dashboard route content
  return <>{children}</>;
}
