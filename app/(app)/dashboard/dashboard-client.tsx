"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Package, Globe, ClipboardCheck, TrendingUp,
  AlertTriangle, ArrowUpRight, Activity, Zap, Clock,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ComplianceGauge } from "@/components/ui/compliance-gauge";
import { WorldMap } from "@/components/ui/world-map";
import { formatDate, formatRelative, countryFlag } from "@/lib/utils";
import Link from "next/link";

interface DashboardClientProps {
  data: {
    stats: {
      totalProducts: number;
      totalAssessments: number;
      countriesAnalyzed: number;
      successRate: number;
      highRiskCount: number;
      pendingCount: number;
    };
    recentAssessments: any[];
    riskDistribution: { name: string; value: number }[];
    monthlyTrend: { month: string; assessments: number }[];
    topCountries: { name: string; isoCode: string; count: number }[];
    regulationUpdates: any[];
  };
  userName: string;
}

const RISK_COLORS: Record<string, string> = {
  GREEN: "#0f7a52",
  YELLOW: "#b9791e",
  RED: "#c2402f",
  null: "#8a8071",
  Unknown: "#8a8071",
};

const TOOLTIP_STYLE = {
  background: "hsl(40 33% 99%)",
  border: "1px solid hsl(38 22% 86%)",
  borderRadius: 8,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function DashboardClient({ data, userName }: DashboardClientProps) {
  const { stats, recentAssessments, riskDistribution, monthlyTrend, topCountries, regulationUpdates } = data;

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: <Package size={20} />,
      color: "text-blue-700",
      bg: "bg-blue-500/10",
      change: "+12% this month",
    },
    {
      label: "Countries Analyzed",
      value: stats.countriesAnalyzed,
      icon: <Globe size={20} />,
      color: "text-purple-700",
      bg: "bg-purple-500/10",
      change: `${stats.countriesAnalyzed} destinations`,
    },
    {
      label: "Assessments",
      value: stats.totalAssessments,
      icon: <ClipboardCheck size={20} />,
      color: "text-indigo-700",
      bg: "bg-indigo-500/10",
      change: "All time",
    },
    {
      label: "Success Rate",
      value: `${stats.successRate}%`,
      icon: <TrendingUp size={20} />,
      color: "text-emerald-700",
      bg: "bg-emerald-500/10",
      change: "Compliance ≥70",
    },
    {
      label: "High Risk Products",
      value: stats.highRiskCount,
      icon: <AlertTriangle size={20} />,
      color: "text-red-700",
      bg: "bg-red-500/10",
      change: "Require attention",
      alert: stats.highRiskCount > 0,
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {userName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s your export compliance overview
          </p>
        </div>
        <Link href="/assessment/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm">
            <Zap size={16} />
            New Assessment
          </button>
        </Link>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={cn("stat-card", card.alert && "border-red-500/30")}>
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", card.bg)}>
                <span className={card.color}>{card.icon}</span>
              </div>
              {card.alert && (
                <span className="w-2 h-2 rounded-full bg-red-500 risk-pulse" />
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-foreground mt-0.5 font-medium">{card.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <motion.div variants={itemVariants} className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Assessment Trend</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <Activity size={16} className="text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="assessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b8860b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#b8860b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="assessments"
                stroke="#b8860b"
                strokeWidth={2}
                fill="url(#assessGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div variants={itemVariants} className="glass-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Risk Distribution</h3>
            <p className="text-xs text-muted-foreground">All assessments</p>
          </div>
          {riskDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={RISK_COLORS[entry.name] || "#8a8071"}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "hsl(30 12% 42%)", fontSize: 11 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
              No assessment data yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Global Export Network */}
      <motion.div variants={itemVariants} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Global Export Network</h3>
            <p className="text-xs text-muted-foreground">Your top destinations, mapped from Sri Lanka</p>
          </div>
          <Globe size={16} className="text-muted-foreground" />
        </div>
        <WorldMap destinations={topCountries} />
      </motion.div>

      {/* Compliance Score / Recent Assessments / Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="glass-card p-5 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-semibold text-foreground mb-1">Compliance Score</h3>
          <p className="text-xs text-muted-foreground mb-4">Based on completed assessments</p>
          <ComplianceGauge score={stats.successRate} size={140} />
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Assessments</h3>
              <p className="text-xs text-muted-foreground">Latest activity</p>
            </div>
            <Link href="/reports">
              <button className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowUpRight size={12} />
              </button>
            </Link>
          </div>
          <div className="space-y-2">
            {recentAssessments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <ClipboardCheck size={24} className="mx-auto mb-2 opacity-40" />
                No assessments yet.{" "}
                <Link href="/assessment/new" className="text-primary hover:underline">
                  Create your first one
                </Link>
              </div>
            ) : (
              recentAssessments.slice(0, 5).map((a) => (
                <Link key={a.id} href={`/assessment/${a.id}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base flex-shrink-0">
                      {a.destination?.flag || countryFlag(a.destination?.isoCode || "XX")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {a.title || `Assessment to ${a.destination?.name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.items?.length || 0} products • {formatRelative(a.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {a.riskLevel ? (
                        <RiskBadge level={a.riskLevel} size="sm" />
                      ) : (
                        <span className="text-xs text-muted-foreground capitalize">
                          {a.status.toLowerCase()}
                        </span>
                      )}
                      <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-amber-700" />
            <h3 className="text-sm font-semibold text-foreground">Pending</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Assessments in progress</p>
          <p className="text-4xl font-bold text-foreground">{stats.pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.pendingCount === 0 ? "All caught up" : "awaiting completion"}
          </p>
        </motion.div>
      </div>

      {/* Regulation Updates */}
      {regulationUpdates.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Regulation Updates</h3>
              <p className="text-xs text-muted-foreground">Latest regulatory changes</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {regulationUpdates.map((update) => (
              <div
                key={update.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle size={12} className="text-amber-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-1">
                    {update.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {update.regulation?.country?.name} •{" "}
                    {formatDate(update.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
