import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "Admin - Quality & Traceability" };

export default async function AdminQualityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { qualityRecords: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <ShieldCheck size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quality Assurance & Traceability</h1>
          <p className="text-sm text-muted-foreground">Manage batch records, lab results, and traceability for all products</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Manufacturer</th>
                <th className="px-6 py-4 font-medium">Batch Records</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    <Link href={`/admin/quality/${product.id}`} className="hover:text-primary transition-colors">
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono">{product.sku || "—"}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{product.manufacturer || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${product._count.qualityRecords > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {product._count.qualityRecords} record{product._count.qualityRecords === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/quality/${product.id}`} className="text-primary hover:underline font-medium text-sm">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No products found.
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
