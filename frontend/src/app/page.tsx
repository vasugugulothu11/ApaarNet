"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  Scale,
  GitCompare,
  Network,
  Award,
  CheckCircle2,
  Lock,
  Building2,
  Users,
  ChevronRight,
  Scan,
  FileCheck2,
  Cpu,
  BadgeCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { CelestialMeshBackground } from "@/components/CelestialMeshBackground";

export default function PublicLandingPage() {
  const STAGES = [
    {
      num: "01",
      title: "Identity Ingestion & Verhoeff D₅ Checksum",
      tag: "Dihedral D₅ Arithmetic",
      accent: "#b5d5e1",
      description:
        "Validates 12-digit APAAR identifiers in real time using non-commutative dihedral group arithmetic, immediately catching 100% of single-digit errors and adjacent transpositions before ingestion.",
      stat: "100% Checksum Efficacy",
      icon: Scan,
    },
    {
      num: "02",
      title: "Dual-Stream Schema Normalization (APH 2024–27)",
      tag: "Statutory Mandate",
      accent: "#a88ed4",
      description:
        "Bridges the critical divide between aggregate headcount reporting for Engineering & Polytechnic institutes and micro-level student schemas for PGDM academies, aligning with AICTE 2024–27 guidelines.",
      stat: "Dual-Stream Support",
      icon: Layers,
    },
    {
      num: "03",
      title: "Multi-Category Statutory Quota Engine",
      tag: "Over-Admission Guard",
      accent: "#b9e303",
      description:
        "Automates strict statutory quota mathematics across Approved Intake plus supernumerary allotments: Tuition Fee Waiver (TFW 5%), EWS (10%), PMSSS J&K/Ladakh, NRI/PIO/FN (15%), and Supernumerary Girls Seats.",
      stat: "Zero Headcount Breach",
      icon: Scale,
    },
    {
      num: "04",
      title: "Cross-State Concurrent Enrolment Telemetry",
      tag: "UGC 2022 Disambiguation",
      accent: "#b5d5e1",
      description:
        "Telemetry engine distinguishing lawful simultaneous dual-degrees under UGC 2022 Guidelines (1 Physical Regular + 1 Online/ODL) from illegal cross-state physical seat hoarding across state boundaries.",
      stat: "Real-Time Inter-State",
      icon: GitCompare,
    },
    {
      num: "05",
      title: "Indic Phonetic Matching & Twin Protection",
      tag: "Fellegi-Sunter Algorithm",
      accent: "#a88ed4",
      description:
        "Leverages specialized Indic Metaphone phonetic tokens and Fellegi-Sunter probabilistic linkage to catch evasive abbreviations (e.g. Mohd. vs Mohammed) while protecting genuine twins with distinct APAARs.",
      stat: "Zero Twin False-Positives",
      icon: Users,
    },
    {
      num: "06",
      title: "Isolation Forest Anomaly & SHAP Explainability",
      tag: "Explainable AI (XAI)",
      accent: "#b9e303",
      description:
        "Unsupervised tree ensemble ranks all 50 colleges by anomaly probability, isolating ghost admission rings and clustered burst admissions with mathematical SHAP feature attribution waterfalls.",
      stat: "Mathematical Attribution",
      icon: Network,
    },
    {
      num: "07",
      title: "Ed25519 Merkle Ledger & W3C Degree Studio",
      tag: "Cryptographic Tamper-Seal",
      accent: "#b5d5e1",
      description:
        "Guarantees forward secrecy through append-only SHA-256 Merkle audit chains. University controllers issue tamper-proof W3C Verifiable Credentials with 2048-bit Bitstring status revocation lists.",
      stat: "Stateless Offline Proof",
      icon: Award,
    },
  ];

  const ROLES = [
    {
      role: "National Administrator",
      title: "AICTE Vigilance Directorate",
      email: "admin@aicte-india.org",
      target: "/dashboard/admin",
      badge: "National Oversight",
      accent: "#b9e303",
      desc: "Comprehensive inter-state seat quotas, anomaly graph visualizer, and Merkle ledger cryptographic audit tools.",
    },
    {
      role: "Institution Registrar",
      title: "Apex Institute of Technology",
      email: "registrar@apex-inst.ac.in",
      target: "/institution-portal",
      badge: "Ingestion Sandbox",
      accent: "#b5d5e1",
      desc: "Batch student enrolment ingestion, statutory pre-commit quota simulation, and automated validation receipts.",
    },
    {
      role: "Student Data Principal",
      title: "Aarav Sharma (B.Tech CSE)",
      email: "aarav.sharma@student.apaar.in",
      target: "/consent-wallet",
      badge: "DPDP Sovereign",
      accent: "#a88ed4",
      desc: "Sovereign DPDP consent management, zero-exposure predicate verification, and selective attribute disclosure.",
    },
    {
      role: "University Controller",
      title: "Controller of Examinations",
      email: "coe@tech-univ.ac.in",
      target: "/degree-studio",
      badge: "W3C Credential Studio",
      accent: "#b9e303",
      desc: "Ed25519 tamper-proof digital degree issuance, Bitstring status revocation registry, and offline QR verifier.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#232323]">
      {/* 1. Global Public Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          {/* New Modern Vector Logo */}
          <Logo size="md" href="/" />

          {/* Interactive Navigation Pills (Visible Button Style) */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="#overview"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#232323] hover:text-white text-xs font-bold text-slate-700 shadow-2xs transition-all"
            >
              Regulatory Overview
            </a>
            <a
              href="#seven-stages"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#232323] hover:text-white text-xs font-bold text-slate-700 shadow-2xs transition-all"
            >
              7-Stage Flow
            </a>
            <a
              href="#personas"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#232323] hover:text-white text-xs font-bold text-slate-700 shadow-2xs transition-all"
            >
              Stakeholder Portals
            </a>
            <a
              href="#architecture"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#232323] hover:text-white text-xs font-bold text-slate-700 shadow-2xs transition-all"
            >
              APH 2024–27 Alignment
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-[#b5d5e1] px-4 py-2 text-xs font-bold text-[#232323] shadow-xs hover:bg-[#9fcddc] transition-all hover:scale-105"
            >
              <span>Portals</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#232323] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-black transition-all hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#b9e303]" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Celestial Mesh Globe & Flowing Contour Waves */}
      <section id="overview" className="relative isolate overflow-hidden pt-12 pb-24 min-h-[760px] flex flex-col justify-center">
        {/* Animated Dark Globe on Left & Canvas-wide Topographic Contour Waves */}
        <CelestialMeshBackground variant="landing" spherePosition="left" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12 w-full space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Dedicated showcase flank for the Celestial Sphere on desktop */}
            <div className="hidden lg:block lg:col-span-5 min-h-[440px]" />

            {/* Right Column: Hero Content matching reference style */}
            <div className="lg:col-span-7 lg:pl-6 xl:pl-10 space-y-6 text-left">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-[#b9e303] animate-pulse" />
                <span className="text-slate-800">
                  AICTE Statutory Mandate APH 2024–27 Clause 4.2 • National Regulatory Mesh
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#232323] leading-[1.08]">
                The Single Source of Truth for <br />
                <span className="bg-gradient-to-r from-[#232323] via-[#a88ed4] to-[#232323] bg-clip-text text-transparent">
                  National Student Data & Quotas
                </span>
              </h1>

              <p className="max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                A unified verification mesh engineered to eliminate fraudulent concurrent admissions, enforce statutory
                supernumerary quotas (TFW, EWS, PMSSS, Girls), and issue tamper-evident W3C academic credentials backed
                by an Ed25519-signed Merkle audit ledger.
              </p>

              {/* Hero Action Buttons: High-visibility contrasting pills */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                {/* Primary Get Started Button */}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-[#232323] px-7 py-3.5 text-xs sm:text-sm font-black text-white shadow-xl hover:bg-black hover:scale-105 transition-all"
                >
                  <span>Get Started — Enter Portal</span>
                  <ArrowRight className="h-4 w-4 text-[#b9e303]" />
                </Link>

                {/* Secondary Button 1: Cyan visible pill */}
                <a
                  href="#seven-stages"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#b5d5e1] border-2 border-[#8dbecf] px-6 py-3.5 text-xs sm:text-sm font-bold text-[#232323] shadow-md hover:bg-[#a2d1e2] hover:scale-105 transition-all"
                >
                  <span>Explore 7-Stage Flow</span>
                  <ChevronRight className="h-4 w-4 text-[#232323]" />
                </a>

                {/* Secondary Button 2: Lavender visible pill */}
                <a
                  href="#personas"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#a88ed4]/25 border-2 border-[#a88ed4] px-6 py-3.5 text-xs sm:text-sm font-bold text-[#232323] shadow-md hover:bg-[#a88ed4]/40 hover:scale-105 transition-all"
                >
                  <span>4 Role Dashboards</span>
                  <ArrowRight className="h-4 w-4 text-[#232323]" />
                </a>
              </div>
            </div>
          </div>

          {/* Statutory Credibility Highlights */}
          <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4 max-w-5xl text-left">
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-5 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Deterministic Intake</div>
              <div className="text-2xl font-black text-[#232323] mt-1">50 Colleges</div>
              <div className="text-[11px] text-slate-500 font-medium">10 Indian States Modelled</div>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-5 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Integrity Check</div>
              <div className="text-2xl font-black text-[#232323] mt-1">Verhoeff D₅</div>
              <div className="text-[11px] text-slate-500 font-medium">Dihedral Arithmetic Checksum</div>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-5 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Ledger Seal</div>
              <div className="text-2xl font-black text-[#232323] mt-1">SHA-256</div>
              <div className="text-[11px] text-slate-500 font-medium">Merkle Append-Only Log</div>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-5 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Privacy Mandate</div>
              <div className="text-2xl font-black text-[#232323] mt-1">DPDP 2023</div>
              <div className="text-[11px] text-slate-500 font-medium">Zero-Exposure Predicate Proofs</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 7-Stage Data Verification & Quota Flow */}
      <section id="seven-stages" className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-800">
              <Sparkles className="h-3.5 w-3.5 text-[#b9e303]" />
              <span>END-TO-END STATUTORY PIPELINE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#232323]">
              The 7-Stage Statutory Verification & Quota Flow
            </h2>
            <p className="text-sm text-slate-600 font-normal">
              From messy institutional ERP spreadsheets to Ed25519 cryptographic credential issuance,
              ApaarNet automates statutory verification without human intervention.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.num}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-[#f8fafc] p-7 shadow-xs hover:border-[#232323] hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-slate-400 group-hover:text-[#232323] transition-colors">
                        STAGE {stage.num}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-slate-300"
                        style={{ backgroundColor: stage.accent, color: "#232323" }}
                      >
                        {stage.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs text-[#232323]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold text-[#232323] leading-snug">
                        {stage.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {stage.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-[#232323]">
                    <span className="text-slate-500 font-mono text-[11px]">{stage.stat}</span>
                    <CheckCircle2 className="h-4 w-4 text-[#b9e303]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Multi-Tenant Stakeholder Personas Section */}
      <section id="personas" className="border-t border-slate-200/80 bg-[#f8fafc] py-20">
        <div className="mx-auto max-w-7xl px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-800">
              <Users className="h-3.5 w-3.5 text-[#a88ed4]" />
              <span>STRICT MULTI-TENANCY & RBAC</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#232323]">
              Four Authoritative Stakeholder Personas
            </h2>
            <p className="text-sm text-slate-600 font-normal">
              Each stakeholder accesses a segregated portal route secured with scoped JWT tokens and immutable audit logs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <div
                key={r.email}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-[#232323] hover:shadow-md transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-slate-300"
                      style={{ backgroundColor: r.accent, color: "#232323" }}
                    >
                      {r.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#232323]">{r.role}</h3>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">{r.title}</div>
                    <code className="text-[11px] font-mono text-[#232323] font-bold block mt-1">
                      {r.email}
                    </code>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {r.desc}
                  </p>
                </div>

                <div className="pt-6">
                  <Link
                    href={`/login?role=${encodeURIComponent(r.role)}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#232323] py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-black transition-all"
                  >
                    <span>Login as {r.role.split(" ")[0]}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#b9e303]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Statutory APH 2024–27 Alignment Callout */}
      <section id="architecture" className="border-t border-slate-200/80 bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#b5d5e1]/20 p-8 sm:p-12 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b9e303] text-[#232323] font-bold">
                §
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#232323]">
                  AICTE Approval Process Handbook (APH 2024–27) Compliance
                </h3>
                <p className="text-xs text-slate-500">
                  Statutory Supernumerary Allotments and Headcount Safeguards
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Under Clause 4.2 of the AICTE Approval Process Handbook, institutions are prohibited from exceeding their Approved Intake
              without explicit statutory authorization. ApaarNet automatically enforces the 5% Tuition Fee Waiver (TFW),
              10% Economically Weaker Section (EWS), 15% Foreign National / NRI quota ceilings, and Supernumerary Girls Quota.
              Any excess candidate registration triggers an immediate sandbox diff rejection, safeguarding institutions from punitive de-affiliation.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-500">
                National Education & AICTE Statutory Architecture Deliverable
              </span>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#b9e303] px-5 py-2 text-xs font-bold text-[#232323] hover:bg-[#a6ce02] transition-colors"
              >
                <span>Enter Evaluation Suite</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#b9e303]" />
            <span className="font-semibold text-slate-800">
              ApaarNet · National Student Data & Quota Verification Mesh
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>AICTE COMPLIANCE ENGINE</span>
            <span>•</span>
            <span>UGC Regulation 2022</span>
            <span>•</span>
            <span>DPDP Act 2023</span>
            <span>•</span>
            <Link href="/login" className="font-bold text-[#232323] underline hover:text-black">
              Judge / Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
