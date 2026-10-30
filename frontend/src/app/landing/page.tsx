import React from "react";
import Link from "next/link";
import {
  Globe,
  Building2,
  BrainCircuit,
  Lock,
  Award,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Database,
  Sliders,
  CheckCircle2,
  FileText,
  BadgeCheck,
} from "lucide-react";

export const metadata = {
  title: "ApaarNet | National Student Data & Quota Verification Mesh",
  description:
    "Unified verification infrastructure for higher education admissions, statutory supernumerary quotas, and tamper-proof academic credentials.",
};

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Banner */}
      <section className="space-y-6 pt-2 max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-[#003366] shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-[#FF7A1A]" />
          <span>Statutory Quota & Enrolment Verification Framework · APH 2024–27 Alignment</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-bold tracking-wider uppercase text-[#0A4D8C]">
            राष्ट्रीय छात्र डेटा एवं कोटा सत्यापन नेटवर्क
          </h2>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#003366] leading-tight">
            National Student Data & Statutory Quota Verification Mesh
          </h1>
        </div>

        <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl">
          An authoritative digital infrastructure unifying APAAR identity verification,
          Approval Process Handbook (APH 2024–27) statutory supernumerary quota ledgers, cross-institution
          concurrent enrolment telemetry, and tamper-evident W3C digital credentials for higher education.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#003366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#002244] hover:shadow"
          >
            <span>Enter National Command</span>
            <ArrowRight className="h-4 w-4 text-amber-300" />
          </Link>

          <Link
            href="/institution-portal"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-400"
          >
            <Building2 className="h-4 w-4 text-[#003366]" />
            <span>Institution Registrar Portal</span>
          </Link>
        </div>
      </section>

      {/* Official Government Validation Metrics Row */}
      <section className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-4">
        <div className="border-r border-slate-100 last:border-0 pr-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Coverage</div>
          <div className="mt-1 font-mono text-3xl font-extrabold text-[#003366]">50</div>
          <div className="mt-1 text-xs text-slate-700 font-medium">Institutions across 10 States</div>
        </div>
        <div className="border-r border-slate-100 last:border-0 pr-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Algorithm</div>
          <div className="mt-1 font-mono text-3xl font-extrabold text-[#003366]">D₅ Check</div>
          <div className="mt-1 text-xs text-slate-700 font-medium">Verhoeff Dihedral Checksum</div>
        </div>
        <div className="border-r border-slate-100 last:border-0 pr-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Cryptographic Seal</div>
          <div className="mt-1 font-mono text-3xl font-extrabold text-[#003366]">SHA-256</div>
          <div className="mt-1 text-xs text-slate-700 font-medium">Multi-Node Merkle Audit Ledger</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Privacy Mandate</div>
          <div className="mt-1 font-mono text-3xl font-extrabold text-[#046A38]">DPDP Act</div>
          <div className="mt-1 text-xs text-slate-700 font-medium">Zero-Exposure Selective Disclosure</div>
        </div>
      </section>

      {/* Statutory Pillars */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A1A]">
            Regulatory Architecture
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#003366] mt-0.5">
            Statutory Governance & Quota Architecture
          </h2>
          <p className="mt-1 text-sm text-slate-700 font-medium">
            Engineered to eliminate false quota violations, safeguard student privacy, and enforce national statutory guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Card 1 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-[#003366]/40 hover:shadow-sm transition-all space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#003366]">
              <Sliders className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[#003366]">
              Statutory Supernumerary Quota Ledger
            </h3>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Strictly distinguishes base sanctioned intake from statutory 15% supernumerary seats
              (Foreign Nationals, OCI, CIWGC, PMSSS, TFW) under APH 2024–27 guidelines, preventing false penalty issuance.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-[#003366]/40 hover:shadow-sm transition-all space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-[#0A4D8C]">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[#003366]">
              Cross-State Enrolment Intelligence
            </h3>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Jaro-Winkler phonetic disambiguation flags fraudulent concurrent regular admissions
              while lawfully recognizing dual-degree programs (e.g., physical engineering + online degree).
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-[#003366]/40 hover:shadow-sm transition-all space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#046A38]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[#003366]">
              Cryptographic SHA-256 Audit Ledger
            </h3>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              PostgreSQL row-level SHA-256 hash chaining with Ed25519 digital signatures.
              Prevents retroactive backdated record tampering with instant mathematical tamper detection.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-[#003366]/40 hover:shadow-sm transition-all space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[#003366]">
              DPDP Act Zero-Exposure Consent Wallet
            </h3>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Enables students to generate cryptographic zero-exposure verification proofs (e.g. proof of age 18+,
              valid CGPA &gt; 7.5) for employers and agencies without disclosing raw identifiers.
            </p>
          </div>
        </div>
      </section>

      {/* Portal Modules Access Grid */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A1A]">
            Portal Ecosystem
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#003366] mt-0.5">
            Operational Portals & Workspaces
          </h2>
          <p className="mt-1 text-sm text-slate-700 font-medium">
            Dedicated portals configured for statutory compliance officers, institutional registrars, intelligence officers, and students.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#003366] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#003366]">
                <Globe className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-[#003366] transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-3 text-sm font-bold text-[#003366]">National Command</div>
            <p className="mt-1 text-xs text-slate-700 font-medium leading-normal">
              Statewide telemetry, APH statutory quota comparisons, and Merkle audit verification.
            </p>
          </Link>

          <Link
            href="/institution-portal"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#003366] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-[#0A4D8C]">
                <Building2 className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-[#003366] transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-3 text-sm font-bold text-[#003366]">Institution Registrar</div>
            <p className="mt-1 text-xs text-slate-700 font-medium leading-normal">
              ERP schema drift mapping, sandbox validation diffs, and cryptographic batch commit.
            </p>
          </Link>

          <Link
            href="/intelligence-chamber"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#003366] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-[#003366] transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-3 text-sm font-bold text-[#003366]">Intelligence Chamber</div>
            <p className="mt-1 text-xs text-slate-700 font-medium leading-normal">
              Ghost-ring graph analysis, risk rankings, and tri-party dispute resolution console.
            </p>
          </Link>

          <Link
            href="/consent-wallet"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#003366] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                <Lock className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-[#003366] transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-3 text-sm font-bold text-[#003366]">Consent Wallet</div>
            <p className="mt-1 text-xs text-slate-700 font-medium leading-normal">
              DPDP Act zero-exposure predicate verification and selective attribute disclosure.
            </p>
          </Link>

          <Link
            href="/degree-studio"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#003366] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#046A38]">
                <Award className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-[#003366] transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-3 text-sm font-bold text-[#003366]">Degree Studio</div>
            <p className="mt-1 text-xs text-slate-700 font-medium leading-normal">
              Official degree parchment issuance and stateless offline QR verification engine.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
