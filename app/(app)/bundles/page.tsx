import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Boxes, Plus, Package, ClipboardCheck } from "lucide-react";

export const metadata = { title: "Bundles" };

export default async function BundlesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;

  const bundles = await prisma.bundle.findMany({
    where: { isActive: true, ...(companyId ? { companyId } : {}) },
    include: {
      items: { include: { product: { select: { name: true } } } },
      _count: { select: { assessments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bundles</h1>
          <p className="text-sm text-muted-foreground">
            {bundles.length} product bundle{bundles.length === 1 ? "" : "s"} ready for assessment
          </p>
        </div>
        <Link href="/bundles/new">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
            <Plus size={16} />
            Create Bundle
          </button>
        </Link>
      </div>

      {bundles.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Boxes size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">No bundles yet</p>
          <p className="text-xs mt-1 max-w-sm text-center">
            Group products you frequently export together so you can re-run a compliance assessment for all of them in one click.
          </p>
          <Link href="/bundles/new">
            <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
              Create your first bundle
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map((bundle) => (
            <Link key={bundle.id} href={`/bundles/${bundle.id}`}>
              <div className="glass-card p-5 hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Boxes size={18} className="text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{bundle.name}</p>
                </div>
                {bundle.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{bundle.description}</p>
                )}
                <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <Package size={12} /> {bundle.items.length} product{bundle.items.length === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardCheck size={12} /> {bundle._count.assessments} assessment{bundle._count.assessments === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
