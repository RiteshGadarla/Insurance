"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, FileText, DollarSign, Clock, AlertCircle, PlusCircle } from "lucide-react";

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

    if (loading) return <div className="p-6">Loading dashboard data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Hospital Dashboard</h1>
                <Button onClick={handleCreatePolicy} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    Create Internal Policy
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Claims</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeClaims}</div>
                        <p className="text-xs text-muted-foreground">Total claims filed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingReview}</div>
                        <p className="text-xs text-muted-foreground">Waiting for insurance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Est. Verified Amount</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.verifiedAmount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">AI Estimated Total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Policies</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.policiesCount}</div>
                        <p className="text-xs text-muted-foreground">Active insurance protocols</p>
                    </CardContent>
                </Card>
            </div>

            {stats.activeClaims === 0 && (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-blue-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <div>No claims yet. Start by creating a new claim from the sidebar.</div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-gray-500">Use the sidebar to manage claims and policies, or create a new internal policy above.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
