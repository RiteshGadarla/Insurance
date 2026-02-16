"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle, XCircle, AlertCircle, PlusCircle, TrendingUp, BarChart3 } from "lucide-react";
import { createInsurancePolicy } from "@/lib/api";

interface RequiredDoc {
    document_name: string;
    description: string;
    notes: string;
    mandatory: boolean;
}

export function InsuranceView() {
    const router = useRouter();
    const [stats, setStats] = useState({
        toReview: 0,
        approved: 0,
        rejected: 0,
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

                const policiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/insurance/policies`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const policies = policiesRes.ok ? await policiesRes.json() : [];

                const toReview = claims.filter((c: any) => c.status === "REVIEW_READY").length;
                const approved = claims.filter((c: any) => c.status === "APPROVED").length;
                const rejected = claims.filter((c: any) => c.status === "REJECTED").length;

                setStats({
                    toReview,
                    approved,
                    rejected,
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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto mb-4"></div>
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
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Insurance Dashboard</h1>
                    <p className="text-slate-600">Monitor and manage insurance claims and policies</p>
                </div>
                <Button 
                    onClick={() => router.push("/insurance/policies?action=add")} 
                    className="gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                    <PlusCircle className="h-5 w-5" />
                    Add Policy
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Claims to Review Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">Claims to Review</CardTitle>
                        <div className="p-3 bg-purple-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{stats.toReview}</div>
                        <p className="text-xs text-slate-600 mt-2">Requires attention</p>
                    </CardContent>
                </Card>

                {/* Approved Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">Approved</CardTitle>
                        <div className="p-3 bg-green-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                        <p className="text-xs text-slate-600 mt-2">Total approved claims</p>
                    </CardContent>
                </Card>

                {/* Rejected Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">Rejected</CardTitle>
                        <div className="p-3 bg-red-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <XCircle className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                        <p className="text-xs text-slate-600 mt-2">Total rejected claims</p>
                    </CardContent>
                </Card>

                {/* Active Policies Card */}
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-sm font-semibold text-slate-700">Active Policies</CardTitle>
                        <div className="p-3 bg-purple-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{stats.policiesCount}</div>
                        <p className="text-xs text-slate-600 mt-2">Policies managed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Claims Overview Card */}
                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                            Claims Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-700 font-medium">Total Claims</span>
                                <span className="text-sm font-bold text-slate-900">{stats.toReview + stats.approved + stats.rejected}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all" 
                                    style={{width: stats.approved + stats.rejected + stats.toReview > 0 ? '100%' : '0%'}}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-200">
                            <div className="text-center">
                                <p className="text-xs text-slate-600">Review</p>
                                <p className="text-lg font-bold text-purple-600">{stats.toReview}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-600">Approved</p>
                                <p className="text-lg font-bold text-green-600">{stats.approved}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-600">Rejected</p>
                                <p className="text-lg font-bold text-red-600">{stats.rejected}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Card */}
                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-100 to-purple-50">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                            Activity Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats.toReview > 0 ? (
                            <div className="p-4 bg-purple-50 border-l-4 border-purple-600 rounded">
                                <p className="text-sm font-semibold text-purple-900">⚠️ Pending Review</p>
                                <p className="text-sm text-purple-700 mt-1">You have {stats.toReview} claim{stats.toReview !== 1 ? 's' : ''} awaiting your review.</p>
                            </div>
                        ) : (
                            <div className="p-4 bg-purple-100 border-l-4 border-purple-600 rounded">
                                <p className="text-sm font-semibold text-purple-900">✓ All Caught Up</p>
                                <p className="text-sm text-purple-700 mt-1">No pending claims. All claims are processed.</p>
                            </div>
                        )}

                        <div className="pt-2 border-t border-purple-200">
                            <p className="text-xs text-slate-600 font-semibold mb-2">Quick Stats</p>
                            <div className="space-y-1 text-sm">
                                <p className="text-slate-700">Approval Rate: <span className="font-bold text-green-600">{stats.approved + stats.rejected > 0 ? Math.round((stats.approved / (stats.approved + stats.rejected)) * 100) : 0}%</span></p>
                                <p className="text-slate-700">Active Policies: <span className="font-bold text-purple-600">{stats.policiesCount}</span></p>
                            </div>
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