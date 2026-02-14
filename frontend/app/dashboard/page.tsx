"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminView from "@/components/dashboard/AdminView";
import HospitalView from "@/components/dashboard/HospitalView";
import InsuranceView from "@/components/dashboard/InsuranceView";
import { LogOut, Loader2 } from "lucide-react";

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

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Insurance Portal</h1>
                    <span className="text-sm text-gray-500">Welcome, {name} ({role})</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center text-red-600 hover:text-red-800"
                >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </button>
            </nav>

            <main className="container mx-auto p-6">
                {role === "admin" && <AdminView />}
                {role === "hospital" && <HospitalView />}
                {role === "insurance_company" && <InsuranceView />}
                {!["admin", "hospital", "insurance_company"].includes(role!) && (
                    <div className="text-center text-red-600">Unknown Role: {role}</div>
                )}
            </main>
        </div>
    );
}
