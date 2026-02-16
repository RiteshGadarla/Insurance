"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, FileText, DollarSign, Clock, AlertCircle, PlusCircle, TrendingUp, CheckCircle2 } from "lucide-react";

export function HospitalView() {
    const router = useRouter();
    const [stats, setStats] = useState({
        activeClaims: 0,
        pendingReview: 0,
        verifiedAmount: 0,
        policiesCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const claimsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const claims = claimsRes.ok ? await claimsRes.json() : [];

                const policiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hospital/policies`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const policies = policiesRes.ok ? await policiesRes.json() : [];

                const active = claims.length;
                const pending = claims.filter((c: any) => c.status === "REVIEW_READY" || c.status === "SUBMITTED").length;
                const totalAmount = claims.reduce((sum: number, c: any) => sum + (c.ai_estimated_amount || 0), 0);

                setStats({
                    activeClaims: active,
                    pendingReview: pending,
                    verifiedAmount: totalAmount,
                    policiesCount: policies.length
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreatePolicy = () => {
        router.push("/hospital/policies?action=create");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
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
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Hospital Dashboard</h1>
                    <p className="text-slate-600">Monitor claims and manage insurance policies</p>
                </div>
                <Button 
                    onClick={handleCreatePolicy} 
                    className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                    <PlusCircle className="h-5 w-5" />
                    Create Internal Policy
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Active Claims Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">Active Claims</CardTitle>
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{stats.activeClaims}</div>
                        <p className="text-xs text-slate-600 mt-2">Total claims filed</p>
                    </CardContent>
                </Card>

                {/* Pending Review Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">Pending Review</CardTitle>
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">{stats.pendingReview}</div>
                        <p className="text-xs text-slate-600 mt-2">Waiting for insurance</p>
                    </CardContent>
                </Card>

                {/* Est. Verified Amount Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">Est. Verified Amount</CardTitle>
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <DollarSign className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">${stats.verifiedAmount.toLocaleString()}</div>
                        <p className="text-xs text-slate-600 mt-2">AI Estimated Total</p>
                    </CardContent>
                </Card>

                {/* Available Policies Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">Available Policies</CardTitle>
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{stats.policiesCount}</div>
                        <p className="text-xs text-slate-600 mt-2">Active insurance protocols</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alert or Info Section */}
            {stats.activeClaims === 0 ? (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-6 flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                        <AlertCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1">No Claims Yet</h3>
                        <p className="text-sm text-blue-700">Start by creating a new claim from the sidebar to begin submitting insurance claims.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 mb-1">System Active</h3>
                        <p className="text-sm text-green-700">Your claims are being processed. Monitor the status from the sidebar and manage your policies as needed.</p>
                    </div>
                </div>
            )}

            {/* Quick Actions Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Quick Actions Card */}
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-slate-700">Use the sidebar to submit new claims and track their status</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-slate-700">Create internal policies to manage insurance protocols</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-slate-700">Review AI-estimated amounts for each claim</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Card */}
                <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-50 to-blue-50">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-cyan-600" />
                            Claims Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1">Approval Rate</p>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all" 
                                    style={{width: `${stats.activeClaims > 0 ? Math.round((stats.activeClaims - stats.pendingReview) / stats.activeClaims * 100) : 0}%`}}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{stats.activeClaims > 0 ? Math.round((stats.activeClaims - stats.pendingReview) / stats.activeClaims * 100) : 0}% approved</p>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-600 font-semibold">Last Updated</p>
                            <p className="text-sm text-slate-800 mt-1">{new Date().toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}