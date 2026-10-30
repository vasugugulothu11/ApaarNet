"use client";

import React, { useState } from "react";
import { MoreVertical, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink } from "lucide-react";

export interface TableRowItem {
  id: string;
  title: string;
  subtitle?: string;
  iconBg?: string;
  icon?: React.ReactNode;
  metric1: string; // e.g. "321 Pcs"
  metric2: string; // e.g. "$8,500"
  statusText: string; // e.g. "In Stock" or "Compliant"
  statusType: "success" | "warning" | "danger" | "neutral";
  onAction?: () => void;
}

export interface DashboardDataTableProps {
  title?: string;
  col1Title?: string;
  col2Title?: string;
  col3Title?: string;
  col4Title?: string;
  col5Title?: string;
  rows?: TableRowItem[];
}

const DEFAULT_ROWS: TableRowItem[] = [
  {
    id: "1",
    title: "Apex Institute of Tech (AICTE: 1-10000001)",
    subtitle: "B.Tech Computer Science & Engg",
    metric1: "480 Intake",
    metric2: "472 Enrolled",
    statusText: "Compliant",
    statusType: "success",
  },
  {
    id: "2",
    title: "National Tech Academy (AICTE: 1-10000002)",
    subtitle: "B.Tech Electronics & Comm",
    metric1: "300 Intake",
    metric2: "300 Enrolled",
    statusText: "Capacity Met",
    statusType: "neutral",
  },
  {
    id: "3",
    title: "Bangalore Global Institute (AICTE: 1-10000003)",
    subtitle: "PGDM International Management",
    metric1: "120 Intake",
    metric2: "124 Enrolled",
    statusText: "Quota Exceeded",
    statusType: "danger",
  },
];

export function DashboardDataTable({
  title = "Top Regulated Institutions",
  col1Title = "Institution & Program",
  col2Title = "Sanctioned",
  col3Title = "APAAR Enrolled",
  col4Title = "Status",
  col5Title = "Action",
  rows = DEFAULT_ROWS,
}: DashboardDataTableProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs flex flex-col justify-between overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base sm:text-lg font-extrabold text-[#232323] tracking-tight">
          {title}
        </h2>
        <span className="text-[11px] font-mono text-slate-400">
          Showing {rows.length} verified records
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pr-4 font-semibold">{col1Title}</th>
              <th className="pb-3 px-4 font-semibold">{col2Title}</th>
              <th className="pb-3 px-4 font-semibold">{col3Title}</th>
              <th className="pb-3 px-4 font-semibold">{col4Title}</th>
              <th className="pb-3 pl-4 text-right font-semibold">{col5Title}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {rows.map((row) => {
              const isSuccess = row.statusType === "success";
              const isDanger = row.statusType === "danger";
              const isWarning = row.statusType === "warning";

              return (
                <tr
                  key={row.id}
                  className="group hover:bg-slate-50/70 transition-colors"
                >
                  {/* Col 1: Title & Icon */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs">
                        {row.icon || (
                          <span className="text-[11px]">
                            {row.title.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="truncate max-w-xs">
                        <div className="font-bold text-[#232323] truncate">
                          {row.title}
                        </div>
                        {row.subtitle && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {row.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Col 2 */}
                  <td className="py-3.5 px-4 font-semibold text-[#232323] whitespace-nowrap">
                    {row.metric1}
                  </td>

                  {/* Col 3 */}
                  <td className="py-3.5 px-4 font-semibold text-[#232323] whitespace-nowrap">
                    {row.metric2}
                  </td>

                  {/* Col 4: Status Badge (e.g. In Stock / Verified) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isSuccess
                          ? "bg-emerald-50 text-emerald-600"
                          : isDanger
                          ? "bg-rose-50 text-rose-600"
                          : isWarning
                          ? "bg-amber-50 text-amber-600"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSuccess
                            ? "bg-emerald-500"
                            : isDanger
                            ? "bg-rose-500"
                            : isWarning
                            ? "bg-amber-500"
                            : "bg-slate-400"
                        }`}
                      />
                      <span>{row.statusText}</span>
                    </span>
                  </td>

                  {/* Col 5: Action */}
                  <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={row.onAction}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-[#232323] hover:bg-slate-100 transition-colors"
                      title="Inspect record"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface ActivityBarItem {
  day: string; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  value: number; // 0 to 100
  label: string; // e.g. "1889"
}

const DEFAULT_ACTIVITY: ActivityBarItem[] = [
  { day: "Mon", value: 35, label: "940" },
  { day: "Tue", value: 65, label: "1,420" },
  { day: "Wed", value: 45, label: "1,110" },
  { day: "Thu", value: 25, label: "720" },
  { day: "Fri", value: 92, label: "1889" }, // Default active peak
  { day: "Sat", value: 55, label: "1,260" },
  { day: "Sun", value: 40, label: "980" },
];

export interface ActivityBarChartProps {
  title?: string;
  activity?: ActivityBarItem[];
  highlightDay?: string; // Default: "Fri"
}

export function ActivityBarChart({
  title = "Customers Activity",
  activity = DEFAULT_ACTIVITY,
  highlightDay = "Fri",
}: ActivityBarChartProps) {
  const [activeDay, setActiveDay] = useState(highlightDay);

  return (
    <div className="rounded-3xl bg-[#232323] p-6 sm:p-7 shadow-xl text-white flex flex-col justify-between select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          className="text-slate-400 hover:text-white transition-colors"
          title="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Vertical Pill Bars Container */}
      <div className="relative flex items-end justify-between gap-2 sm:gap-3 h-44 px-2 my-2">
        {activity.map((item) => {
          const isActive = item.day === activeDay;

          return (
            <div
              key={item.day}
              className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
              onClick={() => setActiveDay(item.day)}
            >
              {/* Floating Tooltip on the active bar (Exact reference: white pill with bold black number e.g. 1889) */}
              {isActive && (
                <div className="absolute top-4 z-20 transition-all duration-200">
                  <div className="rounded-xl bg-white px-3 py-1 shadow-2xl text-center">
                    <span className="text-xs font-black text-[#232323]">
                      {item.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Elongated Pill Bar */}
              <div className="w-3.5 sm:w-4 h-full rounded-full bg-white/10 flex flex-col justify-end p-0.5 relative overflow-hidden transition-all duration-300 group-hover:bg-white/15">
                <div
                  className={`w-full rounded-full transition-all duration-500 ${
                    isActive ? "bg-white" : "bg-white/70 group-hover:bg-white"
                  }`}
                  style={{ height: `${item.value}%` }}
                />
              </div>

              {/* Day Label */}
              <span
                className={`mt-3 text-[11px] font-semibold transition-colors ${
                  isActive ? "text-white" : "text-[#a0a0a0] group-hover:text-white"
                }`}
              >
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface DashboardBottomSectionProps {
  tableProps?: DashboardDataTableProps;
  activityProps?: ActivityBarChartProps;
}

export function DashboardBottomSection({
  tableProps,
  activityProps,
}: DashboardBottomSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <DashboardDataTable {...tableProps} />
      </div>
      <div>
        <ActivityBarChart {...activityProps} />
      </div>
    </div>
  );
}
