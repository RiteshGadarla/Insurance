"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, ShieldCheck, PlusCircle } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    const links = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/claims/new", label: "Create Claim", icon: PlusCircle },
        { href: "/policies/new", label: "Add Policy", icon: ShieldCheck },
        // Add more links if we implement list pages for Claims/Policies
    ];

    if (pathname === "/" || pathname === "/login") return null;

    return (
        <div className="w-64 border-r border-black min-h-screen p-4 flex flex-col">
            <div className="mb-8 font-bold text-xl px-4">InsureVerify</div>
            <nav className="space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-md transition-colors hover:bg-gray-100",
                                pathname === link.href ? "bg-black text-white hover:bg-black/90" : "text-gray-700"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-auto px-4 pb-4">
                <div className="text-xs text-muted-foreground">Logged in as Staff</div>
                <Link href="/" className="text-xs underline mt-2 block">Logout</Link>
            </div>
        </div>
    );
}
