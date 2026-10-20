import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
        <span className="text-red-400 text-xs font-semibold">⚠️ ADMIN AREA</span>
        <span className="text-xs text-muted-foreground">Changes here affect the entire platform</span>
      </div>
      {children}
    </div>
  );
}
