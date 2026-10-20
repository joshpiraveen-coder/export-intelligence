"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ComplianceGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function ComplianceGauge({
  score,
  size = 140,
  showLabel = true,
  className,
}: ComplianceGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use 75% of the circle (270 degrees)
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength - (clampedScore / 100) * arcLength;

  const color =
    clampedScore >= 80
      ? "#10b981" // emerald
      : clampedScore >= 50
      ? "#f59e0b" // amber
      : "#ef4444"; // red

  const label =
    clampedScore >= 80 ? "COMPLIANT" : clampedScore >= 50 ? "CONDITIONAL" : "RESTRICTED";

  return (
    <div
      className={cn("flex flex-col items-center gap-2", className)}
      style={{ width: size }}
    >
      <svg
        width={size}
        height={size * 0.75}
        viewBox={`0 0 ${size} ${size * 0.75}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={10}
          strokeDasharray={arcLength}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />

        {/* Colored progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength}
          strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />

        {/* Score text */}
        <text
          x={size / 2}
          y={size * 0.55}
          textAnchor="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {clampedScore}
        </text>
        <text
          x={size / 2}
          y={size * 0.68}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={size * 0.09}
          fontFamily="Inter, sans-serif"
        >
          / 100
        </text>
      </svg>

      {showLabel && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={cn(
            "text-xs font-semibold px-3 py-1 rounded-full border",
            clampedScore >= 80 && "risk-green",
            clampedScore >= 50 && clampedScore < 80 && "risk-yellow",
            clampedScore < 50 && "risk-red"
          )}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}
