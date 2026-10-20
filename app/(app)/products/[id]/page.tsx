import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { RiskBadge } from "@/components/ui/risk-badge";
import {
  ArrowLeft, Edit, Package, MapPin, Leaf, Box, BarChart3, ClipboardCheck,
} from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product?.name || "Product" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      complianceResults: {
        include: { assessment: { include: { destination: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!product) notFound();

  const badges = [
    product.isHalal && { label: "Halal", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    product.isOrganic && { label: "Organic", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
    product.isVegan && { label: "Vegan", cls: "bg-lime-500/15 text-lime-400 border-lime-500/30" },
    product.isGlutenFree && { label: "Gluten Free", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  ].filter(Boolean) as { label: string; cls: string }[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link href="/products">
            <button className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{product.name}</h1>
            <p className="text-sm text-muted-foreground">
              {product.sku || "No SKU"} • {product.category?.name || "Uncategorized"}
            </p>
          </div>
        </div>
        <Link href={`/products/${product.id}/edit`} className="sm:ml-auto">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Edit size={14} />
            Edit Product
          </button>
        </Link>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b.label} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${b.cls}`}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Basic Info */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Package size={14} className="text-blue-400" /> Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Barcode" value={product.barcode} />
          <Field label="Manufacturer" value={product.manufacturer} />
          <Field label="Country of Origin" value={product.countryOfOrigin} />
          <Field label="HS Code" value={product.hsCode} mono />
          {product.description && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Food Info */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Leaf size={14} className="text-emerald-400" /> Food Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Food Category" value={product.foodCategory} />
          <Field label="Shelf Life" value={product.shelfLifeDays ? `${product.shelfLifeDays} days` : null} />
          <Field label="Storage Conditions" value={product.storageConditions} />
          {product.ingredients && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Ingredients</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{product.ingredients}</p>
            </div>
          )}
        </div>
      </div>

      {/* Packaging */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Box size={14} className="text-purple-400" /> Packaging & Export
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Package Type" value={product.packageType} />
          <Field label="Material" value={product.packageMaterial} />
          <Field label="Weight" value={product.weightGrams ? `${product.weightGrams}g` : null} />
          <Field label="Qty / Carton" value={product.qtyPerCarton} />
          <Field label="Export Category" value={product.exportCategory} />
          <Field label="Customs Description" value={product.customsDesc} />
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ClipboardCheck size={14} className="text-indigo-400" /> Recent Compliance Results
        </h3>
        {product.complianceResults.length === 0 ? (
          <p className="text-sm text-muted-foreground">No compliance assessments yet for this product.</p>
        ) : (
          <div className="space-y-2">
            {product.complianceResults.map((r) => (
              <Link key={r.id} href={`/assessment/${r.assessmentId}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                      <MapPin size={12} className="text-muted-foreground flex-shrink-0" />
                      {r.assessment.destination?.name || "Unknown destination"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                  <RiskBadge level={r.riskLevel as any} size="sm" />
                  <span className="text-sm font-bold text-foreground w-14 text-right">{r.score}/100</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}
