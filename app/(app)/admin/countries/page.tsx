import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Plus, Edit, Globe } from "lucide-react";

export const metadata = { title: "Admin - Countries" };

export default async function AdminCountriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN") redirect("/admin");

  const countries = await prisma.country.findMany({
    include: { _count: { select: { regulations: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Countries</h1>
          <p className="text-sm text-muted-foreground">{countries.length} countries in database</p>
        </div>
        <Link href="/admin/countries/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium">
            <Plus size={14} /> Add Country
          </button>
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Country", "ISO", "Region", "Regulations", "Active", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {countries.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.flag || "🌍"}</span>
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{c.isoCode}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.region || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c._count.regulations}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Link href={`/countries/${c.id}`}>
                        <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                          <Globe size={13} />
                        </button>
                      </Link>
                      <Link href={`/admin/countries/${c.id}/edit`}>
                        <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                          <Edit size={13} />
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
