import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate, formatRelative, countryFlag } from "@/lib/utils";
import { RiskBadge } from "@/components/ui/risk-badge";
import { BarChart3, Download, ExternalLink, ClipboardCheck } from "lucide-react";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id!;
  const role = (session.user as any).role;

  const assessments = await prisma.exportAssessment.findMany({
    where: role === "SUPER_ADMIN" ? {} : { userId },
    include: {
      destination: { select: { name: true, isoCode: true, flag: true } },
      origin: { select: { name: true } },
      items: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {assessments.length} compliance assessments
          </p>
        </div>
        <Link href="/assessment/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
            <ClipboardCheck size={16} />
            New Assessment
          </button>
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        {assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No assessments yet</p>
            <Link href="/assessment/new">
              <button className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">
                Create Assessment
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Assessment</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Products</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Risk</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {a.title || `Assessment #${a.id.slice(0, 8)}`}
                      </p>
                      {role === "SUPER_ADMIN" && (
                        <p className="text-xs text-muted-foreground">{a.user?.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{a.destination?.flag || countryFlag(a.destination?.isoCode || "XX")}</span>
                        <span className="text-sm text-foreground">{a.destination?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {a.items?.length || 0} items
                    </td>
                    <td className="px-4 py-3">
                      {a.overallScore != null ? (
                        <span className={`text-sm font-bold ${a.overallScore >= 80 ? "text-emerald-400" : a.overallScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                          {a.overallScore}/100
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground capitalize">{a.status.toLowerCase()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {a.riskLevel ? (
                        <RiskBadge level={a.riskLevel as any} size="sm" />
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {formatRelative(a.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link href={`/assessment/${a.id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                            <ExternalLink size={14} />
                          </button>
                        </Link>
                        <a href={`/api/reports/${a.id}/pdf`} download>
                          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                            <Download size={14} />
                          </button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
