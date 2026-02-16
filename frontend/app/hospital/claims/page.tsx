"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Activity, Trash2, ArrowRight } from "lucide-react";

export default function HospitalClaimsPage() {
    const [claims, setClaims] = useState<any[]>([]);

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
            }
        };
        fetchClaims();
    }, []);

    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this claim?")) return;

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
        }
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">My Claims</h1>
            <div className="grid gap-4">
                {claims.map((claim: any) => (
                    <Card key={claim.id || claim._id}>
                        <CardContent className="p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-2 rounded-full"><FileText className="text-blue-600 h-5 w-5" /></div>
                                <div>
                                    <h3 className="font-bold">{claim.patient_name}</h3>
                                    <p className="text-sm text-gray-500">{claim.policy_type} - Age: {claim.age}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right mr-4">
                                    <div className="text-sm text-gray-400">Status</div>
                                    <Badge variant={claim.status === "APPROVED" ? "default" : "secondary"}>{claim.status}</Badge>
                                </div>
                                {claim.ai_score && (
                                    <div className="text-right mr-4">
                                        <div className="text-sm text-gray-400">Score</div>
                                        <div className="font-bold">{claim.ai_score}</div>
                                    </div>
                                )}

                                {claim.status === "DRAFT" && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2"
                                            onClick={() => router.push(`/hospital/claims/new?claimId=${claim.id || claim._id}`)}
                                        >
                                            Continue <ArrowRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(claim.id || claim._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {claims.length === 0 && <div className="text-gray-500">No claims found.</div>}
            </div>
        </div>
    );
}
