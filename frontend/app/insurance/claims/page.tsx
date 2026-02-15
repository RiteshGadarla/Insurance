"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function InsuranceClaimsPage() {
    const [claims, setClaims] = useState<any[]>([]);
    const router = useRouter();

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

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Claims for Review</h1>
            <div className="grid gap-4">
                {claims.map((claim) => (
                    <Card key={claim.id || claim._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/insurance/claims/${claim.id || claim._id}`)}>
                        <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{claim.patient_name}</h3>
                                <p className="text-sm text-gray-500">Age: {claim.age} | Policy ID: {claim.policy_id}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant={claim.status === "APPROVED" ? "default" : (claim.status === "REJECTED" ? "destructive" : "secondary")}>
                                    {claim.status}
                                </Badge>
                                <span className="text-xs text-gray-400">Score: {claim.ai_score}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {claims.length === 0 && <div className="text-gray-500 italic">No claims pending review.</div>}
            </div>
        </div>
    );
}
