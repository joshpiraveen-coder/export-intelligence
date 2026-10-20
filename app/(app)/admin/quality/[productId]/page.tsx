import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { QualityFormClient } from "./quality-form-client";

export const metadata = { title: "Quality & Traceability" };

export default async function AdminQualityProductPage({
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
    include: {
      qualityRecords: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) notFound();

  return <QualityFormClient product={product} records={product.qualityRecords} />;
}
