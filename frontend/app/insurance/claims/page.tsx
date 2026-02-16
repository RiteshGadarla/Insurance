"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InsuranceClaimsPage() {
    const [claims, setClaims] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchClaims = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                if (res.ok) setClaims(await res.json());
            } catch (err) {
                console.error(err);
            }
        };
        fetchClaims();
    }, []);

    return (
        <div className="container mx-auto py-10 px-6">
            <h1 className="text-3xl font-bold mb-8 text-purple-700">
                Claims for Review
            </h1>

            <div className="grid gap-5">
                {claims.map((claim) => {
                    const id = claim.id || claim._id;

                    return (
                        <Card
                            key={id}
                            className="transition-all duration-200 cursor-pointer border-purple-100 hover:border-purple-300 hover:bg-purple-50/40 hover:shadow-md"
                            onClick={() => router.push(`/insurance/claims/${id}`)}
                        >
                            <CardContent className="p-6 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg text-purple-800">
                                        {claim.patient_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Age: {claim.age} | Policy ID: {claim.policy_id}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <Badge
                                        className={
                                            claim.status === "APPROVED"
                                                ? "bg-green-600"
                                                : claim.status === "REJECTED"
                                                ? "bg-red-600"
                                                : "bg-purple-600"
                                        }
                                    >
                                        {claim.status}
                                    </Badge>

                                    <span className="text-xs text-purple-500 font-medium">
                                        AI Score: {claim.ai_score}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {claims.length === 0 && (
                    <div className="text-center py-16 bg-purple-50 rounded-xl border-2 border-dashed border-purple-200">
                        <h3 className="text-lg font-medium text-purple-800">
                            No claims pending review
                        </h3>
                        <p className="text-purple-500 mt-2">
                            All claims have been processed.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
