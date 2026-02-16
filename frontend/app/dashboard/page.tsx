"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminView } from "@/components/dashboard/AdminView";
import { HospitalView } from "@/components/dashboard/HospitalView";
import { InsuranceView } from "@/components/dashboard/InsuranceView";
import { Loader2 } from "lucide-react";

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

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-emerald-100 shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Welcome, <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{name}</span>
                        </h1>
                        <span className="text-sm text-slate-600">
                            System: <span className="font-semibold text-emerald-700">{role?.replace("_", " ").toUpperCase()}</span>
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
                        <p className="text-red-600 text-sm mt-2">Please contact administrator for assistance.</p>
                    </div>
                )}
            </main>
        </div>
    );
}