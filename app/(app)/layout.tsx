"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useSession } from "next-auth/react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileMenuOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        userRole={userRole}
        mobileOpen={mobileMenuOpen}
        onNavigate={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
