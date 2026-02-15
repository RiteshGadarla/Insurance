"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, FileText, AlertTriangle } from "lucide-react";

export default function ClaimReviewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setData(await res.json());
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [id]);

    const handleDecision = async (decision: "APPROVED" | "REJECTED") => {
        if (decision === "REJECTED" && !rejectionReason) {
            alert("Please provide a rejection reason.");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${id}/decide`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    decision: decision,
                    reason: decision === "REJECTED" ? rejectionReason : undefined
                })
            });

            if (res.ok) {
                alert(`Claim ${decision}`);
                router.push("/insurance/claims");
            } else {
                const err = await res.json();
                alert(err.detail);
            }
        } catch (err) {
            alert("Action failed");
        } finally {
            setLoading(false);
        }
    };

    if (!data) return <div className="p-10">Loading...</div>;

    const { claim, policy } = data;

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{claim.patient_name}</h1>
                    <p className="text-gray-500">Claim ID: {claim.id || claim._id}</p>
                </div>
                <Badge className="text-lg px-4 py-1">{claim.status}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Claim Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Claim Details</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div><span className="font-semibold">Age:</span> {claim.age}</div>
                                <div><span className="font-semibold">Policy:</span> {policy?.name || "N/A"}</div>
                                <div><span className="font-semibold">Type:</span> {claim.policy_type}</div>
                                <div><span className="font-semibold">Hospital ID:</span> {claim.hospital_id}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>AI Analysis Report</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <div className="bg-blue-50 p-4 rounded text-center min-w-[100px]">
                                    <div className="text-sm text-gray-500">Score</div>
                                    <div className="text-3xl font-bold text-blue-700">{claim.ai_score}</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded text-center min-w-[150px]">
                                    <div className="text-sm text-gray-500">Rec. Amount</div>
                                    <div className="text-3xl font-bold text-green-700">${claim.ai_estimated_amount}</div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-500 italic">
                                "{claim.ai_notes}"
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Evidence Documents</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-2">
                                {claim.uploaded_documents?.map((doc: any, idx: number) => (
                                    <div key={idx} className="flex justify-between p-3 border rounded bg-white items-center">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <div className="font-medium">{doc.document_name}</div>
                                                <div className="text-xs text-blue-500 underline cursor-pointer">View File</div>
                                            </div>
                                        </div>
                                        {/* Mock check if AI approved this specific doc */}
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader><CardTitle>Review Action</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {claim.status === "REVIEW_READY" ? (
                                <>
                                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleDecision("APPROVED")} disabled={loading}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approve Claim
                                    </Button>

                                    <div className="pt-4 border-t">
                                        <label className="text-sm font-medium mb-2 block">Rejection Reason</label>
                                        <Textarea
                                            placeholder="Required for rejection..."
                                            value={rejectionReason}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                                        />
                                        <Button
                                            className="w-full mt-2"
                                            variant="destructive"
                                            onClick={() => handleDecision("REJECTED")}
                                            disabled={loading}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" /> Reject Claim
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    This claim has been <strong>{claim.status}</strong>.
                                    {claim.rejection_reason && <div className="text-red-500 mt-2 text-sm">{claim.rejection_reason}</div>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
