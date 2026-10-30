"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Building2,
  BrainCircuit,
  Award,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  Fingerprint,
  RefreshCw,
  X,
  FileCheck2,
} from "lucide-react";
import { useRbac } from "@/context/RbacContext";

export function RbacAuthModal() {
  const {
    session,
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginRole,
    isLoading,
    lastLoginReceipt,
    availableRoles,
    enforcementMode,
    setEnforcementMode,
  } = useRbac();

  const [selectedAuthMethod, setSelectedAuthMethod] = useState<string>("JANPARICHAY_SSO");
  const [authenticatingRole, setAuthenticatingRole] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSelectAndLogin = async (roleName: string) => {
    setAuthenticatingRole(roleName);
    try {
      await loginRole(roleName, selectedAuthMethod);
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 1200);
    } catch {
      // Handled in context
    } finally {
      setAuthenticatingRole(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "NATIONAL_ADMIN":
        return BrainCircuit;
      case "INSTITUTION_REGISTRAR":
        return Building2;
      case "STUDENT_DATA_PRINCIPAL":
        return Lock;
      case "UNIVERSITY_CONTROLLER":
        return Award;
      default:
        return ShieldCheck;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-300 bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F2FFC7] bg-[#FCFFF4] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0F19] text-[#E5FF8F] shadow-xs">
              <KeyRound className="h-5 w-5 text-[#E5FF8F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0B0F19]">
                  AICTE Approval Handbook — RBAC Authentication Gate
                </h3>
                <span className="rounded bg-[#F7FFDD] px-2 py-0.5 text-[10px] font-bold text-[#0B0F19] border border-[#F2FFC7]">
                  JanParichay / DigiLocker SSO
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Switch between statutory stakeholder personas to evaluate role-based scopes and portal access.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-[#F7FFDD] hover:text-[#0B0F19] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SSO Authentication Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Identity Provider Gateway:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAuthMethod("JANPARICHAY_SSO")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selectedAuthMethod === "JANPARICHAY_SSO"
                    ? "border-[#0B0F19] bg-[#F7FFDD] shadow-xs ring-1 ring-[#0B0F19]"
                    : "border-[#F2FFC7] bg-white hover:bg-[#FCFFF4]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B0F19]">NIC JanParichay</span>
                  <span className="rounded bg-[#0B0F19] px-1.5 py-0.2 text-[9px] font-bold text-[#E5FF8F]">
                    Gov SSO
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  National Single Sign-On service for verified ministry & institutional officers.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAuthMethod("DIGILOCKER_OAUTH")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selectedAuthMethod === "DIGILOCKER_OAUTH"
                    ? "border-[#0B0F19] bg-[#F7FFDD] shadow-xs ring-1 ring-[#0B0F19]"
                    : "border-[#F2FFC7] bg-white hover:bg-[#FCFFF4]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B0F19]">DigiLocker Identity</span>
                  <span className="rounded bg-[#0B0F19] px-1.5 py-0.2 text-[9px] font-bold text-[#E5FF8F]">
                    OAuth 2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Aadhaar-linked OTP authentication with verified Academic Bank of Credits data.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAuthMethod("PASSKEY_2FA")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selectedAuthMethod === "PASSKEY_2FA"
                    ? "border-[#0B0F19] bg-[#F7FFDD] shadow-xs ring-1 ring-[#0B0F19]"
                    : "border-[#F2FFC7] bg-white hover:bg-[#FCFFF4]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B0F19]">FIDO2 Passkey</span>
                  <span className="rounded bg-[#0B0F19] px-1.5 py-0.2 text-[9px] font-bold text-[#E5FF8F]">
                    WebAuthn
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Hardware-bound cryptographic biometric authentication with zero shared secrets.
                </p>
              </button>
            </div>
          </div>

          {/* Active Session Status */}
          <div className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Currently Active Session:</span>
              <span className={`rounded px-2 py-0.5 text-xs font-bold border ${getRoleBadgeStyle(session.role)}`}>
                {session.role}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-[#0B0F19]">{session.persona.name}</span>
                <span className="text-slate-600 block text-[11px]">{session.persona.title}</span>
              </div>
              <div className="text-slate-600 text-right sm:text-right font-mono text-[11px]">
                Auth via: <span className="font-bold text-[#0B0F19]">{session.auth_method}</span>
              </div>
            </div>
          </div>

          {/* 4 RBAC Personas Selection Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Authenticate as Stakeholder Persona:
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                1-Click token rotation & Merkle audit logging
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {availableRoles.map((roleObj) => {
                const Icon = getRoleIcon(roleObj.role);
                const isCurrent = session.role === roleObj.role;
                const isAuthTarget = authenticatingRole === roleObj.role;

                return (
                  <div
                    key={roleObj.role}
                    className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                      isCurrent
                        ? "border-[#0B0F19] bg-[#FCFFF4] shadow-xs ring-2 ring-[#0B0F19]"
                        : "border-[#F2FFC7] bg-white hover:border-[#EDFFB1] hover:shadow-xs"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCFFF4] border border-[#F2FFC7] text-[#0B0F19]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${getRoleBadgeStyle(roleObj.role)}`}>
                              {roleObj.role}
                            </span>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B0F19]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Active
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-[#0B0F19]">{roleObj.name}</h4>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{roleObj.title}</p>
                        <p className="text-[11px] text-slate-700 mt-1.5 leading-relaxed">
                          {roleObj.description}
                        </p>
                      </div>

                      {/* Scopes Chips */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Granted Scopes ({roleObj.scopes.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {roleObj.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="rounded bg-[#FCFFF4] px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-slate-700 border border-[#F2FFC7]"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Allowed Portals */}
                      <div className="text-[10px] text-slate-600">
                        <span className="font-semibold text-slate-700">Portals:</span>{" "}
                        {roleObj.allowed_portals.join(", ")}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#F2FFC7]">
                      <button
                        type="button"
                        onClick={() => handleSelectAndLogin(roleObj.role)}
                        disabled={isLoading || isAuthTarget}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                          isCurrent
                            ? "border border-[#F2FFC7] bg-white text-[#0B0F19] hover:bg-[#F7FFDD]"
                            : "bg-[#0B0F19] text-[#E5FF8F] hover:bg-black shadow-xs"
                        } disabled:opacity-50`}
                      >
                        {isAuthTarget ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Authenticating via {selectedAuthMethod}...</span>
                          </>
                        ) : isCurrent ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Re-authenticate Session</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="h-3.5 w-3.5 text-[#E5FF8F]" />
                            <span>1-Click Authenticate as {roleObj.role}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Merkle Audit Ledger Receipt */}
          {(lastLoginReceipt || session.audit_sequence_id) && (() => {
            const receipt = lastLoginReceipt || {
              audit_sequence_id: session.audit_sequence_id,
              audit_record_hash: session.audit_record_hash,
              checkpoint_signature: session.checkpoint_signature,
            };
            return (
              <div className="rounded-xl border border-[#EDFFB1] bg-[#FCFFF4] p-4 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B0F19] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Session Authenticated & Anchored to Merkle Audit Ledger
                  </span>
                  <span className="rounded bg-[#E5FF8F] px-2 py-0.5 font-mono text-[10px] font-bold text-[#0B0F19] border border-[#E5FF8F]">
                    Block #{receipt.audit_sequence_id}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-700 pt-1 border-t border-[#F2FFC7]">
                  <div className="truncate">
                    <span className="font-sans font-semibold text-slate-800">SHA-256 Digest:</span>{" "}
                    {receipt.audit_record_hash}
                  </div>
                  {receipt.checkpoint_signature && (
                    <div className="truncate text-slate-800">
                      <span className="font-sans font-semibold">Ed25519 Seal:</span>{" "}
                      {receipt.checkpoint_signature.substring(0, 48)}...
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Mode Selector Toggle within Modal */}
          <div className="rounded-xl border border-[#F2FFC7] bg-[#FCFFF4] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-800">RBAC Enforcement Mode:</span>
              <p className="text-[11px] text-slate-600">
                {enforcementMode === "strict"
                  ? "Strict Gate: Blocks unauthorized portal navigation with statutory access challenge."
                  : "Direct Fast-Switch: Seamlessly rotates tokens in background when clicking portal tabs."}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[#F2FFC7] bg-white p-1">
              <button
                type="button"
                onClick={() => setEnforcementMode("strict")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                  enforcementMode === "strict"
                    ? "bg-[#0B0F19] text-[#E5FF8F] shadow-2xs"
                    : "text-slate-600 hover:text-[#0B0F19]"
                }`}
              >
                Strict Gate
              </button>
              <button
                type="button"
                onClick={() => setEnforcementMode("fast-switch")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                  enforcementMode === "fast-switch"
                    ? "bg-[#0B0F19] text-[#E5FF8F] shadow-2xs"
                    : "text-slate-600 hover:text-[#0B0F19]"
                }`}
              >
                Jury Fast-Switch
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#F2FFC7] bg-[#FCFFF4] px-6 py-3 flex items-center justify-between text-xs text-slate-600">
          <div>AICTE Approval Process Handbook (APH 2024–27) RBAC Matrix</div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="rounded-lg border border-[#F2FFC7] bg-white px-4 py-1.5 font-semibold text-[#0B0F19] hover:bg-[#F7FFDD] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
