import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Boxes, Package, ClipboardCheck } from "lucide-react";
import { RiskBadge } from "@/components/ui/risk-badge";
import { formatRelative, countryFlag } from "@/lib/utils";
import { BundleDetailClient } from "./bundle-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await prisma.bundle.findUnique({ where: { id }, select: { name: true } });
  return { title: bundle?.name || "Bundle" };
}

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bundle = await prisma.bundle.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { category: true } } } },
      assessments: {
        include: { destination: { select: { name: true, isoCode: true, flag: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!bundle) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/bundles">
            <button className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Boxes size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{bundle.name}</h1>
            <p className="text-sm text-muted-foreground">{bundle.items.length} products</p>
          </div>
        </div>
        <BundleDetailClient bundleId={bundle.id} bundleName={bundle.name} />
      </div>

      {bundle.description && (
        <div className="glass-card p-5">
          <p className="text-sm text-muted-foreground">{bundle.description}</p>
        </div>
      )}

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Package size={14} className="text-primary" /> Products in this Bundle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bundle.items.map((item) => (
            <Link key={item.id} href={`/products/${item.productId}`}>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border hover:border-primary/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product.sku || item.product.category?.name || "—"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ClipboardCheck size={14} className="text-primary" /> Assessments from this Bundle
        </h3>
        {bundle.assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assessments run for this bundle yet.</p>
        ) : (
          <div className="space-y-2">
            {bundle.assessments.map((a) => (
              <Link key={a.id} href={`/assessment/${a.id}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base flex-shrink-0">
                    {a.destination?.flag || countryFlag(a.destination?.isoCode || "XX")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {a.title || `Assessment to ${a.destination?.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
                  </div>
                  {a.riskLevel && <RiskBadge level={a.riskLevel as any} size="sm" />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
