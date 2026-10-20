import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DollarSign } from "lucide-react";

export const metadata = { title: "Admin - Pricing" };

export default async function AdminPricingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { pricing: true, category: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <DollarSign size={20} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pricing & Commercial Information</h1>
          <p className="text-sm text-muted-foreground">Manage retail, wholesale, and export pricing for all products</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Manufacturer</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Retail (LKR)</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Export FOB (USD)</th>
                <th className="px-6 py-4 font-medium hidden lg:table-cell">Market Segment</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    <Link href={`/admin/pricing/${product.id}`} className="hover:text-primary transition-colors">
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono">{product.sku || "—"}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{product.manufacturer || "—"}</td>
                  <td className="px-6 py-4 text-foreground hidden sm:table-cell">
                    {product.pricing?.retailPriceLKR ? `Rs. ${product.pricing.retailPriceLKR.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-foreground hidden md:table-cell">
                    {product.pricing?.exportFobPriceUsd ? `$${product.pricing.exportFobPriceUsd.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">{product.pricing?.marketSegment || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.pricing ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {product.pricing ? "Priced" : "Not set"}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
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
