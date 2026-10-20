import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ProductFormClient } from "../../new/product-form-client";

export const metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return <ProductFormClient categories={categories} product={product} />;
}
