"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    const [diagnosis, setDiagnosis] = useState("");
    const [treatment, setTreatment] = useState("");
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

    // Load claim if editing
    // Load claim if editing
    const searchParams = useSearchParams();
    const editClaimId = searchParams.get('claimId');

    useEffect(() => {
        if (!editClaimId) return;

        const loadClaim = async () => {
            setLoading(true);
            const token = localStorage.getItem("token");
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${editClaimId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const claim = data.claim;
                    setClaimId(claim.id || claim._id);
                    setCurrentClaim(claim);
                    setPolicyDetails(data.policy);

                    // Populate form
                    setPatientName(claim.patient_name);
                    setAge(claim.age.toString());
                    setDiagnosis(claim.diagnosis);
                    setTreatment(claim.treatment_plan);
                    setClaimType(claim.policy_type);
                    setSelectedPolicyId(claim.policy_id || "");

                    // Determine step
                    if (claim.status === "DRAFT") {
                        // Always start at step 1 for drafts to allow reviewing/editing details
                        setStep(1);
                    } else {
                        setStep(3); // View analysis/status
                    }
                }
            } catch (err) {
                console.error("Failed to load claim", err);
            } finally {
                setLoading(false);
            }
        };
        loadClaim();
    }, [editClaimId]);

    // Step 1: Create or Update Draft Claim
    const handleCreateDraft = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const body = JSON.stringify({
                patient_name: patientName,
                age: parseInt(age) || 0,
                diagnosis: diagnosis,
                treatment_plan: treatment,
                policy_type: claimType,
                policy_id: claimType === "CASHLESS" ? selectedPolicyId : undefined
            });

            let res;
            if (claimId) {
                // Update existing claim
                res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${claimId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: body
                });
            } else {
                // Create new claim
                res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: body
                });
            }

            if (!res.ok) throw new Error("Failed to save claim");

            const data = await res.json();
            setClaimId(data.id || data._id);
            setCurrentClaim(data);

            // Fetch policy details if selected
            if (claimType === "CASHLESS" && selectedPolicyId) {
                // Fetch updated policy details if needed
                const detailRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${data.id || data._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const detailData = await detailRes.json();
                setPolicyDetails(detailData.policy);
                setCurrentClaim(detailData.claim);
            }

            setStep(2); // Move to Upload
        } catch (err) {
            console.error(err);
            alert("Error saving claim");
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${claimId}/upload?document_name=${encodeURIComponent(docType)}`, {
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

    // Step 3: AI Analysis & Submit
    const handleAnalyze = async () => {
        if (!claimId) return;
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${claimId}/verify`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const updatedClaim = await res.json();
                setCurrentClaim(updatedClaim);
            } else {
                alert("Analysis failed");
            }
        } catch (err) {
            alert("Analysis failed");
        } finally {
            setLoading(false);
        }
    };

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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Diagnosis</Label>
                                <Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Viral Fever" />
                            </div>
                            <div className="space-y-2">
                                <Label>Treatment Plan</Label>
                                <Input value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="e.g. Medication and rest" />
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
                            disabled={!patientName || !age || !diagnosis || (claimType === "CASHLESS" && !selectedPolicyId) || loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Next: Upload Documents
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 2: Upload Documents */}
            {step === 2 && currentClaim && (
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
                    <CardFooter>
                        <Button onClick={() => setStep(3)}>
                            Next: AI Verification
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 3: AI Analysis & Submit */}
            {step === 3 && currentClaim && (
                <div className="space-y-6">
                    {/* Documents Summary & OCR Text */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents Uploaded</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {currentClaim.uploaded_documents?.map((doc: any, idx: number) => (
                                    <div key={idx} className="border rounded-md p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 font-medium">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span>{doc.document_name}</span>
                                                <span className="text-xs text-gray-400 font-normal">({new Date(doc.uploaded_at).toLocaleString()})</span>
                                            </div>
                                            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${doc.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                View File
                                            </a>
                                        </div>


                                    </div>
                                ))}
                                {!currentClaim.uploaded_documents?.length && <div className="text-gray-500 italic">No documents uploaded.</div>}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" onClick={() => setStep(2)}>Back to Uploads</Button>
                        </CardFooter>
                    </Card>

                    {/* AI Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                🤖 AI Analysis
                                {currentClaim.ai_ready_for_review && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready for Review</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {currentClaim.ai_score === undefined || currentClaim.ai_score === null ? (
                                <div className="text-center py-6">
                                    <p className="text-gray-500 mb-4">Click below to analyze the claim and documents.</p>
                                    <Button onClick={handleAnalyze} disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Verify Claim with AI
                                    </Button>
                                </div>
                            ) : (
                                <>
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
                                        <div className="border rounded-md overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-100 text-gray-600 font-medium border-b">
                                                    <tr>
                                                        <th className="px-3 py-2">Document</th>
                                                        <th className="px-3 py-2">Feedback</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {currentClaim.ai_document_feedback?.map((fb: any, i: number) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            <td className="px-3 py-2 font-medium flex items-center gap-2">
                                                                <FileText className="h-3 w-3 text-gray-500" />
                                                                {fb.document_name}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-600">{fb.feedback_note}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="flex justify-center mt-4">
                                        <Button variant="outline" onClick={handleAnalyze} disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Re-verify Claim with AI
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter>
                            {/* Only show submit if AI has run (or based on some logic) */}
                            {currentClaim.ai_ready_for_review && (
                                claimType === "CASHLESS" ? (
                                    <Button
                                        className="w-full"
                                        onClick={handleSubmitReview}
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send to Insurance Company
                                    </Button>
                                ) : (
                                    <Button className="w-full" onClick={() => router.push("/dashboard")}>
                                        Finish (Reimbursement Analysis Only)
                                    </Button>
                                )
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
