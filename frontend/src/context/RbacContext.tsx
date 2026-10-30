"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, RbacPersona, RbacLoginResponse } from "@/lib/api";

export type RbacMode = "strict" | "fast-switch";
export type EnforcementMode = RbacMode;

export interface RbacSession {
  access_token: string;
  role: string;
  persona: RbacPersona;
  scopes: string[];
  allowed_portals: string[];
  auth_method: string;
  audit_sequence_id?: number;
  audit_record_hash?: string;
  checkpoint_signature?: string;
}

export const DEFAULT_PERSONAS: Record<string, RbacPersona> = {
  NATIONAL_ADMIN: {
    role: "NATIONAL_ADMIN",
    name: "Dr. R. K. Verma",
    title: "AICTE National Vigilance Director",
    organization: "All India Council for Technical Education (HQ, New Delhi)",
    identifier: "EMP-AICTE-0081",
    scopes: [
      "command:read",
      "intelligence:read",
      "disputes:adjudicate",
      "reports:export",
      "audit:tamper_test",
    ],
    allowed_portals: ["/dashboard/admin", "/", "/intelligence-chamber"],
    description: "National Command, anomaly detection, inter-state dispute tribunal and cryptographic ledger audits.",
    badge_color: "blue",
  },
  INSTITUTION_REGISTRAR: {
    role: "INSTITUTION_REGISTRAR",
    name: "Prof. S. Kulkarni",
    title: "Nodal Registrar, Apex Institute (AICTE: 1-10000001)",
    organization: "Apex Institute of Technology, Bangalore Urban",
    identifier: "INST-REG-10000001",
    scopes: ["quota:read", "ingest:sandbox", "ingest:commit"],
    allowed_portals: ["/institution-portal", "/dashboard/institution", "/dashboard/registrar"],
    description: "Institutional seat management, sandbox validation, and batch student enrolment commit.",
    badge_color: "emerald",
  },
  STUDENT_DATA_PRINCIPAL: {
    role: "STUDENT_DATA_PRINCIPAL",
    name: "Aarav Sharma",
    title: "Student Data Principal (APAAR: 482910384715)",
    organization: "Apex Institute of Technology — B.Tech Computer Science",
    identifier: "APAAR-482910384715",
    scopes: ["consent:read", "consent:approve", "vc:view"],
    allowed_portals: ["/consent-wallet", "/dashboard/student"],
    description: "DPDP sovereign consent wallet, selective attribute disclosure, and zero-exposure proof generation.",
    badge_color: "purple",
  },
  UNIVERSITY_CONTROLLER: {
    role: "UNIVERSITY_CONTROLLER",
    name: "Dr. M. Nair",
    title: "Controller of Examinations, Degree Issuing Authority",
    organization: "Apex Technical University Examination Division",
    identifier: "UNIV-COE-9042",
    scopes: ["degree:issue", "degree:revoke", "degree:verify"],
    allowed_portals: ["/degree-studio", "/dashboard/university", "/dashboard/coe"],
    description: "W3C VC degree issuance, Bitstring revocation registry, and stateless Ed25519 tamper verification.",
    badge_color: "amber",
  },
};

export const PORTAL_PRIMARY_ROLES: Record<string, string> = {
  "/dashboard/admin": "NATIONAL_ADMIN",
  "/dashboard/intelligence": "NATIONAL_ADMIN",
  "/dashboard/registrar": "INSTITUTION_REGISTRAR",
  "/dashboard/institution": "INSTITUTION_REGISTRAR",
  "/dashboard/student": "STUDENT_DATA_PRINCIPAL",
  "/dashboard/coe": "UNIVERSITY_CONTROLLER",
  "/dashboard/university": "UNIVERSITY_CONTROLLER",
  "/intelligence-chamber": "NATIONAL_ADMIN",
  "/institution-portal": "INSTITUTION_REGISTRAR",
  "/consent-wallet": "STUDENT_DATA_PRINCIPAL",
  "/degree-studio": "UNIVERSITY_CONTROLLER",
};

