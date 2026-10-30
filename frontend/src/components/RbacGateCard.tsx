"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Lock,
  Building2,
  BrainCircuit,
  Award,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useRbac, PORTAL_PRIMARY_ROLES, DEFAULT_PERSONAS } from "@/context/RbacContext";

interface RbacGateCardProps {
  currentPath: string;
}

const PORTAL_REQUIRED_SCOPES: Record<string, string> = {
  "/": "command:read",
  "/intelligence-chamber": "intelligence:read",
  "/institution-portal": "quota:read",
  "/consent-wallet": "consent:read",
  "/degree-studio": "degree:issue",
};

export function RbacGateCard({ currentPath }: RbacGateCardProps) {
  const { session, loginRole, isLoading, lastLoginReceipt, availableRoles, setEnforcementMode } = useRbac();
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<string>("JANPARICHAY_SSO");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const targetRole = PORTAL_PRIMARY_ROLES[currentPath] || "NATIONAL_ADMIN";
  const requiredScope = PORTAL_REQUIRED_SCOPES[currentPath] || "command:read";
  const targetPersona = DEFAULT_PERSONAS[targetRole] || DEFAULT_PERSONAS.NATIONAL_ADMIN;

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await loginRole(targetRole, selectedAuthMethod);
    } catch {
      // Handled in context
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      {/* Access Denied Interception Banner */}
      <div className="rounded-2xl border-2 border-rose-300 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-rose-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 border border-rose-200">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-900 border border-rose-300">
                  Access Denied — Insufficient RBAC Clearance
                </span>
                <span className="rounded bg-[#F7FFDD] px-2 py-0.5 text-xs font-bold text-[#0B0F19] border border-[#F2FFC7]">
                  Statutory RBAC Security Gate
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Access Denied — Insufficient RBAC Clearance
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Your active stakeholder persona does not possess the required security scope for this statutory portal under AICTE APH guidelines.
                Missing cryptographic scope: <code className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-xs font-bold text-rose-800 border border-rose-200">&apos;{requiredScope}&apos;</code>.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4] p-3 text-xs text-right sm:text-right shrink-0">
            <div className="text-slate-500 font-medium">Target Portal:</div>
            <div className="font-mono font-bold text-[#0B0F19] text-sm">{currentPath}</div>
          </div>
        </div>

        {/* Current vs Required Persona Comparison */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Active Session (Unauthorized) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Your Active Session
              </span>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-800 font-mono">
                {session.role}
              </span>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{session.persona.name}</div>
              <div className="text-xs text-slate-600">{session.persona.title}</div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">Active Scopes:</div>
              <div className="flex flex-wrap gap-1">
                {session.scopes.map((s) => (
                  <span
                    key={s}
                    className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Required Authorized Persona */}
          <div className="rounded-xl border border-[#EDFFB1] bg-[#FCFFF4] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B0F19]">
                Required Authorized Role
              </span>
              <span className="rounded bg-[#E5FF8F] px-2 py-0.5 text-[10px] font-bold text-[#0B0F19] border border-[#E5FF8F] font-mono">
                {targetRole}
              </span>
            </div>
            <div>
              <div className="font-bold text-[#0B0F19] text-sm">{targetPersona.name}</div>
              <div className="text-xs text-slate-600">{targetPersona.title}</div>
            </div>
            <div className="pt-2 border-t border-[#F2FFC7] text-xs">
              <div className="text-[11px] font-semibold text-[#0B0F19] mb-1">Required Scope:</div>
              <div className="inline-block rounded bg-[#F7FFDD] px-2 py-0.5 font-mono text-xs font-bold text-[#0B0F19] border border-[#F2FFC7]">
                {requiredScope}
              </div>
            </div>
          </div>
        </div>

        {/* 1-Click Authenticate Action Strip */}
        <div className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0B0F19]">
                Authenticate as {targetPersona.name} ({targetRole})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Simulate official Government Single Sign-On to gain immediate statutory clearance for this module.
              </p>
            </div>

            {/* Auth Method Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[#F2FFC7] bg-white p-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedAuthMethod("JANPARICHAY_SSO")}
                className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                  selectedAuthMethod === "JANPARICHAY_SSO"
                    ? "bg-[#0B0F19] text-[#E5FF8F]"
                    : "text-slate-600 hover:text-[#0B0F19]"
                }`}
              >
                JanParichay
              </button>
              <button
                type="button"
                onClick={() => setSelectedAuthMethod("DIGILOCKER_OAUTH")}
                className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                  selectedAuthMethod === "DIGILOCKER_OAUTH"
                    ? "bg-[#0B0F19] text-[#E5FF8F]"
                    : "text-slate-600 hover:text-[#0B0F19]"
                }`}
              >
                DigiLocker
              </button>
              <button
                type="button"
                onClick={() => setSelectedAuthMethod("PASSKEY_2FA")}
                className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                  selectedAuthMethod === "PASSKEY_2FA"
                    ? "bg-[#0B0F19] text-[#E5FF8F]"
                    : "text-slate-600 hover:text-[#0B0F19]"
                }`}
              >
                Passkey
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isLoading || isUnlocking}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B0F19] border border-[#E5FF8F]/40 px-5 py-3 text-sm font-semibold text-[#E5FF8F] shadow-sm hover:bg-black transition-all disabled:opacity-50"
            >
              {isUnlocking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#E5FF8F]" />
                  <span>Authenticating via {selectedAuthMethod} & Anchoring Merkle Block...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 text-[#E5FF8F]" />
                  <span>1-Click Authenticate as Required Role ({targetRole})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setEnforcementMode("fast-switch")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#F2FFC7] bg-white px-4 py-3 text-xs font-semibold text-[#0B0F19] hover:bg-[#F7FFDD] transition-colors"
            >
              <span>Disable Strict Gate (Jury Mode)</span>
            </button>
          </div>
        </div>

        {/* Live Merkle Audit Receipt if available */}
        {lastLoginReceipt && (
          <div className="rounded-xl border border-[#EDFFB1] bg-[#FCFFF4] p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B0F19] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                RBAC Session Cryptographically Anchored
              </span>
              <span className="rounded bg-[#E5FF8F] px-2 py-0.5 font-mono text-[10px] font-bold text-[#0B0F19] border border-[#E5FF8F]">
                Block #{lastLoginReceipt.audit_sequence_id}
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-700 truncate">
              SHA-256 Digest: {lastLoginReceipt.audit_record_hash}
            </div>
          </div>
        )}
      </div>

      {/* Official 4-Role Permission Matrix Reference Card */}
      <div className="rounded-2xl border border-[#F2FFC7] bg-white p-6 sm:p-8 space-y-5 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Statutory Compliance Matrix
          </span>
          <h3 className="text-lg font-bold text-[#0B0F19] mt-0.5">
            Stakeholder Role-Based Access Control (RBAC) Permission Matrix
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Official mapping of stakeholder roles, authorized operations, and designated portal environments.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#F2FFC7] bg-[#FCFFF4] text-[#0B0F19] font-bold uppercase tracking-wide text-[10.5px]">
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Stakeholder Persona</th>
                <th className="py-2.5 px-3">Authorized Portals</th>
                <th className="py-2.5 px-3">Statutory Scopes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {availableRoles.map((r) => {
                const isSelected = r.role === targetRole;
                return (
                  <tr
                    key={r.role}
                    className={`transition-colors ${
                      isSelected ? "bg-[#FCFFF4] font-semibold" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-[#0B0F19]">
                      <span className="rounded bg-[#FCFFF4] px-2 py-0.5 border border-[#F2FFC7] text-[#0B0F19]">
                        {r.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-900">
                      <div className="font-bold">{r.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{r.title}</div>
                    </td>
                    <td className="py-3 px-3 text-[#0B0F19]">
                      {r.allowed_portals.join(", ")}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {r.scopes.map((sc) => (
                          <span
                            key={sc}
                            className="rounded bg-slate-100 px-1 py-0.2 text-[9px] text-slate-600 border border-slate-200 font-normal"
                          >
                            {sc}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
