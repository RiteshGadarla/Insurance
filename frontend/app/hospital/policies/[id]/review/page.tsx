"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hospital, FileText, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                <div className="text-xl font-bold text-slate-900">AI is analyzing policy...</div>
                <p className="text-slate-600">Extracting required documents based on your PDF.</p>
            </div>
        );
    }

    if (!policy) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <div className="text-xl font-bold text-red-600">Policy not found.</div>
                <Button 
                    onClick={() => router.push("/hospital/policies")}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                    <ArrowRight className="h-4 w-4" />
                    Return to Policies
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Hospital className="h-8 w-8 text-blue-600" />
                        Confirm Internal Policy
                    </h1>
                    <p className="text-slate-600">
                        Policy: <span className="font-semibold text-slate-900">{policy.name}</span>
                    </p>
                </div>
                <Button
                    onClick={handleFinalize}
                    disabled={submitting}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 h-auto"
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

            {/* Error Alert */}
            {error && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Error</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Success Alert */}
            {success && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Success</p>
                        <p className="text-sm mt-1">{success}</p>
                    </div>
                </div>
            )}

            {/* AI-Generated Requirements Card */}
            <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-slate-900">AI-Generated Requirements</CardTitle>
                            <p className="text-sm text-slate-600 font-normal mt-1">
                                Review and customize the documents AI thinks should be required for this internal policy.
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {requiredDocs.map((doc, idx) => (
                            <div 
                                key={idx} 
                                className="group border-2 border-slate-200 hover:border-blue-300 rounded-lg p-5 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 transition-all relative"
                            >
                                <button
                                    onClick={() => removeDocument(idx)}
                                    className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Document Name *</Label>
                                        <Input
                                            value={doc.document_name}
                                            onChange={e => updateDocument(idx, "document_name", e.target.value)}
                                            placeholder="e.g. Discharge Summary"
                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Criteria / Description</Label>
                                        <Input
                                            value={doc.description}
                                            onChange={e => updateDocument(idx, "description", e.target.value)}
                                            placeholder="Criteria for this document"
                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <Label className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Additional Notes</Label>
                                    <Input
                                        value={doc.notes}
                                        onChange={e => updateDocument(idx, "notes", e.target.value)}
                                        placeholder="Optional notes or special instructions"
                                        className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                                    />
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addDocument}
                            className="w-full border-2 border-dashed border-blue-300 py-8 text-slate-600 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 gap-2 font-semibold"
                        >
                            <Plus className="h-5 w-5" />
                            Add Custom Requirement
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary & Action Footer */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">Total Requirements</p>
                                    <p className="text-3xl font-bold text-blue-600">{requiredDocs.filter(d => d.document_name.trim()).length}</p>
                                </div>
                                <div className="h-12 w-px bg-slate-300"></div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">Current Status</p>
                                    <p className="text-lg font-bold text-amber-600 capitalize">{policy.status || "Draft"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button 
                                variant="outline"
                                onClick={() => router.push("/hospital/policies")}
                                className="border-slate-300 text-slate-700 hover:bg-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleFinalize}
                                disabled={submitting}
                                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Confirm & Activate Policy
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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