"use client";

import React from "react";

interface CelestialMeshBackgroundProps {
  variant?: "landing" | "login" | "split";
  spherePosition?: "left" | "center" | "hero-split";
  className?: string;
  showWatermark?: boolean;
}

export function CelestialMeshBackground({
  variant = "landing",
  spherePosition = "left",
  className = "",
  showWatermark = true,
}: CelestialMeshBackgroundProps) {
  const isLogin = variant === "login";
  const isSplit = spherePosition === "hero-split";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none z-0 ${className}`}
    >
      {/* 1. Fluid Organic Topographic Contour Waves (Canvas Wide) */}
      <svg
        className="absolute inset-0 h-full w-full object-cover"
        viewBox="0 0 1920 1080"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="contourGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.22" />
            <stop offset="35%" stopColor="#0f172a" stopOpacity="0.18" />
            <stop offset="70%" stopColor="#0f172a" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="contourGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#0f172a" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.09" />
          </linearGradient>

          <linearGradient id="contourGradAccent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.20" />
            <stop offset="45%" stopColor="#a88ed4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#b9e303" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* Layer 1: Slow Sinusoidal Drift */}
        <g className="animate-wave-slow">
          <path
            d="M -150 140 C 260 80, 640 190, 1040 120 C 1440 50, 1720 160, 2150 110"
            stroke="url(#contourGrad1)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M -150 280 C 280 360, 700 220, 1120 290 C 1500 350, 1780 230, 2150 270"
            stroke="url(#contourGrad2)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M -150 580 C 270 650, 700 520, 1140 600 C 1520 680, 1790 550, 2150 610"
            stroke="url(#contourGrad1)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>

        {/* Layer 2: Mid-Speed Complementary Drift */}
        <g className="animate-wave-mid">
          <path
            d="M -150 420 C 320 350, 740 500, 1180 410 C 1540 330, 1770 470, 2150 400"
            stroke="url(#contourGradAccent)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M -150 720 C 330 660, 730 800, 1200 700 C 1560 610, 1810 750, 2150 690"
            stroke="url(#contourGrad2)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M -150 880 C 310 950, 740 840, 1160 920 C 1540 980, 1800 860, 2150 900"
            stroke="url(#contourGrad1)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>

        {/* Layer 3: Alternate Counter-Undulation */}
        <g className="animate-wave-alt">
          <path
            d="M -150 200 C 350 250, 780 140, 1200 220 C 1580 280, 1830 180, 2150 210"
            stroke="url(#contourGrad2)"
            strokeWidth="1.2"
            strokeDasharray="6 8"
          />
          <path
            d="M -150 500 C 300 570, 720 450, 1150 530 C 1530 600, 1790 480, 2150 520"
            stroke="url(#contourGrad1)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M -150 800 C 370 860, 790 740, 1220 820 C 1600 880, 1830 780, 2150 830"
            stroke="url(#contourGrad2)"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* 2. Giant Dark Celestial Wireframe Sphere (Exact Deconflicted Style) */}
      <div
        className={`absolute top-0 transition-transform duration-700 ${
          isLogin
            ? "left-[-340px] sm:left-[-240px] md:left-[-180px] lg:left-[-140px] xl:left-[-80px] w-[560px] sm:w-[660px] lg:w-[720px] h-[560px] sm:h-[660px] lg:h-[720px]"
            : spherePosition === "center"
            ? "left-1/2 -translate-x-1/2 w-[720px] h-[720px]"
            : "left-[-360px] sm:left-[-260px] md:left-[-190px] lg:left-[-140px] xl:left-[-80px] w-[580px] sm:w-[680px] lg:w-[740px] h-[580px] sm:h-[680px] lg:h-[740px]"
        }`}
      >

        <svg
          viewBox="0 0 800 800"
          className="w-full h-full drop-shadow-[0_25px_50px_rgba(0,0,0,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Sphere Body Radial Gradient */}
            <radialGradient
              id="sphereBodyGrad"
              cx="38%"
              cy="34%"
              r="62%"
              fx="38%"
              fy="34%"
            >
              <stop offset="0%" stopColor="#1e1e24" />
              <stop offset="40%" stopColor="#111114" />
              <stop offset="85%" stopColor="#08080a" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>

            {/* Glowing Atmosphere Rim */}
            <radialGradient
              id="sphereRimAuraGrad"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="82%" stopColor="#000000" stopOpacity="0" />
              <stop offset="95%" stopColor="#b5d5e1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.45" />
            </radialGradient>

            {/* Trajectory Gradients */}
            <linearGradient id="trajectoryGradFlow" x1="20%" y1="20%" x2="80%" y2="80%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#b9e303" stopOpacity="1" />
              <stop offset="100%" stopColor="#b5d5e1" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="trajectoryGradAlt" x1="10%" y1="80%" x2="90%" y2="30%">
              <stop offset="0%" stopColor="#a88ed4" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#b9e303" stopOpacity="0.4" />
            </linearGradient>

            <clipPath id="sphereClipPath">
              <circle cx="400" cy="400" r="370" />
            </clipPath>
          </defs>

          {/* Solid Base Celestial Sphere */}
          <circle
            cx="400"
            cy="400"
            r="370"
            fill="url(#sphereBodyGrad)"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth="1.8"
          />

          {/* Content Clipped Inside Sphere */}
          <g clipPath="url(#sphereClipPath)">
            {/* Ambient Interior Depth Glow */}
            <circle
              cx="320"
              cy="280"
              r="260"
              fill="#b5d5e1"
              fillOpacity="0.08"
              filter="blur(40px)"
            />
            <circle
              cx="480"
              cy="480"
              r="220"
              fill="#b9e303"
              fillOpacity="0.06"
              filter="blur(50px)"
            />

            {/* Rotated 3D Latitude Ellipses */}
            <g transform="rotate(-18 400 400)">
              {/* Polar Caps & Latitudes */}
              <ellipse
                cx="400"
                cy="140"
                rx="240"
                ry="48"
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="1.3"
              />
              <ellipse
                cx="400"
                cy="230"
                rx="320"
                ry="76"
                stroke="rgba(255, 255, 255, 0.32)"
                strokeWidth="1.3"
              />
              <ellipse
                cx="400"
                cy="320"
                rx="360"
                ry="105"
                stroke="rgba(255, 255, 255, 0.38)"
                strokeWidth="1.5"
              />

              {/* Equator (Dominant Perspective Axis) */}
              <ellipse
                cx="400"
                cy="410"
                rx="370"
                ry="130"
                stroke="rgba(255, 255, 255, 0.48)"
                strokeWidth="1.8"
              />

              {/* Southern Latitudes */}
              <ellipse
                cx="400"
                cy="510"
                rx="355"
                ry="110"
                stroke="rgba(255, 255, 255, 0.38)"
                strokeWidth="1.5"
              />
              <ellipse
                cx="400"
                cy="600"
                rx="315"
                ry="80"
                stroke="rgba(255, 255, 255, 0.32)"
                strokeWidth="1.3"
              />
              <ellipse
                cx="400"
                cy="680"
                rx="230"
                ry="50"
                stroke="rgba(255, 255, 255, 0.26)"
                strokeWidth="1.3"
              />

              {/* Longitude Meridians Converging at Poles */}
              <path
                d="M 400 30 Q 380 410 400 770"
                stroke="rgba(255, 255, 255, 0.42)"
                strokeWidth="1.5"
              />
              <path
                d="M 400 30 Q 240 410 400 770"
                stroke="rgba(255, 255, 255, 0.36)"
                strokeWidth="1.4"
              />
              <path
                d="M 400 30 Q 100 410 400 770"
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="1.2"
              />
              <path
                d="M 400 30 Q 560 410 400 770"
                stroke="rgba(255, 255, 255, 0.36)"
                strokeWidth="1.4"
              />
              <path
                d="M 400 30 Q 700 410 400 770"
                stroke="rgba(255, 255, 255, 0.28)"
                strokeWidth="1.2"
              />
            </g>

            {/* Dynamic Signal Trajectory Arcs (Deconflicted Signal Arcs) */}
            <path
              d="M 280 240 C 380 200, 560 260, 580 430 C 590 520, 520 620, 390 670"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
            />
            {/* Animated Flowing Signal Traveling Down the Arc */}
            <path
              d="M 280 240 C 380 200, 560 260, 580 430 C 590 520, 520 620, 390 670"
              stroke="url(#trajectoryGradFlow)"
              strokeWidth="2.8"
              strokeLinecap="round"
              className="animate-signal-flow"
            />

            {/* Secondary Sweeping Arc Across Transverse Plane */}
            <path
              d="M 180 520 C 320 460, 480 340, 620 280"
              stroke="url(#trajectoryGradAlt)"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="animate-signal-flow-fast"
            />

            {/* Telemetry Node A: Upper Right Pivot */}
            <g transform="translate(580, 430)">
              <circle
                r="22"
                fill="#b9e303"
                fillOpacity="0.35"
                className="animate-beacon-ping"
              />
              <circle r="8" fill="#000000" stroke="#b9e303" strokeWidth="3" />
              <circle r="3.5" fill="#ffffff" />
            </g>

            {/* Telemetry Node B: Polar Ingestion Vertex */}
            <g transform="translate(280, 240)">
              <circle
                r="16"
                fill="#b5d5e1"
                fillOpacity="0.4"
                className="animate-beacon-ping"
                style={{ animationDelay: "1s" }}
              />
              <circle r="7" fill="#000000" stroke="#b5d5e1" strokeWidth="2.5" />
              <circle r="3" fill="#ffffff" />
            </g>

            {/* Telemetry Node C: Lower Exit Gateway */}
            <g transform="translate(390, 670)">
              <circle
                r="14"
                fill="#ffffff"
                fillOpacity="0.3"
                className="animate-beacon-ping"
                style={{ animationDelay: "1.8s" }}
              />
              <circle r="6" fill="#000000" stroke="#ffffff" strokeWidth="2.5" />
              <circle r="2.5" fill="#b9e303" />
            </g>

            {/* Micro Satellite Coordinates */}
            <circle cx="480" cy="340" r="3.5" fill="#ffffff" opacity="0.9" />
            <circle cx="210" cy="410" r="3" fill="#b5d5e1" opacity="0.85" />
            <circle cx="510" cy="560" r="3" fill="#b9e303" opacity="0.9" />
          </g>

          {/* Sphere Outer Atmospheric Rim Ring */}
          <circle
            cx="400"
            cy="400"
            r="370"
            fill="url(#sphereRimAuraGrad)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
          />

          {/* Sleek Lower Geometric Wordmark (Exact Deconflicted Placement) */}
          {showWatermark && (
            <g transform="translate(250, 630)">
              <text
                x="0"
                y="0"
                fill="#ffffff"
                fontSize="48"
                fontWeight="900"
                letterSpacing="-0.03em"
                fontFamily="system-ui, -apple-system, sans-serif"
                opacity="0.98"
              >
                apaarnet
              </text>
              <circle cx="210" cy="-14" r="5" fill="#b9e303" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
