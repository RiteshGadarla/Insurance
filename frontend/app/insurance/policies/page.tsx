"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ShieldCheck,
    Plus,
    Edit2,
    X,
    Trash2,
    FileText,
    AlertCircle,
    CheckCircle2,
    PlusCircle,
    Loader2
} from "lucide-react";
import {
    fetchInsurancePolicies,
    createInsurancePolicy
} from "@/lib/api";

function PoliciesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [policyName, setPolicyName] = useState("");
    const [policyFile, setPolicyFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loadPolicies = async () => {
        setLoading(true);
        try {
            const data = await fetchInsurancePolicies();
            setPolicies(data);
        } catch (err: any) {
            setError(err.message || "Failed to load policies");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPolicies();
        if (searchParams.get("action") === "add") {
            setShowForm(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!policyName.trim()) {
            setError("Policy name is required");
            return;
        }

        if (!policyFile) {
            setError("Policy PDF file is required");
            return;
        }

        setSubmitting(true);
        try {
            const result = await createInsurancePolicy(policyName.trim(), policyFile);
            setSuccess("Policy draft created! AI is analyzing. Redirecting to review...");
            setTimeout(() => {
                const pid = result.id || result._id;
                if (pid) {
                    router.push(`/insurance/policies/${pid}/review`);
                } else {
                    setError("Policy created but ID missing. Please check policies list.");
                }
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to create policy");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Policies Management</h1>
                    <p className="text-gray-500 mt-1">Manage your insurance policies and required claim documents.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <Plus className="h-4 w-4" />
                        New Policy
                    </Button>
                )}
            </div>

            {showForm && (
                <Card className="mb-8 border-2 border-blue-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-blue-600" />
                            Create New Policy
                        </CardTitle>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {success}
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="policyName">Policy Name *</Label>
                                    <Input
                                        id="policyName"
                                        value={policyName}
                                        onChange={e => setPolicyName(e.target.value)}
                                        placeholder="e.g. Gold Health Plan"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="policyFile">Upload Policy PDF *</Label>
                                    <Input
                                        id="policyFile"
                                        type="file"
                                        accept=".pdf"
                                        onChange={e => setPolicyFile(e.target.files?.[0] || null)}
                                        className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
                                <strong>AI Analysis:</strong> Once uploaded, our AI will automatically scan the document to identify and suggest common claim requirements like discharge summaries, final bills, etc.
                            </p>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            AI Analysis in Progress...
                                        </>
                                    ) : "Create & Analyze Policy"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-20">Loading policies...</div>
            ) : (
                <div className="grid gap-6">
                    {policies.map((policy: any) => (
                        <Card key={policy.id || policy._id} className={policy.status === "DRAFT" ? "border-dashed border-2 border-yellow-200 bg-yellow-50/20" : ""}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${policy.status === "DRAFT" ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{policy.name}</CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={policy.status === "DRAFT" ? "outline" : "default"} className={policy.status === "DRAFT" ? "text-yellow-700 border-yellow-200" : "bg-blue-600"}>
                                                    {policy.status || "ACTIVE"}
                                                </Badge>
                                                {policy.required_documents?.length > 0 && (
                                                    <span className="text-xs text-gray-500">
                                                        {policy.required_documents.length} required documents
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {policy.status === "DRAFT" ? (
                                            <Button
                                                onClick={() => router.push(`/insurance/policies/${policy.id || policy._id}/review`)}
                                                className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
                                            >
                                                <AlertCircle className="h-4 w-4" />
                                                Finish Setup
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                                                <Edit2 className="h-4 w-4" />
                                                Edit Policy
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-700">Required Documents</p>
                                            <div className="flex flex-wrap gap-2">
                                                {policy.required_documents?.slice(0, 3).map((doc: any, i: number) => (
                                                    <Badge key={i} variant="secondary" className="font-normal">
                                                        {doc.document_name}
                                                    </Badge>
                                                ))}
                                                {policy.required_documents?.length > 3 && (
                                                    <Badge variant="secondary" className="font-normal">
                                                        +{policy.required_documents.length - 3} more
                                                    </Badge>
                                                )}
                                                {(!policy.required_documents || policy.required_documents.length === 0) && (
                                                    <span className="text-xs text-gray-400 italic">No documents defined</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-700">Policy Document</p>
                                            {policy.policy_pdf_path ? (
                                                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="truncate max-w-[200px]">
                                                        {policy.policy_pdf_path.split('/').pop().split('_').slice(1).join('_')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No document uploaded</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {policies.length === 0 && !showForm && (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
                            <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No policies found</h3>
                            <p className="text-gray-500">Click "New Policy" to get started.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function InsurancePoliciesPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading policies page...</div>}>
            <PoliciesContent />
        </Suspense>
    );
}
