import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductsClient } from "./products-client";

export const metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  const page = parseInt(resolvedSearchParams.page || "1");
  const pageSize = 20;

  const where: any = {};
  if (companyId) where.companyId = companyId;
  if (resolvedSearchParams.q) {
    where.OR = [
      { name: { contains: resolvedSearchParams.q } },
      { sku: { contains: resolvedSearchParams.q } },
      { barcode: { contains: resolvedSearchParams.q } },
      { description: { contains: resolvedSearchParams.q } },
    ];
  }
  if (resolvedSearchParams.category) where.categoryId = resolvedSearchParams.category;

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        _count: { select: { complianceResults: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <Suspense fallback={null}>
      <ProductsClient
        products={products}
        total={total}
        page={page}
        pageSize={pageSize}
        categories={categories}
      />
    </Suspense>
  );
}
