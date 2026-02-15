"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hospital, FileText, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { fetchPolicyById, finalizeHospitalPolicy } from "@/lib/api";

export default function HospitalReviewPolicyRequirementsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: policyId } = use(params);
    const [policy, setPolicy] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [requiredDocs, setRequiredDocs] = useState<any[]>([]);

    useEffect(() => {
        const loadPolicy = async () => {
            try {
                const data = await fetchPolicyById(policyId);
                setPolicy(data);
                setRequiredDocs(data.required_documents || []);
            } catch (err: any) {
                setError(err.message || "Failed to load policy");
            } finally {
                setLoading(false);
            }
        };
        loadPolicy();
    }, [policyId]);

    const addDocument = () => {
        setRequiredDocs([...requiredDocs, { document_name: "", description: "", notes: "", mandatory: true }]);
    };

    const removeDocument = (idx: number) => {
        setRequiredDocs(requiredDocs.filter((_, i) => i !== idx));
    };

    const updateDocument = (idx: number, field: string, value: any) => {
        const updated = [...requiredDocs];
        (updated[idx] as any)[field] = value;
        setRequiredDocs(updated);
    };

    const handleFinalize = async () => {
        setError("");
        setSuccess("");

        const validDocs = requiredDocs.filter(d => d.document_name.trim());
        if (validDocs.length === 0) {
            setError("At least one required document must be defined");
            return;
        }

        setSubmitting(true);
        try {
            await finalizeHospitalPolicy(policyId, validDocs);
            setSuccess("Internal policy requirements confirmed and policy is now ACTIVE!");
            setTimeout(() => {
                router.push("/hospital/policies");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to finalize policy");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <div className="text-xl font-medium text-gray-700">AI is analyzing internal policy...</div>
            <p className="text-gray-500">Extracting required documents based on your PDF.</p>
        </div>
    );

    if (!policy) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-xl font-medium text-red-600">Policy not found.</div>
            <Button variant="outline" onClick={() => router.push("/hospital/policies")}>
                Return to Policies
            </Button>
        </div>
    );

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Hospital className="h-8 w-8 text-emerald-600" />
                        Confirm Internal Policy
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Policy: <span className="font-semibold text-gray-700">{policy.name}</span>
                    </p>
                </div>
                <Button
                    onClick={handleFinalize}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 px-6 min-w-[200px]"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Activating...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-5 w-5" />
                            Finalize & Activate
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    {success}
                </div>
            )}

            <Card className="shadow-lg border-emerald-100">
                <CardHeader className="bg-emerald-50/50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        AI-Generated Requirements
                    </CardTitle>
                    <p className="text-sm text-gray-500 font-normal mt-1">
                        Review the documents the AI thinks should be required for this internal policy.
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {requiredDocs.map((doc, idx) => (
                            <div key={idx} className="group border rounded-lg p-4 bg-gray-50/50 hover:bg-white hover:border-emerald-200 transition-all relative">
                                <button
                                    onClick={() => removeDocument(idx)}
                                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-red-200"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-gray-500">Document Name *</Label>
                                        <Input
                                            value={doc.document_name}
                                            onChange={e => updateDocument(idx, "document_name", e.target.value)}
                                            placeholder="e.g. Discharge Summary"
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-gray-500">Criteria</Label>
                                        <Input
                                            value={doc.description}
                                            onChange={e => updateDocument(idx, "description", e.target.value)}
                                            placeholder="Criteria for this doc"
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            onClick={addDocument}
                            className="w-full border-dashed border-2 py-8 text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Add Custom Requirement
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 flex justify-between items-center bg-gray-50 p-6 rounded-lg border">
                <div className="text-sm text-gray-500">
                    <p>Suggested requirements: <span className="font-bold text-gray-700">{requiredDocs.length}</span></p>
                    <p>Status: <span className="capitalize font-bold text-emerald-600">{policy.status}</span></p>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => router.push("/hospital/policies")}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleFinalize}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                        Confirm & Activate Policy
                    </Button>
                </div>
            </div>
        </div>
    );
}
