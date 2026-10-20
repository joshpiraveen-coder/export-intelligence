import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id! },
    include: { company: true },
  });

  if (!user) redirect("/login");

  return (
    <SettingsClient
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.company?.name || null,
        createdAt: user.createdAt,
      }}
    />
  );
}
