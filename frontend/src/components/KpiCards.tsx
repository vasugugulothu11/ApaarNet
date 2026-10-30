"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  bgColor: "cyan" | "lime" | "purple";
  sparklinePoints?: number[];
}

const BG_MAP = {
  cyan: "bg-[#b5d5e1] text-[#232323]",
  lime: "bg-[#b9e303] text-[#232323]",
  purple: "bg-[#a88ed4] text-[#232323]",
};

function MiniSparkline({ points, isPositive }: { points?: number[]; isPositive?: boolean }) {
  const defaultPoints = isPositive !== false ? [10, 18, 14, 22, 19, 28, 25, 34] : [34, 28, 30, 22, 24, 16, 18, 10];
  const pts = points || defaultPoints;
  const max = Math.max(...pts, 40);
  const min = Math.min(...pts, 0);
  const range = max - min || 1;

  const width = 80;
  const height = 30;
  const step = width / (pts.length - 1);

  const coordinates = pts.map((val, idx) => {
    const x = idx * step;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coordinates.join(" L ")}`;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <svg width={width} height={height} className="overflow-visible stroke-current">
        <path
          d={pathD}
          fill="none"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#232323]/80"
        />
      </svg>
      {isPositive !== false ? (
        <TrendingUp className="h-4 w-4 text-[#232323]" />
      ) : (
        <TrendingDown className="h-4 w-4 text-[#232323]" />
      )}
    </div>
  );
}

export function SingleKpiCard({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  bgColor,
  sparklinePoints,
}: KpiCardProps) {
  return (
    <div
      className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${BG_MAP[bgColor]}`}
    >
      {/* Top: Squircle Icon & Title */}
      <div className="flex items-center gap-3.5 mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs text-[#232323]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-[#232323]/90">
            {title}
          </span>
          {subtitle && (
            <p className="text-[10px] text-[#232323]/70 font-mono">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Bottom: Large bold black typography & Mini trend sparkline */}
      <div className="flex items-end justify-between gap-2 mt-auto">
        <div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#232323] tracking-tight">
            {value}
          </div>
          {change && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#232323]/80">
              <span>{change}</span>
            </div>
          )}
        </div>
        <MiniSparkline points={sparklinePoints} isPositive={isPositive} />
      </div>
    </div>
  );
}

export interface KpiCardsGridProps {
  cards: [
    Omit<KpiCardProps, "bgColor">,
    Omit<KpiCardProps, "bgColor">,
    Omit<KpiCardProps, "bgColor">
  ];
}

export function KpiCardsGrid({ cards }: KpiCardsGridProps) {
  const [card1, card2, card3] = cards;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SingleKpiCard {...card1} bgColor="cyan" />
      <SingleKpiCard {...card2} bgColor="lime" />
      <SingleKpiCard {...card3} bgColor="purple" />
    </div>
  );
}
