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
    X
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [collapsed, setCollapsed] = useState(true);

    useEffect(() => {
        setMounted(true);
        const storedRole = localStorage.getItem("role");
        setRole(storedRole);
    }, [pathname]);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    if (!mounted) return null;
    if (pathname === "/" || pathname === "/login") return null;

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
            {/* Overlay for mobile when sidebar is open */}
            {!collapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setCollapsed(true)}
                ></div>
            )}

            {/* Floating Hamburger Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="fixed top-6 left-6 z-50 p-2.5 hover:bg-emerald-100 rounded-lg transition-all duration-300 bg-white shadow-md border border-emerald-200 md:hidden"
            >
                {collapsed ? (
                    <Menu className="h-6 w-6 text-emerald-600" />
                ) : (
                    <X className="h-6 w-6 text-emerald-600" />
                )}
            </button>

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed md:static w-64 border-r border-emerald-100 bg-gradient-to-b from-white to-emerald-50 min-h-screen p-4 flex flex-col shadow-sm transition-all duration-300 ease-in-out z-40",
                    collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
                )}
            >
                {/* Logo Section */}
                <div className="mb-8 font-bold text-xl px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
                    <div className="p-2 bg-white/20 rounded-md">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold">ClaimVerify</div>
                        <div className="text-xs font-medium text-emerald-100">AI Verification</div>
                    </div>
                </div>

                {/* Menu Label */}
                <div className="px-4 mb-6 text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-emerald-600"></div>
                    {role ? role.replace("_", " ") : "Menu"}
                </div>

                {/* Navigation */}
                <nav className="space-y-2 flex-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 group font-medium text-sm",
                                    isActive
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md ring-2 ring-emerald-200"
                                        : "text-slate-700 hover:bg-emerald-100/50 hover:text-emerald-700"
                                )}
                                onClick={() => setCollapsed(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive
                                            ? "text-white"
                                            : "text-slate-500 group-hover:text-emerald-600"
                                    )} />
                                    <span>{link.label}</span>
                                </div>
                                {isActive && (
                                    <ChevronRight className="h-4 w-4 text-white" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="my-4 h-px bg-gradient-to-r from-emerald-200 to-transparent"></div>

                {/* User Info Section */}
                <div className="px-4 py-3 bg-emerald-50 rounded-lg border border-emerald-200 mb-4">
                    <p className="text-xs text-slate-600 mb-1">Logged in as</p>
                    <p className="text-sm font-semibold text-emerald-700 truncate">
                        {role ? role.replace("_", " ").toUpperCase() : "User"}
                    </p>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>

                {/* Footer Text */}
                <div className="mt-6 pt-4 border-t border-emerald-100">
                    <p className="text-xs text-center text-slate-500">
                        <span className="font-semibold text-emerald-600">ClaimVerify AI</span><br />
                        Verification System v1.0
                    </p>
                </div>
            </div>
        </>
    );
}