"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Activity, Trash2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function HospitalClaimsPage() {
    const [claims, setClaims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        const fetchClaims = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setClaims(await res.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchClaims();
    }, []);

    const router = useRouter();

    const handleDelete = async (id: string, patientName: string) => {
        if (!confirm(`Are you sure you want to delete the claim for "${patientName}"? This action cannot be undone.`)) return;

        setDeleting(id);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setClaims(claims.filter((c: any) => (c.id || c._id) !== id));
            } else {
                alert("Failed to delete claim");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting claim");
        } finally {
            setDeleting(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case "APPROVED":
                return "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200";
            case "REJECTED":
                return "bg-gradient-to-r from-red-50 to-orange-50 border-red-200";
            case "PENDING":
                return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
            case "DRAFT":
                return "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200";
            case "REVIEW_READY":
                return "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200";
            default:
                return "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case "APPROVED":
                return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            case "DRAFT":
                return <AlertCircle className="h-5 w-5 text-blue-600" />;
            case "REVIEW_READY":
                return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
            default:
                return <Activity className="h-5 w-5 text-slate-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading claims...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 px-8 mt-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">My Claims</h1>
                    <p className="text-slate-600">View and manage all your submitted claims</p>
                </div>
                <Button 
                    onClick={() => router.push("/hospital/claims/new")}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                    <ArrowRight className="h-5 w-5" />
                    Submit New Claim
                </Button>
            </div>

            {/* Claims List */}
            {claims.length === 0 ? (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-12 text-center">
                    <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Claims Found</h3>
                    <p className="text-slate-600 mb-6">You haven't submitted any claims yet. Start by submitting a new claim.</p>
                    <Button 
                        onClick={() => router.push("/hospital/claims/new")}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2 rounded-lg gap-2"
                    >
                        <ArrowRight className="h-4 w-4" /> Submit Your First Claim
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {claims.map((claim: any, index: number) => (
                        <div
                            key={claim.id || claim._id}
                            style={{ animation: `slideInUp 0.6s ease-out ${index * 0.1}s both` }}
                        >
                            <Card className={`border-2 shadow-md hover:shadow-lg transition-all duration-300 ${getStatusColor(claim.status)}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between gap-6">
                                        {/* Left Section: Patient Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md flex-shrink-0">
                                                <FileText className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg text-slate-900">{claim.patient_name}</h3>
                                                <p className="text-sm text-slate-600">{claim.policy_type} • Age: {claim.age}</p>
                                                <p className="text-xs text-slate-500 mt-1">Diagnosis: {claim.diagnosis}</p>
                                            </div>
                                        </div>

                                        {/* Middle Section: Status */}
                                        <div className="flex flex-col items-center justify-center flex-shrink-0">
                                            <p className="text-xs font-semibold text-slate-600 mb-2">Status</p>
                                            <div className="flex items-center gap-2 justify-center">
                                                {getStatusIcon(claim.status)}
                                                <Badge 
                                                    className={
                                                        claim.status === "APPROVED" ? "bg-green-600 text-white" :
                                                        claim.status === "DRAFT" ? "bg-blue-600 text-white" :
                                                        claim.status === "REJECTED" ? "bg-red-600 text-white" :
                                                        claim.status === "REVIEW_READY" ? "bg-blue-600 text-white" :
                                                        "bg-amber-600 text-white"
                                                    }
                                                >
                                                    {claim.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* AI Score Section */}
                                        {(claim.ai_score !== undefined && claim.ai_score !== null && claim.ai_score !== 0) && (
                                            <div className="flex flex-col items-center justify-center flex-shrink-0">
                                                <p className="text-xs font-semibold text-slate-600 mb-2">AI Score</p>
                                                <div className="text-2xl font-bold text-blue-600">{claim.ai_score}</div>
                                            </div>
                                        )}

                                        {/* Estimated Amount Section */}
                                        {(claim.ai_estimated_amount !== undefined && claim.ai_estimated_amount !== null && claim.ai_estimated_amount > 0) && (
                                            <div className="flex flex-col items-center justify-center flex-shrink-0">
                                                <p className="text-xs font-semibold text-slate-600 mb-2">Est. Amount</p>
                                                <div className="text-2xl font-bold text-green-600">
                                                    ${typeof claim.ai_estimated_amount === 'number' ? claim.ai_estimated_amount.toLocaleString() : claim.ai_estimated_amount}
                                                </div>
                                            </div>
                                        )}

                                        {/* Right Section: Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {claim.status === "DRAFT" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-blue-600 border-blue-300 hover:bg-blue-50 font-semibold text-xs whitespace-nowrap"
                                                    onClick={() => router.push(`/hospital/claims/new?claimId=${claim.id || claim._id}`)}
                                                >
                                                    Continue
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            )}
                                            
                                            {/* Delete button for all statuses */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                                                onClick={() => handleDelete(claim.id || claim._id, claim.patient_name)}
                                                disabled={deleting === (claim.id || claim._id)}
                                                title="Delete claim"
                                            >
                                                {deleting === (claim.id || claim._id) ? (
                                                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            )}

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