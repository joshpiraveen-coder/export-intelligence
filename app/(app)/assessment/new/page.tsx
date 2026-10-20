import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewAssessmentClient } from "./new-assessment-client";

export const metadata = { title: "New Assessment" };

export default async function NewAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ bundleId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;

  const [countries, products, bundle] = await Promise.all([
    prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isoCode: true, flag: true, region: true },
    }),
    prisma.product.findMany({
      where: companyId ? { companyId } : {},
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    resolvedSearchParams.bundleId
      ? prisma.bundle.findUnique({
          where: { id: resolvedSearchParams.bundleId },
          select: { id: true, name: true, items: { select: { productId: true } } },
        })
      : Promise.resolve(null),
  ]);

  const initialBundle = bundle
    ? { id: bundle.id, name: bundle.name, productIds: bundle.items.map((i) => i.productId) }
    : null;

  return <NewAssessmentClient countries={countries} products={products} initialBundle={initialBundle} />;
}
