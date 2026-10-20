import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegulationFormClient } from "./regulation-form-client";

export const metadata = { title: "Add Regulation" };

export default async function NewRegulationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  const countries = await prisma.country.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, isoCode: true, flag: true },
  });

  return <RegulationFormClient countries={countries} />;
}
