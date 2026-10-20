"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

type RiskLevel = "GREEN" | "YELLOW" | "RED" | "INFO";
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

export function RiskBadge({
  level,
  label,
  size = "md",
  pulse = false,
  className,
}: RiskBadgeProps) {
  const config: Record<RiskLevel, { icon: React.ReactNode; text: string; cls: string }> = {
    GREEN: {
      icon: <CheckCircle size={size === "sm" ? 12 : 14} />,
      text: label || "Compliant",
      cls: "risk-green",
    },
    YELLOW: {
      icon: <AlertTriangle size={size === "sm" ? 12 : 14} />,
      text: label || "Conditional",
      cls: "risk-yellow",
    },
    RED: {
      icon: <XCircle size={size === "sm" ? 12 : 14} />,
      text: label || "Restricted",
      cls: "risk-red",
    },
    INFO: {
      icon: <Info size={size === "sm" ? 12 : 14} />,
      text: label || "Info",
      cls: "bg-blue-500/15 text-blue-700 border border-blue-500/30",
    },
  };

  const { icon, text, cls } = config[level];

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        cls,
        sizeClasses[size],
        pulse && level === "RED" && "risk-pulse",
        className
      )}
    >
      {icon}
      {text}
    </motion.span>
  );
}

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config: Record<Severity, { label: string; cls: string }> = {
    CRITICAL: { label: "Critical", cls: "bg-red-500/15 text-red-700 border border-red-500/30" },
    HIGH: { label: "High", cls: "bg-orange-500/15 text-orange-700 border border-orange-500/30" },
    MEDIUM: { label: "Medium", cls: "bg-amber-500/15 text-amber-700 border border-amber-500/30" },
    LOW: { label: "Low", cls: "bg-blue-500/15 text-blue-700 border border-blue-500/30" },
    INFO: { label: "Info", cls: "bg-slate-500/15 text-slate-700 border border-slate-500/30" },
  };

  const { label, cls } = config[severity] || config.INFO;

  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide",
        cls,
        className
      )}
    >
      {label}
    </span>
  );
}

interface WarningCardProps {
  severity: Severity;
  title: string;
  description: string;
  remediation?: string;
}

export function WarningCard({ severity, title, description, remediation }: WarningCardProps) {
  const borderColors: Record<Severity, string> = {
    CRITICAL: "border-red-500/40 bg-red-500/5",
    HIGH: "border-orange-500/40 bg-orange-500/5",
    MEDIUM: "border-amber-500/40 bg-amber-500/5",
    LOW: "border-blue-500/40 bg-blue-500/5",
    INFO: "border-border bg-secondary/50",
  };

  return (
    <div className={cn("rounded-xl border p-4 space-y-2", borderColors[severity])}>
      <div className="flex items-center gap-2">
        <SeverityBadge severity={severity} />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {remediation && (
        <div className="text-sm text-foreground/80 bg-background/50 rounded-lg px-3 py-2 border border-border">
          <span className="text-xs font-medium text-muted-foreground mr-1">Remedy:</span>
          {remediation}
        </div>
      )}
    </div>
  );
}
