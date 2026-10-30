"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRbac } from "@/context/RbacContext";
import { Loader2 } from "lucide-react";

const ROLE_DASHBOARD_ROUTES: Record<string, string> = {
  NATIONAL_ADMIN: "/dashboard/admin",
  INSTITUTION_REGISTRAR: "/dashboard/registrar",
  STUDENT_DATA_PRINCIPAL: "/dashboard/student",
  UNIVERSITY_CONTROLLER: "/dashboard/coe",
};

export default function DashboardIndexPage() {
  const router = useRouter();
  const { session } = useRbac();

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
      router.replace("/login");
      return;
    }

    const role = storedRole || session.role || "NATIONAL_ADMIN";
    const targetPath = storedPath || ROLE_DASHBOARD_ROUTES[role] || "/dashboard/admin";
    router.replace(targetPath);
  }, [router, session]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center space-y-3">
      <Loader2 className="h-6 w-6 animate-spin text-[#232323]" />
      <span className="text-xs font-mono text-slate-500 font-semibold">
        Routing to your authorized dashboard...
      </span>
    </div>
  );
}
