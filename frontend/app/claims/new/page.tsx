"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPolicies, createClaim } from "@/lib/api";

export default function NewClaimPage() {
    const router = useRouter();
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [patientName, setPatientName] = useState("");
    const [insurerName, setInsurerName] = useState("");
    const [selectedPolicyId, setSelectedPolicyId] = useState("");
    const [claimType, setClaimType] = useState("Cashless");

    useEffect(() => {
        fetchPolicies()
            .then(setPolicies)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPolicyId) {
            alert("Please select a policy");
            return;
        }

        try {
            const result = await createClaim({
                patient_name: patientName,
                insurer_name: insurerName, // Ideally this comes from policy, but keeping flexible
                policy_id: selectedPolicyId,
                claim_type: claimType
            });
            router.push(`/claims/${result._id}`);
        } catch (error) {
            console.error("Failed to create claim", error);
            alert("Failed to create claim");
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Claim</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Patient Name</label>
                            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Policy</label>
                            <select
                                className="flex h-10 w-full rounded-none border border-black bg-background px-3 py-2 text-sm ring-offset-background"
                                value={selectedPolicyId}
                                onChange={(e) => setSelectedPolicyId(e.target.value)}
                                required
                            >
                                <option value="">-- Select a Policy --</option>
                                {policies.map((p) => (
                                    <option key={p._id} value={p._id}>{p.name} - {p.insurer}</option>
                                ))}
                            </select>
                            <div className="pt-2">
                                <Link href="/policies/new" className="text-sm underline">
                                    + Create New Custom Policy
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Insurer Name (Confirm)</label>
                            <Input value={insurerName} onChange={(e) => setInsurerName(e.target.value)} required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Claim Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center space-x-2">
                                    <input type="radio" name="claimType" value="Cashless" checked={claimType === "Cashless"} onChange={() => setClaimType("Cashless")} className="h-4 w-4" />
                                    <span>Cashless</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input type="radio" name="claimType" value="Reimbursement" checked={claimType === "Reimbursement"} onChange={() => setClaimType("Reimbursement")} className="h-4 w-4" />
                                    <span>Reimbursement</span>
                                </label>
                            </div>
                        </div>

                        <Button type="submit" className="w-full">Next</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
