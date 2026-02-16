"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCircle,
    XCircle,
    FileText
} from "lucide-react";

export default function ClaimReviewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");

            try {
                const res = await fetch(`${API_BASE}/claims/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    setData(await res.json());
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, [id]);

    const handleDecision = async (
        decision: "APPROVED" | "REJECTED"
    ) => {
        if (decision === "REJECTED" && !rejectionReason) {
            alert("Please provide a rejection reason.");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(
                `${API_BASE}/claims/${id}/decide`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        decision,
                        reason:
                            decision === "REJECTED"
                                ? rejectionReason
                                : undefined
                    })
                }
            );

            if (res.ok) {
                alert(`Claim ${decision}`);
                router.push("/insurance/claims");
            } else {
                const err = await res.json();
                alert(err.detail);
            }
        } catch {
            alert("Action failed");
        } finally {
            setLoading(false);
        }
    };

    if (!data)
        return (
            <div className="p-10 text-center text-purple-600">
                Loading claim details...
            </div>
        );

    const { claim, policy } = data;

    const statusColor =
        claim.status === "APPROVED"
            ? "bg-green-600"
            : claim.status === "REJECTED"
            ? "bg-red-600"
            : "bg-purple-600";

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-10">
            <div className="container mx-auto max-w-6xl px-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
                            {claim.patient_name}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Claim ID: {claim.id || claim._id}
                        </p>
                    </div>

                    <Badge className={`text-lg px-5 py-2 text-white ${statusColor}`}>
                        {claim.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* LEFT SIDE */}
                    <div className="md:col-span-2 space-y-8">

                        {/* Claim Details */}
                        <Card className="shadow-md border-purple-100">
                            <CardHeader>
                                <CardTitle className="text-purple-700">
                                    Claim Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6 text-sm">
                                    <div><span className="font-semibold">Age:</span> {claim.age}</div>
                                    <div><span className="font-semibold">Policy:</span> {policy?.name || "N/A"}</div>
                                    <div><span className="font-semibold">Type:</span> {claim.policy_type}</div>
                                    <div><span className="font-semibold">Hospital ID:</span> {claim.hospital_id}</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Report */}
                        <Card className="shadow-md border-purple-100">
                            <CardHeader>
                                <CardTitle className="text-purple-700">
                                    AI Analysis Report
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="flex gap-6 flex-wrap">

                                    <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl text-center min-w-[140px]">
                                        <div className="text-xs text-gray-500">
                                            AI Risk Score
                                        </div>
                                        <div className="text-4xl font-bold text-purple-700">
                                            {claim.ai_score}
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl text-center min-w-[180px]">
                                        <div className="text-xs text-gray-500">
                                            Recommended Amount
                                        </div>
                                        <div className="text-3xl font-bold text-indigo-700">
                                            ₹{claim.ai_estimated_amount}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded italic text-purple-800">
                                    "{claim.ai_notes}"
                                </div>
                            </CardContent>
                        </Card>

                        {/* Documents */}
                        <Card className="shadow-md border-purple-100">
                            <CardHeader>
                                <CardTitle className="text-purple-700">
                                    Evidence Documents
                                </CardTitle>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-3">
                                    {claim.uploaded_documents?.map((doc: any, idx: number) => {

                                        const fileUrl =
                                            doc.file_url ||
                                            `${API_BASE}/media/${doc.file_path}`;

                                        return (
                                            <div
                                                key={idx}
                                                className="flex justify-between items-center p-4 rounded-lg border hover:shadow-sm hover:bg-purple-50 transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-purple-500" />
                                                    <div>
                                                        <div className="font-medium">
                                                            {doc.document_name}
                                                        </div>

                                                        <a
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-purple-600 underline hover:text-purple-800"
                                                        >
                                                            View File
                                                        </a>
                                                    </div>
                                                </div>

                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT ACTION PANEL */}
                    <div>
                        <Card className="sticky top-6 shadow-lg border-purple-200">
                            <CardHeader>
                                <CardTitle className="text-purple-700">
                                    Review Action
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-5">

                                {claim.status === "REVIEW_READY" ? (
                                    <>
                                        <Button
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                            onClick={() => handleDecision("APPROVED")}
                                            disabled={loading}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve Claim
                                        </Button>

                                        <div className="border-t pt-4">
                                            <label className="text-sm font-medium text-purple-700 block mb-2">
                                                Rejection Reason
                                            </label>

                                            <Textarea
                                                placeholder="Required for rejection..."
                                                value={rejectionReason}
                                                onChange={(e) =>
                                                    setRejectionReason(e.target.value)
                                                }
                                                className="focus-visible:ring-purple-500"
                                            />

                                            <Button
                                                className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
                                                onClick={() =>
                                                    handleDecision("REJECTED")
                                                }
                                                disabled={loading}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject Claim
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-gray-600 py-4">
                                        This claim has been{" "}
                                        <strong>{claim.status}</strong>.
                                        {claim.rejection_reason && (
                                            <div className="text-red-500 mt-2 text-sm">
                                                {claim.rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}
