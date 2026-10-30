"use client";

import React, { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

interface DataPoint {
  month: string;
  seriesA: number; // e.g. Offline / Ingestion (#a88ed4)
  seriesB: number; // e.g. Online / Quota (#b9e303)
}

const DEFAULT_CHART_DATA: DataPoint[] = [
  { month: "Jan", seriesA: 260, seriesB: 320 },
  { month: "Feb", seriesA: 340, seriesB: 480 },
  { month: "Mar", seriesA: 520, seriesB: 640 },
  { month: "Apr", seriesA: 480, seriesB: 670 },
  { month: "May", seriesA: 620, seriesB: 580 },
  { month: "Jun", seriesA: 780, seriesB: 420 },
  { month: "Jul", seriesA: 910, seriesB: 540 },
];

function getCurvedPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

export interface AreaChartProps {
  title?: string;
  seriesAName?: string;
  seriesBName?: string;
  data?: DataPoint[];
  unitPrefix?: string;
  unitSuffix?: string;
}

export function SmoothAreaChart({
  title = "Sales Analytics",
  seriesAName = "Direct Ingestion",
  seriesBName = "Statutory Intake",
  data = DEFAULT_CHART_DATA,
  unitPrefix = "",
  unitSuffix = " Pcs",
}: AreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(3); // Default highlighted to April (like reference $670)
  const [timeframe, setTimeframe] = useState("Monthly");

  const svgWidth = 600;
  const svgHeight = 260;
  const paddingX = 40;
  const paddingBottom = 40;
  const paddingTop = 30;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const maxY = 1000;
  const yTicks = [1000, 800, 600, 400, 200, 0];

  const stepX = chartW / (data.length - 1);

  const pointsA = data.map((d, i) => ({
    x: paddingX + i * stepX,
    y: paddingTop + chartH - (d.seriesA / maxY) * chartH,
  }));

  const pointsB = data.map((d, i) => ({
    x: paddingX + i * stepX,
    y: paddingTop + chartH - (d.seriesB / maxY) * chartH,
  }));

  const pathA = getCurvedPath(pointsA);
  const pathB = getCurvedPath(pointsB);

  const areaPathA = `${pathA} L ${pointsA[pointsA.length - 1].x},${paddingTop + chartH} L ${pointsA[0].x},${paddingTop + chartH} Z`;
  const areaPathB = `${pathB} L ${pointsB[pointsB.length - 1].x},${paddingTop + chartH} L ${pointsB[0].x},${paddingTop + chartH} Z`;

  const activePoint = hoveredIdx !== null ? pointsB[hoveredIdx] : null;
  const activeData = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
      {/* Top Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#232323] tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          {/* Series A legend (Purple #a88ed4) */}
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-[#a88ed4]" />
            <span>{seriesAName}</span>
          </div>

          {/* Series B legend (Lime #b9e303) */}
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-[#b9e303]" />
            <span>{seriesBName}</span>
          </div>

          {/* Timeframe Dropdown */}
          <button
            type="button"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span>{timeframe}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a88ed4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a88ed4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradLime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b9e303" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#b9e303" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {yTicks.map((val) => {
            const y = paddingTop + chartH - (val / maxY) * chartH;
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 12}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Subtle Area Fills */}
          <path d={areaPathA} fill="url(#gradPurple)" />
          <path d={areaPathB} fill="url(#gradLime)" />

          {/* Stroke Lines */}
          <path
            d={pathA}
            fill="none"
            stroke="#a88ed4"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d={pathB}
            fill="none"
            stroke="#b9e303"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* X Axis Month Labels & Hover Hitboxes */}
          {data.map((d, idx) => {
            const x = paddingX + idx * stepX;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={d.month}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
              >
                {/* Invisible wide hover column */}
                <rect
                  x={x - stepX / 2}
                  y={paddingTop}
                  width={stepX}
                  height={chartH}
                  fill="transparent"
                />

                {/* X-axis Month Label */}
                <text
                  x={x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isHovered ? "bold" : "normal"}
                  fill={isHovered ? "#232323" : "#64748b"}
                >
                  {d.month}
                </text>

                {/* Vertical cursor guide line when hovered */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartH}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}
              </g>
            );
          })}

          {/* Active Highlight Marker on Series B (Mirroring Reference "$670") */}
          {activePoint && (
            <g transform={`translate(${activePoint.x}, ${activePoint.y})`}>
              <circle r="6" fill="#232323" stroke="#ffffff" strokeWidth="2.5" />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Pill with Dark #232323 background (Exact Reference Design) */}
        {activePoint && activeData && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-200"
            style={{
              left: `${(activePoint.x / svgWidth) * 100}%`,
              top: `${(activePoint.y / svgHeight) * 100}%`,
              transform: "translate(-50%, -135%)",
            }}
          >
            <div className="relative rounded-lg bg-[#232323] px-3 py-1.5 text-white shadow-xl flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-xs font-black tracking-tight text-white">
                {unitPrefix}
                {activeData.seriesB.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#b9e303] font-bold">
                ({activeData.seriesA.toLocaleString()})
              </span>
              {/* Downward Beak pointer */}
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#232323]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export interface ConcentricRingsProps {
  title?: string;
  timeframe?: string;
  metric1?: { name: string; value: number; color: string; label: string }; // Outer
  metric2?: { name: string; value: number; color: string; label: string }; // Middle
  metric3?: { name: string; value: number; color: string; label: string }; // Inner
}

export function ConcentricRadialRings({
  title = "Earnings",
  timeframe = "Month",
  metric1 = { name: "Sales", value: 78, color: "#232323", label: "78%" },
  metric2 = { name: "Profit", value: 65, color: "#b9e303", label: "65%" },
  metric3 = { name: "Growth", value: 48, color: "#b5d5e1", label: "48%" },
}: ConcentricRingsProps) {
  const [hoveredRing, setHoveredRing] = useState<string | null>(null);

  const size = 260;
  const center = size / 2;

  // 3 Concentric Ring Radii
  const r1 = 88; // Outer ring
  const r2 = 68; // Middle ring
  const r3 = 48; // Inner ring
  const strokeWidth = 10;

  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const c3 = 2 * Math.PI * r3;

  const offset1 = c1 * (1 - metric1.value / 100);
  const offset2 = c2 * (1 - metric2.value / 100);
  const offset3 = c3 * (1 - metric3.value / 100);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base sm:text-lg font-extrabold text-[#232323] tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <span>{timeframe}</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      </div>

      {/* Center Concentric SVG Graphic */}
      <div className="relative flex items-center justify-center my-3 select-none">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Ring 1 (Outer: #232323) */}
          <circle
            cx={center}
            cy={center}
            r={r1}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={r1}
            fill="none"
            stroke={metric1.color}
            strokeWidth={strokeWidth}
            strokeDasharray={c1}
            strokeDashoffset={offset1}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-700 cursor-pointer"
            onMouseEnter={() => setHoveredRing(metric1.name)}
            onMouseLeave={() => setHoveredRing(null)}
          />

          {/* Ring 2 (Middle: #b9e303) */}
          <circle
            cx={center}
            cy={center}
            r={r2}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={r2}
            fill="none"
            stroke={metric2.color}
            strokeWidth={strokeWidth}
            strokeDasharray={c2}
            strokeDashoffset={offset2}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-700 cursor-pointer"
            onMouseEnter={() => setHoveredRing(metric2.name)}
            onMouseLeave={() => setHoveredRing(null)}
          />

          {/* Ring 3 (Inner: #b5d5e1) */}
          <circle
            cx={center}
            cy={center}
            r={r3}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={r3}
            fill="none"
            stroke={metric3.color}
            strokeWidth={strokeWidth}
            strokeDasharray={c3}
            strokeDashoffset={offset3}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-700 cursor-pointer"
            onMouseEnter={() => setHoveredRing(metric3.name)}
            onMouseLeave={() => setHoveredRing(null)}
          />
        </svg>

        {/* Center Tooltip Hover Display with dark #232323 styling */}
        {hoveredRing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-xl bg-[#232323] px-3 py-1.5 text-center text-white shadow-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {hoveredRing}
              </span>
              <span className="text-sm font-black text-white">
                {hoveredRing === metric1.name
                  ? metric1.label
                  : hoveredRing === metric2.name
                  ? metric2.label
                  : metric3.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Legend Matching Reference (Sales, Profit, Growth) */}
      <div className="flex items-center justify-center gap-5 pt-2 border-t border-slate-100 text-xs font-semibold">
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: metric1.color }} />
          <span>{metric1.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: metric2.color }} />
          <span>{metric2.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: metric3.color }} />
          <span>{metric3.name}</span>
        </div>
      </div>
    </div>
  );
}

export interface DashboardAnalyticsSectionProps {
  areaChartProps?: AreaChartProps;
  radialRingsProps?: ConcentricRingsProps;
}

export function DashboardAnalyticsSection({
  areaChartProps,
  radialRingsProps,
}: DashboardAnalyticsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SmoothAreaChart {...areaChartProps} />
      </div>
      <div>
        <ConcentricRadialRings {...radialRingsProps} />
      </div>
    </div>
  );
}
