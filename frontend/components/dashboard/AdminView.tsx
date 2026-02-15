"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, ShieldCheck } from "lucide-react";

export function AdminView() {
    const [stats, setStats] = useState({
        hospitals: 0,
        insuranceCompanies: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const hospitalsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/hospitals`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const insuranceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/insurance-companies`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const hospitals = hospitalsRes.ok ? await hospitalsRes.json() : [];
                const insurance = insuranceRes.ok ? await insuranceRes.json() : [];

                setStats({
                    hospitals: hospitals.length,
                    insuranceCompanies: insurance.length
                });

            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-6">Loading dashboard data...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.hospitals}</div>
                        <p className="text-xs text-muted-foreground">Registered on platform</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Insurance Companies</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.insuranceCompanies}</div>
                        <p className="text-xs text-muted-foreground">Active partners</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Active</div>
                        <p className="text-xs text-muted-foreground">System operational</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-blue-800 text-sm">
                System is running normally. No active alerts.
            </div>
        </div>
    );
}
