"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle, XCircle, AlertCircle, PlusCircle } from "lucide-react";
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

    if (loading) return <div className="p-6">Loading dashboard data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Insurance Dashboard</h1>
                <Button onClick={() => router.push("/insurance/policies?action=add")} className="gap-2 bg-purple-600 hover:bg-blue-700 rounded text-white">
                    <PlusCircle className="h-4 w-4" />
                    Add Policy
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Claims to Review</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.toReview}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.approved}</div>
                        <p className="text-xs text-muted-foreground">Total approved claims</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rejected}</div>
                        <p className="text-xs text-muted-foreground">Total rejected claims</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.policiesCount}</div>
                        <p className="text-xs text-muted-foreground">Policies managed</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Claims</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-500">
                        {stats.toReview > 0 ? "You have pending claims to review." : "No pending claims."}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
