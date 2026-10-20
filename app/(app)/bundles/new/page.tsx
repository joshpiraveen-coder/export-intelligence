import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BundleFormClient } from "./bundle-form-client";

export const metadata = { title: "Create Bundle" };

export default async function NewBundlePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;

  const products = await prisma.product.findMany({
    where: companyId ? { companyId } : {},
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return <BundleFormClient products={products} />;
}
