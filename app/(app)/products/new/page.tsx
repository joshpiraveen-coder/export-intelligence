import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductFormClient } from "./product-form-client";

export const metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const categories = await prisma.productCategory.findMany({ orderBy: { name: "asc" } });

  return <ProductFormClient categories={categories} />;
}
