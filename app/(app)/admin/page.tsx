import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Shield, Package, Globe, Users, FileText, Settings,
  TrendingUp, Database, AlertTriangle, DollarSign, ShieldCheck, Box
} from "lucide-react";

export const metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  const [products, countries, regulations, users, hsCodes, assessments, pricedProducts, qaRecords, auditLogs] =
    await Promise.all([
      prisma.product.count(),
      prisma.country.count(),
      prisma.regulation.count(),
      prisma.user.count(),
      prisma.hSCode.count(),
      prisma.exportAssessment.count(),
      prisma.productPricing.count(),
      prisma.productQualityRecord.count(),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } }),
    ]);

  const adminCards = [
    { label: "Products", count: products, href: "/admin/products", icon: Package, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Countries", count: countries, href: "/admin/countries", icon: Globe, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Regulations", count: regulations, href: "/admin/regulations", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Users", count: users, href: "/admin/users", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "HS Codes", count: hsCodes, href: "/admin/hs-codes", icon: Box, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Assessments", count: assessments, href: "/reports", icon: TrendingUp, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Priced Products", count: pricedProducts, href: "/admin/pricing", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "QA Batch Records", count: qaRecords, href: "/admin/quality", icon: ShieldCheck, color: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Shield size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">System management and configuration</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {adminCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="stat-card cursor-pointer hover:border-primary/40 group">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon size={18} className={card.color} />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.count}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Country", href: "/admin/countries/new", icon: Globe },
            { label: "Add Regulation", href: "/admin/regulations/new", icon: FileText },
            { label: "Add Product", href: "/products/new", icon: Package },
            { label: "Manage Users", href: "/admin/users", icon: Users },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <button className="w-full flex items-center gap-2 px-4 py-3 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-secondary/50 transition-all">
                <action.icon size={15} />
                {action.label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database size={16} className="text-muted-foreground" />
          Recent Audit Logs
        </h3>
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                log.action === "DELETE" ? "bg-red-500/20 text-red-400" :
                log.action === "CREATE" ? "bg-emerald-500/20 text-emerald-400" :
                "bg-blue-500/20 text-blue-400"
              }`}>
                {log.action}
              </div>
              <span className="text-sm text-muted-foreground">{log.entity}</span>
              {log.entityId && <span className="text-xs text-muted-foreground font-mono">{log.entityId.slice(0, 8)}</span>}
              <span className="text-xs text-muted-foreground ml-auto">{log.user?.name}</span>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No audit logs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
