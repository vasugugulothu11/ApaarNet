"use client";

import React from "react";
import DegreeStudioPage from "@/app/degree-studio/page";
import { KpiCardsGrid } from "@/components/KpiCards";
import { DashboardAnalyticsSection } from "@/components/Analytics";
import { DashboardBottomSection } from "@/components/DashboardTables";
import { Award, ShieldAlert, ShieldCheck, FileCheck2, Scan, CheckCircle2 } from "lucide-react";

export default function CoeDashboardPage() {
  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* 1. TOP 3 KPI CARDS (Reference Palette: Cyan, Lime, Purple)     */}
      {/* ============================================================== */}
      <KpiCardsGrid
        cards={[
          {
            title: "Degrees Issued",
            value: "1,240",
            subtitle: "W3C Verifiable Credentials",
            change: "+180 Convocations this month",
            icon: Award,
            isPositive: true,
            sparklinePoints: [780, 850, 920, 1010, 1100, 1180, 1240],
          },
          {
            title: "Bitstring Revocations",
            value: "03",
            subtitle: "RFC 9594 Status Registry",
            change: "0.24% Total Revocation Rate",
            icon: ShieldAlert,
            isPositive: false,
            sparklinePoints: [1, 1, 2, 2, 2, 3, 3],
          },
          {
            title: "Cryptographic Proofs",
            value: "100%",
            subtitle: "Ed25519 Stateless Signed",
            change: "Zero DB Lookup Verification",
            icon: ShieldCheck,
            isPositive: true,
            sparklinePoints: [100, 100, 100, 100, 100, 100, 100],
          },
        ]}
      />

      {/* ============================================================== */}
      {/* 2. CONCENTRIC RING & ANALYTICS CHARTS (Reference Middle Row)   */}
      {/* ============================================================== */}
      <DashboardAnalyticsSection
        areaChartProps={{
          title: "Convocation & Degree Issuance Velocity",
          seriesAName: "Undergraduate (B.Tech)",
          seriesBName: "Postgraduate & PGDM",
          unitSuffix: " Degrees",
          data: [
            { month: "Jan", seriesA: 40, seriesB: 15 },
            { month: "Feb", seriesA: 90, seriesB: 35 },
            { month: "Mar", seriesA: 180, seriesB: 75 },
            { month: "Apr", seriesA: 340, seriesB: 120 },
            { month: "May", seriesA: 580, seriesB: 210 },
            { month: "Jun", seriesA: 820, seriesB: 280 },
            { month: "Jul", seriesA: 960, seriesB: 320 },
          ],
        }}
        radialRingsProps={{
          title: "Graduation Credentials by Stream",
          timeframe: "AY 2024–25",
          metric1: { name: "B.Tech Engineering", value: 75, color: "#232323", label: "75% (930 Degrees)" },
          metric2: { name: "PGDM Management", value: 20, color: "#b9e303", label: "20% (248 Degrees)" },
          metric3: { name: "Architecture / MCA", value: 5, color: "#b5d5e1", label: "5% (62 Degrees)" },
        }}
      />

      {/* ============================================================== */}
      {/* 3. BOTTOM SPLIT: DATA TABLE & ACTIVITY BAR CHART               */}
      {/* ============================================================== */}
      <DashboardBottomSection
        tableProps={{
          title: "Recent W3C Verifiable Credential Convocations",
          col1Title: "Student & APAAR Identifier",
          col2Title: "Program",
          col3Title: "Cumulative CGPA",
          col4Title: "Bitstring Status",
          col5Title: "Verify",
          rows: [
            {
              id: "deg-1",
              title: "Aarav Sharma (APAAR: 482910384715)",
              subtitle: "Apex Institute of Tech · Roll: AIT-2026-CS-001",
              metric1: "B.Tech CSE",
              metric2: "8.92 CGPA",
              statusText: "Valid Active",
              statusType: "success",
            },
            {
              id: "deg-2",
              title: "Priya Nair (APAAR: 739201846297)",
              subtitle: "PSG College of Tech · Roll: PSG-2026-CS-002",
              metric1: "B.Tech CSE",
              metric2: "9.15 CGPA",
              statusText: "Valid Active",
              statusType: "success",
            },
            {
              id: "deg-3",
              title: "Rohan Deshmukh (APAAR: 102938475612)",
              subtitle: "COEP Technological Univ · Roll: COEP-2026-ME-045",
              metric1: "B.Tech Mechanical",
              metric2: "7.84 CGPA",
              statusText: "Valid Active",
              statusType: "success",
            },
            {
              id: "deg-4",
              title: "Ankit Verma (APAAR: 827104928179)",
              subtitle: "Bangalore Global Inst · Roll: BGI-2026-MGMT-088",
              metric1: "PGDM Marketing",
              metric2: "6.40 CGPA",
              statusText: "Bitstring Revoked",
              statusType: "danger",
            },
          ],
        }}
        activityProps={{
          title: "Public Verifier Scans & Queries",
          highlightDay: "Fri",
          activity: [
            { day: "Mon", value: 45, label: "210" },
            { day: "Tue", value: 65, label: "340" },
            { day: "Wed", value: 50, label: "280" },
            { day: "Thu", value: 75, label: "420" },
            { day: "Fri", value: 95, label: "680" },
            { day: "Sat", value: 40, label: "190" },
            { day: "Sun", value: 20, label: "90" },
          ],
        }}
      />

      {/* ============================================================== */}
      {/* 4. W3C VC DEGREE STUDIO, REVOCATION REGISTRY & QR VERIFIER     */}
      {/* ============================================================== */}
      <div id="issue" className="pt-4 border-t border-slate-200">
        <DegreeStudioPage />
      </div>
    </div>
  );
}
