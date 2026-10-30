"use client";

import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  href?: string;
}

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        {/* Outer squircle base */}
        <rect width="48" height="48" rx="14" fill="#232323" />
        
        {/* Modern Geometric Interlocking Identity Mesh & Knot */}
        <path
          d="M14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24"
          stroke="#b9e303"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M34 24C34 29.5228 29.5228 34 24 34C18.4772 34 14 29.5228 14 24"
          stroke="#b5d5e1"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        
        {/* Intersecting Merkle link */}
        <path
          d="M18 19L30 29"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="1 3"
        />

        {/* Central Cryptographic Verifiable Identity Core */}
        <circle cx="24" cy="24" r="3.8" fill="#b9e303" />
        <circle cx="24" cy="24" r="1.8" fill="#232323" />
        
        {/* Mini Accent Quantum Nodes */}
        <circle cx="14" cy="24" r="2.2" fill="#b9e303" />
        <circle cx="34" cy="24" r="2.2" fill="#b5d5e1" />
      </svg>
    </div>
  );
}

export function Logo({
  className = "",
  size = "md",
  showSubtitle = true,
  href = "/",
}: LogoProps) {
  const sizeClasses = {
    sm: {
      mark: "h-8 w-8",
      title: "text-sm",
      sub: "text-[9.5px]",
    },
    md: {
      mark: "h-10 w-10",
      title: "text-base",
      sub: "text-[11px]",
    },
    lg: {
      mark: "h-12 w-12",
      title: "text-xl",
      sub: "text-xs",
    },
  }[size];

  const content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <LogoMark className={sizeClasses.mark} />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className={`${sizeClasses.title} font-black tracking-tight text-[#232323]`}>
            Apaar<span className="text-[#65a30d]">Net</span>
          </span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#b9e303] ring-2 ring-[#b9e303]/30" />
          <span className="rounded-md bg-[#232323] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#b9e303]">
            Mesh
          </span>
        </div>
        {showSubtitle && (
          <p className={`${sizeClasses.sub} font-medium text-slate-500 tracking-tight leading-tight`}>
            National Student Data & Quota Mesh
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
