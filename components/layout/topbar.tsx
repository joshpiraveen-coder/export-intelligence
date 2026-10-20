"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, Search, ChevronDown, LogOut, Settings, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onToggleSidebar?: () => void;
  title?: string;
}

export function Topbar({ onToggleSidebar, title }: TopbarProps) {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-red-500/15 text-red-700 border-red-500/30",
    COMPANY_ADMIN: "bg-purple-500/15 text-purple-700 border-purple-500/30",
    EXPORT_MANAGER: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    VIEWER: "bg-gray-500/15 text-gray-700 border-gray-500/30",
  };

  const userRole = (session?.user as any)?.role || "VIEWER";

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 gap-4 sticky top-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <Menu size={18} />
        </button>
        {title && (
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        )}
      </div>

      {/* Center — Search */}
      <div className="flex-1 min-w-0 max-w-md">
        <Link href="/search">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer">
            <Search size={14} className="flex-shrink-0" />
            <span className="hidden sm:inline truncate">Search products, countries, regulations…</span>
            <span className="sm:hidden truncate">Search…</span>
            <span className="hidden md:inline ml-auto text-xs bg-background px-1.5 py-0.5 rounded border border-border font-mono flex-shrink-0">
              ⌘K
            </span>
          </div>
        </Link>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-tight">
                {session?.user?.name || "User"}
              </p>
            </div>
            <span
              className={cn(
                "hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
                roleColors[userRole]
              )}
            >
              {userRole.replace("_", " ")}
            </span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 py-1 animate-scale-in">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <Link href="/settings">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Settings size={14} />
                  Profile &amp; Settings
                </button>
              </Link>
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
