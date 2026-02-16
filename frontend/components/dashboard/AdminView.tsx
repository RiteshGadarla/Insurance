"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, ShieldCheck, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

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

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-600 font-medium">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
                    <p className="text-slate-600">Welcome back! Here's your system overview.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-600">Last updated</p>
                    <p className="text-emerald-600 font-semibold">{new Date().toLocaleTimeString()}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Hospitals Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-emerald-50 group cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Total Hospitals</CardTitle>
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl font-bold text-emerald-600">{stats.hospitals}</div>
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Active
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">Registered on platform</p>
                    </CardContent>
                </Card>

                {/* Insurance Companies Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-emerald-50 group cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Insurance Companies</CardTitle>
                        <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-4xl font-bold text-teal-600">{stats.insuranceCompanies}</div>
                            <span className="text-xs font-semibold text-teal-600 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Partners
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">Active partners</p>
                    </CardContent>
                </Card>

                {/* System Health Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-green-50 group cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">System Health</CardTitle>
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold text-green-600">Optimal</div>
                            <span className="px-2 py-0.5 text-xs font-bold text-green-700 bg-green-100 rounded-full">Online</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">System operational</p>
                    </CardContent>
                </Card>
            </div>

            {/* Status Alert */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Success Alert */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 flex items-start gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 mb-1">System Running Normally</h3>
                        <p className="text-sm text-green-700">All services are operational. No active alerts or issues detected.</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-6 flex items-start gap-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-emerald-900 mb-1">Network Statistics</h3>
                        <p className="text-sm text-emerald-700">
                            <span className="font-semibold">{stats.hospitals + stats.insuranceCompanies}</span> total organizations connected. System performing at peak efficiency.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-emerald-100 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <button className="px-4 py-3 rounded-lg border-2 border-emerald-300 text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors duration-200 flex items-center justify-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Manage Hospitals
                    </button>
                    <button className="px-4 py-3 rounded-lg border-2 border-teal-300 text-teal-700 font-semibold hover:bg-teal-50 transition-colors duration-200 flex items-center justify-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Manage Insurance
                    </button>
                    <button className="px-4 py-3 rounded-lg border-2 border-green-300 text-green-700 font-semibold hover:bg-green-50 transition-colors duration-200 flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        View Analytics
                    </button>
                </div>
            </div>
        </div>
    );
}