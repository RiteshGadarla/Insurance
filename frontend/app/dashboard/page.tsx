"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminView } from "@/components/dashboard/AdminView";
import { HospitalView } from "@/components/dashboard/HospitalView";
import { InsuranceView } from "@/components/dashboard/InsuranceView";

export default function DashboardPage() {
    const [role, setRole] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role");
        const storedName = localStorage.getItem("name");

        if (!token || !storedRole) {
            router.push("/login");
            return;
        }

        setRole(storedRole);
        setName(storedName);
        setLoading(false);
    }, [router]);

    // 🎨 Dynamic Theme Colors
    const theme = {
        background: "from-slate-50 to-gray-100",
        navbarBorder: "border-gray-200",
        highlightText: "from-gray-600 to-gray-800",
        roleText: "text-gray-700",
        loaderBorder: "border-gray-300",
        loaderTop: "border-t-gray-600",
    };

    if (role === "admin") {
        theme.background = "from-emerald-50 to-teal-50";
        theme.navbarBorder = "border-emerald-100";
        theme.highlightText = "from-emerald-600 to-teal-600";
        theme.roleText = "text-emerald-700";
        theme.loaderBorder = "border-emerald-200";
        theme.loaderTop = "border-t-emerald-600";
    }

    if (role === "hospital") {
        theme.background = "from-blue-50 to-cyan-50";
        theme.navbarBorder = "border-blue-100";
        theme.highlightText = "from-blue-600 to-cyan-600";
        theme.roleText = "text-blue-700";
        theme.loaderBorder = "border-blue-200";
        theme.loaderTop = "border-t-blue-600";
    }

    if (role === "insurance_company") {
        theme.background = "from-purple-50 to-indigo-50";
        theme.navbarBorder = "border-purple-100";
        theme.highlightText = "from-purple-600 to-indigo-600";
        theme.roleText = "text-purple-700";
        theme.loaderBorder = "border-purple-200";
        theme.loaderTop = "border-t-purple-600";
    }

    if (loading) {
        return (
            <div className={`flex h-screen items-center justify-center bg-gradient-to-br ${theme.background}`}>
                <div className="text-center">
                    <div
                        className={`w-12 h-12 rounded-full border-4 ${theme.loaderBorder} ${theme.loaderTop} animate-spin mx-auto mb-4`}
                    ></div>
                    <p className="text-slate-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br ${theme.background}`}>
            {/* Top Navigation Bar */}
            <nav className={`bg-white border-b ${theme.navbarBorder} shadow-sm sticky top-0 z-40`}>
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Welcome,{" "}
                            <span
                                className={`bg-gradient-to-r ${theme.highlightText} bg-clip-text text-transparent`}
                            >
                                {name}
                            </span>
                        </h1>
                        <span className="text-sm text-slate-600">
                            System:{" "}
                            <span className={`font-semibold ${theme.roleText}`}>
                                {role?.replace("_", " ").toUpperCase()}
                            </span>
                        </span>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                {role === "admin" && <AdminView />}
                {role === "hospital" && <HospitalView />}
                {role === "insurance_company" && <InsuranceView />}
                {!["admin", "hospital", "insurance_company"].includes(role!) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-700 font-semibold">Unknown Role: {role}</p>
                        <p className="text-red-600 text-sm mt-2">
                            Please contact administrator for assistance.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
