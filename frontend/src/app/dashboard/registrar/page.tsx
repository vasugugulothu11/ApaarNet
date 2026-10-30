"use client";

import React, { useState } from "react";
import InstitutionPortalPage from "@/app/institution-portal/page";
import { KpiCardsGrid } from "@/components/KpiCards";
import { DashboardAnalyticsSection } from "@/components/Analytics";
import { DashboardBottomSection } from "@/components/DashboardTables";
import { Building2, Scale, Users, Layers, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function RegistrarDashboardPage() {
  return (
    <div className="space-y-8">
      {/* ============================================================== */}
      {/* 1. TOP 3 KPI CARDS (Reference Palette: Cyan, Lime, Purple)     */}
      {/* ============================================================== */}
      <KpiCardsGrid
        cards={[
          {
            title: "Base Quota Intake",
            value: "480",
            subtitle: "Sanctioned General Seats",
            change: "472 / 480 Enrolled (98.3%)",
            icon: Building2,
            isPositive: true,
            sparklinePoints: [380, 410, 430, 450, 465, 470, 472],
          },
          {
            title: "NRI Quota Cap",
            value: "24",
            subtitle: "Statutory 5% APH Cap",
            change: "21 / 24 Allotted (87.5%)",
            icon: Scale,
            isPositive: true,
            sparklinePoints: [5, 8, 12, 16, 18, 20, 21],
          },
          {
            title: "Supernumerary (FN/OCI)",
            value: "12",
            subtitle: "Ministry Approved Intake",
            change: "10 / 12 Verified Passports",
            icon: Layers,
            isPositive: true,
            sparklinePoints: [2, 4, 6, 7, 9, 10, 10],
          },
        ]}
      />

      {/* ============================================================== */}
      {/* 2. CONCENTRIC RING & ANALYTICS CHARTS (Reference Middle Row)   */}
      {/* ============================================================== */}
      <DashboardAnalyticsSection
        areaChartProps={{
          title: "Institutional Ingestion Velocity",
          seriesAName: "Batch CSV Enrolments",
          seriesBName: "Real-time APAAR Sync",
          unitSuffix: " Students",
          data: [
            { month: "Jan", seriesA: 80, seriesB: 95 },
            { month: "Feb", seriesA: 140, seriesB: 180 },
            { month: "Mar", seriesA: 260, seriesB: 310 },
            { month: "Apr", seriesA: 380, seriesB: 420 },
            { month: "May", seriesA: 440, seriesB: 460 },
            { month: "Jun", seriesA: 470, seriesB: 472 },
            { month: "Jul", seriesA: 480, seriesB: 480 },
          ],
        }}
        radialRingsProps={{
          title: "Intake Seat Allocation",
          timeframe: "AY 2024–25",
          metric1: { name: "Base Intake", value: 98, color: "#232323", label: "98% (472/480)" },
          metric2: { name: "NRI Quota", value: 87, color: "#b9e303", label: "87.5% (21/24)" },
          metric3: { name: "Supernumerary", value: 83, color: "#b5d5e1", label: "83.3% (10/12)" },
        }}
      />

      {/* ============================================================== */}
      {/* 3. BOTTOM SPLIT: DATA TABLE & ACTIVITY BAR CHART               */}
      {/* ============================================================== */}
      <DashboardBottomSection
        tableProps={{
          title: "Active Institutional Programs & Quotas",
          col1Title: "Program & Degree",
          col2Title: "Approved Intake",
          col3Title: "APAAR Headcount",
          col4Title: "Audit Status",
          col5Title: "Inspect",
          rows: [
            {
              id: "p1",
              title: "B.Tech Computer Science & Engineering",
              subtitle: "AICTE Program ID: 1-10000001-CSE",
              metric1: "180 Seats",
              metric2: "178 Enrolled",
              statusText: "Compliant",
              statusType: "success",
            },
            {
              id: "p2",
              title: "B.Tech Electronics & Communication",
              subtitle: "AICTE Program ID: 1-10000001-ECE",
              metric1: "120 Seats",
              metric2: "119 Enrolled",
              statusText: "Compliant",
              statusType: "success",
            },
            {
              id: "p3",
              title: "B.Tech Mechanical Engineering",
              subtitle: "AICTE Program ID: 1-10000001-MECH",
              metric1: "90 Seats",
              metric2: "87 Enrolled",
              statusText: "Seats Available",
              statusType: "neutral",
            },
            {
              id: "p4",
              title: "B.Tech Artificial Intelligence & Data Science",
              subtitle: "AICTE Program ID: 1-10000001-AIDS",
              metric1: "60 Seats",
              metric2: "60 Enrolled",
              statusText: "Capacity Met",
              statusType: "success",
            },
            {
              id: "p5",
              title: "M.Tech Cyber Security",
              subtitle: "AICTE Program ID: 1-10000001-CYBER",
              metric1: "30 Seats",
              metric2: "28 Enrolled",
              statusText: "Compliant",
              statusType: "success",
            },
          ],
        }}
        activityProps={{
          title: "ERP Ingestion & Verification Velocity",
          highlightDay: "Thu",
          activity: [
            { day: "Mon", value: 30, label: "140" },
            { day: "Tue", value: 55, label: "290" },
            { day: "Wed", value: 70, label: "380" },
            { day: "Thu", value: 95, label: "512" },
            { day: "Fri", value: 80, label: "420" },
            { day: "Sat", value: 45, label: "210" },
            { day: "Sun", value: 15, label: "60" },
          ],
        }}
      />

      {/* ============================================================== */}
      {/* 4. ERP INGESTION SANDBOX & STATUTORY COMMIT REGISTRY           */}
      {/* ============================================================== */}
      <div id="sandbox" className="pt-4 border-t border-slate-200">
        <InstitutionPortalPage />
      </div>
    </div>
  );
}
