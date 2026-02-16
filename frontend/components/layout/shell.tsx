"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isPublic = pathname === "/" || pathname === "/login";

    return (
        <div className="min-h-screen bg-gray-50/50">
            {!isPublic && <Sidebar />}

            <main
                className={cn(
                    "min-h-screen transition-all duration-300",
                    !isPublic ? "md:ml-64" : "w-full"
                )}
            >
                {children}
            </main>
        </div>
    );
}