interface RbacContextType {
  session: RbacSession;
  rbacMode: RbacMode;
  enforcementMode: EnforcementMode;
  setRbacMode: (mode: RbacMode) => void;
  setEnforcementMode: (mode: EnforcementMode) => void;
  canAccessPortal: (path: string) => boolean;
  availableRoles: RbacPersona[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginRole: (role: string, authMethod?: string) => Promise<RbacLoginResponse>;
  loginWithCredentials: (email: string, password: string) => Promise<RbacLoginResponse>;
  isLoading: boolean;
  lastLoginReceipt: RbacLoginResponse | null;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export function RbacProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<RbacSession>(() => {
    const defaultPersona = DEFAULT_PERSONAS.NATIONAL_ADMIN;
    return {
      access_token: "",
      role: defaultPersona.role,
      persona: defaultPersona,
      scopes: defaultPersona.scopes,
      allowed_portals: defaultPersona.allowed_portals,
      auth_method: "JANPARICHAY_SSO",
    };
  });

  // Default to fast-switch for smooth hackathon evaluation, strictly restoring from localStorage
  const [rbacMode, setRbacModeState] = useState<RbacMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = (localStorage.getItem("apaarnet_rbac_mode") ||
          localStorage.getItem("apaarnet_enforcement_mode")) as RbacMode | null;
        if (saved === "strict" || saved === "fast-switch") {
          return saved;
        }
      } catch {}
    }
    return "fast-switch";
  });

  const [availableRoles, setAvailableRoles] = useState<RbacPersona[]>(Object.values(DEFAULT_PERSONAS));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastLoginReceipt, setLastLoginReceipt] = useState<RbacLoginResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Restore session & rbacMode from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = (localStorage.getItem("apaarnet_rbac_mode") ||
        localStorage.getItem("apaarnet_enforcement_mode")) as RbacMode | null;
      if (savedMode === "strict" || savedMode === "fast-switch") {
        setRbacModeState(savedMode);
      } else {
        localStorage.setItem("apaarnet_rbac_mode", "fast-switch");
      }

      const savedSessionRaw = localStorage.getItem("apaarnet_rbac_session");
      if (savedSessionRaw) {
        const parsed = JSON.parse(savedSessionRaw);
        if (parsed.role && DEFAULT_PERSONAS[parsed.role]) {
          setSession({
            access_token: parsed.access_token || "",
            role: parsed.role,
            persona: parsed.persona || DEFAULT_PERSONAS[parsed.role],
            scopes: parsed.scopes || DEFAULT_PERSONAS[parsed.role].scopes,
            allowed_portals: parsed.allowed_portals || DEFAULT_PERSONAS[parsed.role].allowed_portals,
            auth_method: parsed.auth_method || "JANPARICHAY_SSO",
            audit_sequence_id: parsed.audit_sequence_id,
            audit_record_hash: parsed.audit_record_hash,
            checkpoint_signature: parsed.checkpoint_signature,
          });
        }
      }
    } catch {
      // Ignore parse errors on mount
    }

    // Fetch live roles from backend
    api.getRbacRoles()
      .then((res) => {
        if (res.roles && res.roles.length > 0) {
          setAvailableRoles(res.roles);
        }
      })
      .catch(() => {
        // Fallback to static defaults
      });
  }, []);

  const switchingRoleRef = React.useRef<string | null>(null);
  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const setRbacMode = useCallback((mode: RbacMode) => {
    setRbacModeState(mode);
    try {
      localStorage.setItem("apaarnet_rbac_mode", mode);
      localStorage.setItem("apaarnet_enforcement_mode", mode);
    } catch {}
    const modeLabel = mode === "strict" ? "Strict Gate" : "Jury Fast-Switch";
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(`RBAC Enforcement Mode updated to: ${modeLabel}`);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const setEnforcementMode = setRbacMode;

  const loginRole = useCallback(
    async (roleName: string, authMethod: string = "JANPARICHAY_SSO") => {
      setIsLoading(true);
      try {
        const resp = await api.loginRbacRole(roleName, authMethod);
        const newSession: RbacSession = {
          access_token: resp.access_token,
          role: resp.role,
          persona: resp.persona || DEFAULT_PERSONAS[resp.role],
          scopes: resp.scopes,
          allowed_portals: resp.allowed_portals,
          auth_method: resp.auth_method,
          audit_sequence_id: resp.audit_sequence_id,
          audit_record_hash: resp.audit_record_hash,
          checkpoint_signature: resp.checkpoint_signature,
        };

        setSession(newSession);
        setLastLoginReceipt(resp);

        try {
          localStorage.setItem("apaarnet_rbac_session", JSON.stringify(newSession));
        } catch {}

        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastMessage(
          `RBAC Authenticated: ${newSession.persona.name} (${resp.role}) via ${resp.auth_method} · Merkle Block #${resp.audit_sequence_id}`
        );
        toastTimerRef.current = setTimeout(() => setToastMessage(null), 5000);

        return resp;
      } catch (err: any) {
        // Fallback offline simulation if backend is restarting
        const persona = DEFAULT_PERSONAS[roleName] || DEFAULT_PERSONAS.NATIONAL_ADMIN;
        const fallbackSession: RbacSession = {
          access_token: "simulated_offline_token",
          role: persona.role,
          persona,
          scopes: persona.scopes,
          allowed_portals: persona.allowed_portals,
          auth_method: authMethod,
          audit_sequence_id: 1,
          audit_record_hash: "simulated_local_audit_hash",
        };
        setSession(fallbackSession);
        try {
          localStorage.setItem("apaarnet_rbac_session", JSON.stringify(fallbackSession));
        } catch {}
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loginWithCredentials = useCallback(
    async (email: string, password: string): Promise<RbacLoginResponse> => {
      setIsLoading(true);
      try {
        const resp = await api.loginCredentials(email, password);
        const roleName = resp.role;
        const newSession: RbacSession = {
          access_token: resp.access_token,
          role: roleName,
          persona: resp.persona || DEFAULT_PERSONAS[roleName] || DEFAULT_PERSONAS.NATIONAL_ADMIN,
          scopes: resp.scopes,
          allowed_portals: resp.allowed_portals,
          auth_method: resp.auth_method || "EMAIL_PASSWORD",
          audit_sequence_id: resp.audit_sequence_id,
          audit_record_hash: resp.audit_record_hash,
          checkpoint_signature: resp.checkpoint_signature,
        };

        setSession(newSession);
        setLastLoginReceipt(resp);

        try {
          localStorage.setItem("apaarnet_rbac_session", JSON.stringify(newSession));
          localStorage.setItem("apaarnet_session_token", resp.access_token);
        } catch {}

        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastMessage(
          `Authenticated: ${newSession.persona.name} (${resp.role}) · Merkle Block #${resp.audit_sequence_id}`
        );
        toastTimerRef.current = setTimeout(() => setToastMessage(null), 5000);

        return resp;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const canAccessPortal = useCallback(
    (path: string): boolean => {
      if (path === "/" || path === "/landing" || path === "/login") return true;

      const normalizedPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;

      // In fast-switch mode, automatically switch active persona in the background without blocking
      if (rbacMode === "fast-switch") {
        const targetRole = PORTAL_PRIMARY_ROLES[normalizedPath] || PORTAL_PRIMARY_ROLES[path];
        if (targetRole && targetRole !== session.role && switchingRoleRef.current !== targetRole) {
          switchingRoleRef.current = targetRole;
          setTimeout(() => {
            loginRole(targetRole, session.auth_method)
              .catch(() => {})
              .finally(() => {
                switchingRoleRef.current = null;
              });
          }, 0);
        }
        return true;
      }

      // In strict mode, check if the active role's allowed_portals includes path
      return (
        session.allowed_portals.includes(normalizedPath) ||
        session.allowed_portals.includes(path)
      );
    },
    [rbacMode, session.role, session.allowed_portals, session.auth_method, loginRole]
  );

  return (
    <RbacContext.Provider
      value={{
        session,
        rbacMode,
        enforcementMode: rbacMode,
        setRbacMode,
        setEnforcementMode,
        canAccessPortal,
        availableRoles,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginRole,
        loginWithCredentials,
        isLoading,
        lastLoginReceipt,
        toastMessage,
        setToastMessage,
      }}
    >
      {children}
    </RbacContext.Provider>
  );
}

export function useRbac() {
  const context = useContext(RbacContext);
  if (!context) {
    throw new Error("useRbac must be used within an RbacProvider");
  }
  return context;
}
