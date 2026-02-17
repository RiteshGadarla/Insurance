"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

function NewClaimContent() {
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
                        setStep(1);
                    } else {
                        setStep(3);
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
                res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${claimId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: body
                });
            } else {
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

            if (claimType === "CASHLESS" && selectedPolicyId) {
                const detailRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/${data.id || data._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const detailData = await detailRes.json();
                setPolicyDetails(detailData.policy);
                setCurrentClaim(detailData.claim);
            }

            setStep(2);
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
        <div className="max-w-5xl mx-auto space-y-8 mt-10">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">New Claim Submission</h1>
                <p className="text-slate-600">Submit a new insurance claim with AI-powered verification</p>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-between gap-4 relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 -z-10">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    ></div>
                </div>

                <div className={`flex flex-col items-center gap-2 flex-1 ${step >= 1 ? "" : "opacity-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${step >= 1 ? "bg-gradient-to-r from-blue-600 to-cyan-600" : "bg-slate-300"}`}>
                        1
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Patient Details</span>
                </div>

                <div className={`flex flex-col items-center gap-2 flex-1 ${step >= 2 ? "" : "opacity-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${step >= 2 ? "bg-gradient-to-r from-blue-600 to-cyan-600" : "bg-slate-300"}`}>
                        2
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Documents</span>
                </div>

                <div className={`flex flex-col items-center gap-2 flex-1 ${step >= 3 ? "" : "opacity-50"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${step >= 3 ? "bg-gradient-to-r from-blue-600 to-cyan-600" : "bg-slate-300"}`}>
                        3
                    </div>
                    <span className="text-sm font-semibold text-slate-700">AI Analysis</span>
                </div>
            </div>

            {/* Step 1: Patient Info */}
            {step === 1 && (
                <Card className="border-0 shadow-lg bg-white">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                        <CardTitle className="text-2xl text-slate-900">Patient Information</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">Enter patient details and claim type</p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-900">Patient Name</Label>
                                <Input
                                    value={patientName}
                                    onChange={e => setPatientName(e.target.value)}
                                    placeholder="Full Name"
                                    className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-900">Age</Label>
                                <Input
                                    type="number"
                                    value={age}
                                    onChange={e => setAge(e.target.value)}
                                    placeholder="Age"
                                    className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-900">Diagnosis</Label>
                                <Input
                                    value={diagnosis}
                                    onChange={e => setDiagnosis(e.target.value)}
                                    placeholder="e.g. Viral Fever"
                                    className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-900">Treatment Plan</Label>
                                <Input
                                    value={treatment}
                                    onChange={e => setTreatment(e.target.value)}
                                    placeholder="e.g. Medication and rest"
                                    className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-900">Claim Type</Label>
                            <div className="flex gap-4">
                                <Button
                                    variant={claimType === "CASHLESS" ? "default" : "outline"}
                                    onClick={() => setClaimType("CASHLESS")}
                                    type="button"
                                    className={claimType === "CASHLESS" ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white" : ""}
                                >
                                    Cashless
                                </Button>
                                <Button
                                    variant={claimType === "REIMBURSEMENT" ? "default" : "outline"}
                                    onClick={() => setClaimType("REIMBURSEMENT")}
                                    type="button"
                                    className={claimType === "REIMBURSEMENT" ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white" : ""}
                                >
                                    Reimbursement
                                </Button>
                            </div>
                        </div>

                        {claimType === "CASHLESS" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-900">Select Insurance Policy</Label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={selectedPolicyId}
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
                        )}
                    </CardContent>
                    <CardFooter className="border-t border-slate-200 pb-10">
                        <Button
                            onClick={handleCreateDraft}
                            disabled={!patientName || !age || !diagnosis || (claimType === "CASHLESS" && !selectedPolicyId) || loading}
                            className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Next: Upload Documents
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 2: Upload Documents */}
            {step === 2 && currentClaim && (
                <Card className="border-0 shadow-lg bg-white">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                        <CardTitle className="text-2xl text-slate-900">Required Documents</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">Upload necessary documents for verification</p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {policyDetails?.required_documents?.map((doc: any, idx: number) => {
                            const isUploaded = currentClaim.uploaded_documents?.some((u: any) => u.document_name === doc.document_name);
                            return (
                                <div key={idx} className="border-2 border-slate-200 hover:border-blue-300 p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                {doc.document_name}
                                            </div>
                                            <div className="text-xs text-slate-600 mt-1">{doc.description}</div>
                                        </div>
                                        {isUploaded && <CheckCircle className="text-green-600 h-5 w-5 flex-shrink-0" />}
                                    </div>
                                    {!isUploaded && (
                                        <div className="relative">
                                            <Input
                                                type="file"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleUpload(doc.document_name, e.target.files[0]);
                                                }}
                                                className="border border-dashed border-blue-300 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-blue-50"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {(!policyDetails || !policyDetails.required_documents?.length) && (
                            <div className="border-2 border-dashed border-blue-300 p-6 rounded-lg bg-blue-50">
                                <Label className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                                    <Upload className="h-4 w-4 text-blue-600" />
                                    Upload Documents
                                </Label>
                                <Input
                                    type="file"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleUpload("Generic Document", e.target.files[0]);
                                    }}
                                    className="border border-blue-300 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-white"
                                />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t border-slate-200 flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setStep(1)}
                            className="border-slate-300"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={() => setStep(3)}
                            className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg"
                        >
                            Next: AI Analysis
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 3: AI Analysis & Submit */}
            {step === 3 && currentClaim && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Documents Summary */}
                    <Card className="lg:col-span-1 border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                            <CardTitle className="text-lg text-slate-900">Documents Uploaded</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            {currentClaim.uploaded_documents?.map((doc: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    <span className="text-slate-700">{doc.document_name}</span>
                                </div>
                            ))}
                            {!currentClaim.uploaded_documents?.length && (
                                <div className="text-sm text-slate-600 italic text-center py-4">No documents uploaded.</div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-slate-200">
                            <Button
                                variant="outline"
                                onClick={() => setStep(2)}
                                className="w-full border-slate-300"
                            >
                                Back to Uploads
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Right: AI Analysis */}
                    <Card className="lg:col-span-2 border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                                🤖 AI Verification
                                {currentClaim.ai_ready_for_review && (
                                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">Ready for Review</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {currentClaim.ai_score === undefined || currentClaim.ai_score === null ? (
                                <div className="text-center py-8">
                                    <div className="text-5xl mb-4">🔍</div>
                                    <p className="text-slate-600 mb-6 font-medium">Click below to analyze the claim and documents using AI.</p>
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={loading}
                                        className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg"
                                    >
                                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Run AI Verification
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                            <div className="text-xs font-semibold text-slate-600 mb-1">AI Score</div>
                                            <div className="text-3xl font-bold text-blue-700">{currentClaim.ai_score || "-"}</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                            <div className="text-xs font-semibold text-slate-600 mb-1">Est. Amount</div>
                                            <div className="text-3xl font-bold text-green-700">${(currentClaim.ai_estimated_amount || 0).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {currentClaim.ai_notes && (
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                            <p className="text-sm font-semibold text-amber-900 mb-2">AI Notes</p>
                                            <p className="text-sm text-amber-800">{currentClaim.ai_notes}</p>
                                        </div>
                                    )}

                                    {currentClaim.ai_document_feedback?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Document Feedback</h4>
                                            <div className="space-y-2">
                                                {currentClaim.ai_document_feedback?.map((fb: any, i: number) => (
                                                    <div key={i} className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-slate-900">{fb.document_name}</p>
                                                            <p className="text-xs text-slate-600 mt-1">{fb.feedback_note}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        onClick={handleAnalyze}
                                        disabled={loading}
                                        className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Re-run AI Verification
                                    </Button>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="border-t border-slate-200">
                            {currentClaim.ai_ready_for_review && (
                                claimType === "CASHLESS" ? (
                                    <Button
                                        className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg"
                                        onClick={handleSubmitReview}
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Send to Insurance Company
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg"
                                        onClick={() => router.push("/dashboard")}
                                    >
                                        Complete Submission
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                )
                            )}
                        </CardFooter>
                    </Card>
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

export default function NewClaimPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
            <NewClaimContent />
        </Suspense>
    );
}