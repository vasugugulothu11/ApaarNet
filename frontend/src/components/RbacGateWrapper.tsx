"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRbac, PORTAL_PRIMARY_ROLES } from "@/context/RbacContext";
import { RbacGateCard } from "@/components/RbacGateCard";
import { RbacAuthModal } from "@/components/RbacAuthModal";

export function RbacGateWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, rbacMode, canAccessPortal, loginRole } = useRbac();

  // Public pages that are never gated
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/landing";

  // When fast-switch mode is active, seamlessly switch persona on navigation
  useEffect(() => {
    if (rbacMode === "fast-switch" && !isPublicPage) {
      const targetRole = PORTAL_PRIMARY_ROLES[pathname];
      if (targetRole && targetRole !== session.role) {
        loginRole(targetRole, session.auth_method).catch(() => {});
      }
    }
  }, [pathname, rbacMode, session.role, session.auth_method, loginRole, isPublicPage]);

  // Check if current role has permission to access the active portal
  const isAllowed = isPublicPage || canAccessPortal(pathname);

  return (
    <>
      {/* Global RBAC Authentication & Persona Switcher Modal */}
      <RbacAuthModal />

      {/* Conditionally render gate card or authorized portal content */}
      {!isAllowed ? <RbacGateCard currentPath={pathname} /> : children}
    </>
  );
}
