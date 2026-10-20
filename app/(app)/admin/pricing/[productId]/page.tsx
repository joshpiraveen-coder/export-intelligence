import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PricingFormClient } from "./pricing-form-client";

export const metadata = { title: "Edit Pricing" };

export default async function AdminPricingEditPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { pricing: true },
  });

  if (!product) notFound();

  return <PricingFormClient product={product} pricing={product.pricing} />;
}
