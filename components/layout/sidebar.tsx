"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Globe,
  ClipboardCheck,
  FileText,
  Settings,
  Shield,
  Bot,
  BarChart3,
  ChevronRight,
  Boxes,
  X,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: "/products",
    label: "Products",
    icon: <Package size={18} />,
  },
  {
    href: "/countries",
    label: "Countries",
    icon: <Globe size={18} />,
  },
  {
    href: "/assessment/new",
    label: "New Assessment",
    icon: <ClipboardCheck size={18} />,
    badge: "AI",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: <BarChart3 size={18} />,
  },
  {
    href: "/bundles",
    label: "Bundles",
    icon: <Boxes size={18} />,
  },
  {
    href: "/ai-assistant",
    label: "AI Assistant",
    icon: <Bot size={18} />,
    badge: "Beta",
  },
  {
    href: "/documents",
    label: "Documents",
    icon: <FileText size={18} />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings size={18} />,
  },
];

const adminItems: NavItem[] = [
  {
    href: "/admin",
    label: "Admin Panel",
    icon: <Shield size={18} />,
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  userRole?: string;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ isCollapsed = false, userRole, mobileOpen = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
        "fixed inset-y-0 left-0 z-50 w-72 md:static md:z-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
        isCollapsed ? "md:w-16" : "md:w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">JB</span>
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden flex-1"
          >
            <p className="text-sm font-semibold text-foreground leading-tight">
              Jaffna Basket
            </p>
            <p className="text-xs text-muted-foreground">Export Intelligence</p>
          </motion.div>
        )}
        <button
          onClick={onNavigate}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {!isCollapsed && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Main Menu
          </p>
        )}

        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate}>
            <div
              className={cn(
                "sidebar-item",
                isActive(item.href) && "active",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <span className="flex-1 text-sm">{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="text-[10px] font-medium bg-primary/20 text-primary px-1.5 py-0.5 rounded-full border border-primary/30">
                  {item.badge}
                </span>
              )}
            </div>
          </Link>
        ))}

        {/* Admin section */}
        {(userRole === "SUPER_ADMIN" || userRole === "COMPANY_ADMIN") && (
          <>
            {!isCollapsed && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-2">
                Administration
              </p>
            )}
            {adminItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={onNavigate}>
                <div
                  className={cn(
                    "sidebar-item",
                    isActive(item.href) && "active",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="flex-1 text-sm">{item.label}</span>
                  )}
                </div>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Version */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">v1.0.0 • Production</p>
        </div>
      )}
    </aside>
  );
}
