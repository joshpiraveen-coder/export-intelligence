import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Box } from "lucide-react";

export const metadata = { title: "Admin - HS Codes" };

export default async function AdminHSCodesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  const hsCodes = await prisma.hSCode.findMany({
    orderBy: { code: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Box size={20} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">HS Codes Database</h1>
          <p className="text-sm text-muted-foreground">Manage Harmonized System codes</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Code</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {hsCodes.map((code) => (
                <tr key={code.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-medium font-mono text-foreground">{code.code}</td>
                  <td className="px-6 py-4 text-muted-foreground">{code.description}</td>
                  <td className="px-6 py-4 text-muted-foreground">{code.category || "N/A"}</td>
                </tr>
              ))}
              {hsCodes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No HS codes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
