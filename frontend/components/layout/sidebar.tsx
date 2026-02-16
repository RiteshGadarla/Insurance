"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  PlusCircle,
  Building2,
  LogOut,
  Files,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setMounted(true);
    setRole(localStorage.getItem("role"));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (!mounted) return null;
  if (pathname === "/" || pathname === "/login") return null;

  /* -------------------------
     SAFE ROLE-BASED THEMES
  ------------------------- */

  const themes = {
    admin: {
      border: "border-emerald-100",
      bg: "from-white to-emerald-50",
      logo: "from-emerald-600 to-teal-600",
      active: "from-emerald-500 to-teal-500",
      ring: "ring-emerald-200",
      hover: "hover:bg-emerald-100/60 hover:text-emerald-700",
      iconHover: "group-hover:text-emerald-600",
      divider: "bg-emerald-100",
      accent: "text-emerald-600",
    },
    hospital: {
      border: "border-blue-100",
      bg: "from-white to-blue-50",
      logo: "from-blue-600 to-indigo-600",
      active: "from-blue-500 to-indigo-500",
      ring: "ring-blue-200",
      hover: "hover:bg-blue-100/60 hover:text-blue-700",
      iconHover: "group-hover:text-blue-600",
      divider: "bg-blue-100",
      accent: "text-blue-600",
    },
    insurance_company: {
      border: "border-purple-100",
      bg: "from-white to-purple-50",
      logo: "from-purple-600 to-violet-600",
      active: "from-purple-500 to-violet-500",
      ring: "ring-purple-200",
      hover: "hover:bg-purple-100/60 hover:text-purple-700",
      iconHover: "group-hover:text-purple-600",
      divider: "bg-purple-100",
      accent: "text-purple-600",
    },
  };

  const theme =
    role === "admin"
      ? themes.admin
      : role === "insurance_company"
      ? themes.insurance_company
      : themes.hospital;

  /* -------------------------
     LINKS
  ------------------------- */

  let links: { href: string; label: string; icon: any }[] = [];

  if (role === "admin") {
    links = [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/hospitals", label: "Manage Hospitals", icon: Building2 },
      { href: "/admin/insurance", label: "Manage Insurance", icon: ShieldCheck },
    ];
  } else if (role === "hospital") {
    links = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/hospital/claims/new", label: "Submit Claim", icon: PlusCircle },
      { href: "/hospital/claims", label: "My Claims", icon: Files },
      { href: "/hospital/policies", label: "Internal Policies", icon: FileText },
    ];
  } else if (role === "insurance_company") {
    links = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/insurance/policies", label: "My Policies", icon: ShieldCheck },
      { href: "/insurance/hospitals", label: "Connected Hospitals", icon: Building2 },
      { href: "/insurance/claims", label: "Review Claims", icon: FileText },
    ];
  }

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-6 left-6 z-50 p-2.5 rounded-lg bg-white shadow-md border md:hidden"
      >
        {collapsed ? <Menu className="h-6 w-6" /> : <X className="h-6 w-6" />}
      </button>

      <div
        className={cn(
          "fixed md:static w-64 min-h-screen flex flex-col p-4 shadow-sm transition-all duration-300 z-40 border-r bg-gradient-to-b",
          theme.border,
          theme.bg,
          collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "mb-8 px-4 py-3 rounded-lg text-white shadow-md flex items-center gap-2 bg-gradient-to-r",
            theme.logo
          )}
        >
          <ShieldCheck className="h-5 w-5" />
          <div>
            <div className="text-lg font-bold">ClaimVerify</div>
            <div className="text-xs opacity-90">AI Verification</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setCollapsed(true)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition group",
                  isActive
                    ? cn(
                        "bg-gradient-to-r text-white shadow-md ring-2",
                        theme.active,
                        theme.ring
                      )
                    : cn("text-slate-700", theme.hover)
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition",
                      isActive ? "text-white" : cn("text-slate-500", theme.iconHover)
                    )}
                  />
                  {link.label}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-white" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto pt-6">
          <div className={cn("mb-4 h-px", theme.divider)} />

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition shadow-md"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>

          <div className="mt-6 text-xs text-center text-slate-500">
            <span className={cn("font-semibold", theme.accent)}>
              ClaimVerify AI
            </span>
            <br />
            Verification System v1.0
          </div>
        </div>
      </div>
    </>
  );
}