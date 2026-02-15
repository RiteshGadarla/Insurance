"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, CheckCircle, AlertTriangle } from "lucide-react";

export default function NewClaimPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [claimId, setClaimId] = useState<string | null>(null);

    // Form Data
    const [patientName, setPatientName] = useState("");
    const [age, setAge] = useState("");
    const [claimType, setClaimType] = useState<"CASHLESS" | "REIMBURSEMENT">("CASHLESS");
    const [selectedPolicyId, setSelectedPolicyId] = useState("");

    // Data from API
    const [policies, setPolicies] = useState<any[]>([]);
    const [currentClaim, setCurrentClaim] = useState<any>(null);
    const [policyDetails, setPolicyDetails] = useState<any>(null);

    // Fetch Policies on Load
    useEffect(() => {
        const fetchPolicies = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/policies/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setPolicies(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch policies", err);
            }
        };
        fetchPolicies();
    }, []);

    // Step 1: Create Draft Claim
    const handleCreateDraft = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    patient_name: patientName,
                    age: parseInt(age),
                    policy_type: claimType,
                    policy_id: claimType === "CASHLESS" ? selectedPolicyId : undefined
                    // status defaults to DRAFT
                })
            });

            if (!res.ok) throw new Error("Failed to create claim");

            const data = await res.json();
            setClaimId(data.id || data._id);
            setCurrentClaim(data);

            // Fetch policy details if selected
            if (claimType === "CASHLESS" && selectedPolicyId) {
                const policyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/policies/`, { // Ideally get by ID
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Since we don't have get_policy_by_id exposed directly publically maybe, we filter from list or use the claim details
                /* Actually get_claim_details returns policy. Let's use that. */
                const detailRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${data.id || data._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const detailData = await detailRes.json();
                setPolicyDetails(detailData.policy);
                setCurrentClaim(detailData.claim);
            }

            setStep(2); // Move to Upload
        } catch (err) {
            alert("Error creating claim");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Upload Document
    const handleUpload = async (docType: string, file: File) => {
        if (!claimId) return;
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${claimId}/upload?type=${encodeURIComponent(docType)}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const updatedClaim = await res.json();
                setCurrentClaim(updatedClaim);
            } else {
                alert("Upload failed");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Step 3: Final Submit (Cashless)
    const handleSubmitReview = async () => {
        if (!claimId) return;
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${claimId}/submit-review`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                router.push("/dashboard");
            } else {
                const err = await res.json();
                alert(err.detail);
            }
        } catch (err) {
            alert("Submission failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">New Claim Submission</h1>

            {/* Progress Indicator */}
            <div className="flex justify-between mb-8 border-b pb-4">
                <div className={`font-semibold ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>1. Patient Details</div>
                <div className={`font-semibold ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>2. Documents</div>
                <div className={`font-semibold ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}>3. AI Analysis & Submit</div>
            </div>

            {/* Step 1: Patient Info */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Patient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Patient Name</Label>
                                <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Full Name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Claim Type</Label>
                            <div className="flex gap-4">
                                <Button
                                    variant={claimType === "CASHLESS" ? "default" : "outline"}
                                    onClick={() => setClaimType("CASHLESS")}
                                    type="button"
                                >
                                    Cashless
                                </Button>
                                <Button
                                    variant={claimType === "REIMBURSEMENT" ? "default" : "outline"}
                                    onClick={() => setClaimType("REIMBURSEMENT")}
                                    type="button"
                                >
                                    Reimbursement
                                </Button>
                            </div>
                        </div>

                        {claimType === "CASHLESS" && (
                            <div className="space-y-2">
                                <Label>Select Insurance Policy</Label>
                                <div className="relative">
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedPolicyId}
                                        onChange={e => setSelectedPolicyId(e.target.value)}
                                    >
                                        <option value="">Select a policy...</option>
                                        {policies.map(p => (
                                            <option key={p.id || p._id} value={p.id || p._id}>
                                                {p.name} - {p.insurer}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={handleCreateDraft}
                            disabled={!patientName || !age || (claimType === "CASHLESS" && !selectedPolicyId) || loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Next: Upload Documents
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 2: Upload & AI */}
            {step === 2 && currentClaim && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Uploads */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Required Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {policyDetails?.required_documents?.map((doc: any, idx: number) => {
                                const isUploaded = currentClaim.uploaded_documents?.some((u: any) => u.document_name === doc.document_name);
                                return (
                                    <div key={idx} className="border p-4 rounded-md bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-semibold">{doc.document_name}</div>
                                                <div className="text-xs text-gray-500">{doc.description}</div>
                                            </div>
                                            {isUploaded && <CheckCircle className="text-green-600 h-5 w-5" />}
                                        </div>
                                        {!isUploaded && (
                                            <Input
                                                type="file"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleUpload(doc.document_name, e.target.files[0]);
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Generic upload if no specific policy/Reimbursement */}
                            {(!policyDetails || !policyDetails.required_documents?.length) && (
                                <div className="border p-4 rounded-md">
                                    <Label>Upload Documents</Label>
                                    <Input
                                        type="file"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) handleUpload("Generic Document", e.target.files[0]);
                                        }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: AI Analysis */}
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                🤖 AI Analysis
                                {currentClaim.ai_ready_for_review && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready for Review</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-blue-50 p-2 rounded">
                                    <div className="text-xs text-gray-500">Score</div>
                                    <div className="text-2xl font-bold text-blue-700">{currentClaim.ai_score || "-"}</div>
                                </div>
                                <div className="bg-green-50 p-2 rounded">
                                    <div className="text-xs text-gray-500">Est. Amount</div>
                                    <div className="text-2xl font-bold text-green-700">${currentClaim.ai_estimated_amount || "-"}</div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <strong>AI Notes:</strong> {currentClaim.ai_notes || "Processing..."}
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2">Document Feedback</h4>
                                {currentClaim.ai_document_feedback?.map((fb: any, i: number) => (
                                    <div key={i} className="text-xs flex gap-2 items-center mb-1">
                                        <FileText className="h-3 w-3" />
                                        <span className="font-medium">{fb.document_name}:</span>
                                        <span>{fb.feedback_note}</span>
                                    </div>
                                ))}
                                {!currentClaim.ai_document_feedback?.length && <div className="text-xs text-gray-400">Upload documents to see feedback</div>}
                            </div>
                        </CardContent>
                        <CardFooter>
                            {claimType === "CASHLESS" ? (
                                <Button
                                    className="w-full"
                                    onClick={handleSubmitReview}
                                    disabled={!currentClaim.ai_ready_for_review || loading}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send to Insurance Company
                                </Button>
                            ) : (
                                <Button className="w-full" onClick={() => router.push("/dashboard")}>
                                    Finish (Reimbursement Analysis Only)
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
