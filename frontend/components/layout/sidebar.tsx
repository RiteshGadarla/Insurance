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
    Users,
    Building2,
    LogOut,
    Files
} from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

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
        <div className="w-64 border-r border-gray-200 bg-white min-h-screen p-4 flex flex-col shadow-sm">
            <div className="mb-8 font-bold text-xl px-4 text-blue-600 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                InsureVerify
            </div>

            <div className="px-4 mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {role ? role.replace("_", " ") : "Menu"}
            </div>

            <nav className="space-y-1 flex-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 group font-medium text-sm",
                                pathname === link.href
                                    ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn("h-4 w-4", pathname === link.href ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto px-4 pt-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </div>
    );
}
