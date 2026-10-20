import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, ExternalLink, AlertTriangle } from "lucide-react";

export const metadata = { title: "Admin - Regulations" };

export default async function AdminRegulationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN") redirect("/dashboard");

  const regulations = await prisma.regulation.findMany({
    orderBy: { createdAt: "desc" },
    include: { country: true }
  });
  const unsourcedCount = regulations.filter((r) => !r.sourceUrl).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <FileText size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Global Regulations</h1>
            <p className="text-sm text-muted-foreground">
              {regulations.length} regulations · {unsourcedCount > 0 ? `${unsourcedCount} unverified (no source)` : "all sourced"}
            </p>
          </div>
        </div>
        <Link href="/admin/regulations/new">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Add Regulation
          </button>
        </Link>
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Country</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Category</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {regulations.map((reg) => (
                <tr key={reg.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{reg.country.name}</td>
                  <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">{reg.category}</td>
                  <td className="px-6 py-4 text-foreground">{reg.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      reg.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-700 border border-red-500/20' :
                      reg.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-700 border border-orange-500/20' :
                      reg.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                    }`}>
                      {reg.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {reg.sourceUrl ? (
                      <a href={reg.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        {reg.sourceAuthority || "Source"} <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-xs text-amber-700 flex items-center gap-1">
                        <AlertTriangle size={11} /> Unverified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {regulations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No regulations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
