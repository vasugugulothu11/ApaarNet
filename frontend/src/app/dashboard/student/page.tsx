"use client";

import React from "react";
import ConsentWalletPage from "@/app/consent-wallet/page";
import { KpiCardsGrid } from "@/components/KpiCards";
import { DashboardAnalyticsSection } from "@/components/Analytics";
import { DashboardBottomSection } from "@/components/DashboardTables";
import { Lock, KeyRound, ShieldCheck, FileCheck2, Clock, EyeOff } from "lucide-react";

export default function DashboardStudentPage() {
  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* 1. TOP 3 KPI CARDS (Reference Palette: Cyan, Lime, Purple)     */}
      {/* ============================================================== */}
      <KpiCardsGrid
        cards={[
          {
            title: "Active DPDP Consents",
            value: "03",
            subtitle: "Time-Bound Sovereign Grants",
            change: "100% Cryptographically Revocable",
            icon: Lock,
            isPositive: true,
            sparklinePoints: [1, 2, 2, 3, 3, 3, 3],
          },
          {
            title: "Attribute Disclosures",
            value: "14",
            subtitle: "SD-JWT Selective Disclosures",
            change: "+4 Disclosures this week",
            icon: KeyRound,
            isPositive: true,
            sparklinePoints: [4, 6, 8, 9, 11, 12, 14],
          },
          {
            title: "W3C Verifiable Credentials",
            value: "02",
            subtitle: "Stateless Ed25519 Sealed",
            change: "Zero Identity Exposure",
            icon: ShieldCheck,
            isPositive: true,
            sparklinePoints: [1, 1, 1, 2, 2, 2, 2],
          },
        ]}
      />

      {/* ============================================================== */}
      {/* 2. CONCENTRIC RING & ANALYTICS CHARTS (Reference Middle Row)   */}
      {/* ============================================================== */}
      <DashboardAnalyticsSection
        areaChartProps={{
          title: "Sovereign Consent Grant Velocity",
          seriesAName: "Employer Queries (TCS, Infosys)",
          seriesBName: "Higher Ed Verifications",
          unitSuffix: " Queries",
          data: [
            { month: "Jan", seriesA: 2, seriesB: 4 },
            { month: "Feb", seriesA: 5, seriesB: 7 },
            { month: "Mar", seriesA: 8, seriesB: 12 },
            { month: "Apr", seriesA: 11, seriesB: 14 },
            { month: "May", seriesA: 15, seriesB: 18 },
            { month: "Jun", seriesA: 19, seriesB: 22 },
            { month: "Jul", seriesA: 24, seriesB: 28 },
          ],
        }}
        radialRingsProps={{
          title: "Attribute Privacy Shield",
          timeframe: "DPDP 2023",
          metric1: { name: "Public Claims", value: 85, color: "#232323", label: "85% (Name, Roll, Degree)" },
          metric2: { name: "Selective Quota", value: 30, color: "#b9e303", label: "30% (EWS/OBC Masked)" },
          metric3: { name: "Biometric Aadhaar", value: 0, color: "#b5d5e1", label: "0% (Never Disclosed)" },
        }}
      />

      {/* ============================================================== */}
      {/* 3. BOTTOM SPLIT: DATA TABLE & ACTIVITY BAR CHART               */}
      {/* ============================================================== */}
      <DashboardBottomSection
        tableProps={{
          title: "Recent Data Access Grants & Verifications",
          col1Title: "Authorized Requester",
          col2Title: "Purpose",
          col3Title: "Claims Shared",
          col4Title: "Consent Mode",
          col5Title: "Revoke",
          rows: [
            {
              id: "req-1",
              title: "Tata Consultancy Services (HR Recruitment)",
              subtitle: "Campus Placement Background Verification",
              metric1: "Employment",
              metric2: "Name, Program, Status",
              statusText: "Active Grant",
              statusType: "success",
            },
            {
              id: "req-2",
              title: "Apex Technical University Examination Division",
              subtitle: "End-Semester Degree Audit & Bitstring Check",
              metric1: "Academic",
              metric2: "APAAR, CGPA, Enrolment",
              statusText: "Active Grant",
              statusType: "success",
            },
            {
              id: "req-3",
              title: "AICTE National Verification Gateway",
              subtitle: "Statutory APH Headcount Biometric Proof",
              metric1: "Statutory",
              metric2: "Zero-Exposure Proof",
              statusText: "Verified Sealed",
              statusType: "neutral",
            },
          ],
        }}
        activityProps={{
          title: "Daily Credential Presentation Activity",
          highlightDay: "Wed",
          activity: [
            { day: "Mon", value: 20, label: "2" },
            { day: "Tue", value: 45, label: "5" },
            { day: "Wed", value: 90, label: "9" },
            { day: "Thu", value: 60, label: "6" },
            { day: "Fri", value: 35, label: "3" },
            { day: "Sat", value: 10, label: "1" },
            { day: "Sun", value: 5, label: "0" },
          ],
        }}
      />

      {/* ============================================================== */}
      {/* 4. SOVEREIGN CONSENT WALLET & IDENTITY CARD WORKSPACE          */}
      {/* ============================================================== */}
      <div id="requests" className="pt-4 border-t border-slate-200">
        <ConsentWalletPage />
      </div>
    </div>
  );
}
