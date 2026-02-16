"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileText, PlusCircle, X, Plus, Trash2, Pencil, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { fetchHospitalPolicies, createHospitalPolicy, updateHospitalPolicy } from "@/lib/api";

interface RequiredDoc {
    document_name: string;
    description: string;
    notes: string;
    mandatory: boolean;
}

const emptyDoc = (): RequiredDoc => ({ document_name: "", description: "", notes: "", mandatory: true });

function HospitalPoliciesContent() {
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [policyName, setPolicyName] = useState("");
    const [requiredDocs, setRequiredDocs] = useState<RequiredDoc[]>([emptyDoc()]);
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [policyPdfUrl, setPolicyPdfUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const p = await fetchHospitalPolicies();
            setPolicies(p);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const resetForm = () => {
        setPolicyName("");
        setRequiredDocs([emptyDoc()]);
        setAdditionalNotes("");
        setPolicyPdfUrl("");
        setEditingId(null);
        setError("");
        setSuccess("");
    };

    const searchParams = useSearchParams();
    useEffect(() => {
        if (searchParams.get("action") === "create") {
            setShowForm(true);
        }
    }, [searchParams]);

    const openCreateForm = () => { resetForm(); setShowForm(true); };

    const openEditForm = (policy: any) => {
        resetForm();
        setEditingId(policy.id || policy._id);
        setPolicyName(policy.name || "");
        setRequiredDocs(
            (policy.required_documents || []).length > 0
                ? policy.required_documents.map((d: any) => ({
                    document_name: d.document_name || "",
                    description: d.description || "",
                    notes: d.notes || "",
                    mandatory: d.mandatory !== false,
                }))
                : [emptyDoc()]
        );
        setAdditionalNotes(policy.additional_notes || "");
        setPolicyPdfUrl(policy.policy_pdf_url || "");
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); resetForm(); };

    const addDocument = () => setRequiredDocs([...requiredDocs, emptyDoc()]);
    const removeDocument = (idx: number) => setRequiredDocs(requiredDocs.filter((_, i) => i !== idx));
    const updateDocument = (idx: number, field: keyof RequiredDoc, value: any) => {
        const updated = [...requiredDocs];
        (updated[idx] as any)[field] = value;
        setRequiredDocs(updated);
    };

    const [policyFile, setPolicyFile] = useState<File | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!policyName.trim()) { setError("Policy name is required"); return; }
        if (!editingId && !policyFile) { setError("Please upload a policy PDF"); return; }

        setSubmitting(true);
        try {
            if (editingId) {
                const validDocs = requiredDocs.filter(d => d.document_name.trim());
                await updateHospitalPolicy(editingId, { name: policyName, required_documents: validDocs });
                setSuccess("Policy updated successfully!");
                setTimeout(() => { closeForm(); loadData(); }, 1000);
            } else {
                const result = await createHospitalPolicy(policyName, policyFile!);
                setSuccess("Policy uploaded! Redirecting to review...");
                setTimeout(() => {
                    router.push(`/hospital/policies/${result.id || result._id}/review`);
                }, 1500);
            }
        } catch (err: any) {
            setError(err.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const isOwnPolicy = (policy: any) => !!policy.hospital_id;

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading policies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 px-8 mt-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Insurance Policies</h1>
                    <p className="text-slate-600">Create and manage internal hospital policies</p>
                </div>
                <Button 
                    onClick={openCreateForm} 
                    className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                    <PlusCircle className="h-5 w-5" />
                    Create Internal Policy
                </Button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="border-0 shadow-lg bg-white animate-slide-in-up">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-2xl text-slate-900">
                            {editingId ? "Edit Internal Policy" : "Create New Internal Policy"}
                        </CardTitle>
                        <button 
                            onClick={closeForm} 
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                    {success}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-900">Policy Name *</Label>
                                <Input 
                                    value={policyName} 
                                    onChange={e => setPolicyName(e.target.value)} 
                                    placeholder="e.g. Internal Trauma Protocol"
                                    className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {!editingId && (
                                <div className="p-8 border-2 border-dashed border-blue-300 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:border-blue-400 hover:from-blue-100 hover:to-cyan-100 transition-all cursor-pointer group">
                                    <Label className="flex flex-col items-center justify-center cursor-pointer gap-3">
                                        <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                            <FileText className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-sm font-semibold text-slate-900">
                                                {policyFile ? policyFile.name : "Upload Policy PDF"}
                                            </span>
                                            <span className="block text-xs text-slate-600 mt-1">AI will analyze and extract requirements</span>
                                            <span className="block text-xs text-slate-500 mt-1">PDF documents only, max 10MB</span>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="application/pdf"
                                            onChange={(e) => setPolicyFile(e.target.files?.[0] || null)}
                                        />
                                    </Label>
                                </div>
                            )}

                            {editingId && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold text-slate-900">Required Documents *</Label>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={addDocument} 
                                            className="gap-1 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                                        >
                                            <Plus className="h-3 w-3" /> Add Document
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {requiredDocs.map((doc, idx) => (
                                            <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-slate-50 to-white hover:border-blue-300 relative group transition-all">
                                                {requiredDocs.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeDocument(idx)} 
                                                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-semibold text-slate-900">Document Name *</Label>
                                                        <Input 
                                                            value={doc.document_name} 
                                                            onChange={e => updateDocument(idx, "document_name", e.target.value)} 
                                                            placeholder="e.g. Discharge Summary"
                                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-semibold text-slate-900">Description</Label>
                                                        <Input 
                                                            value={doc.description} 
                                                            onChange={e => updateDocument(idx, "description", e.target.value)} 
                                                            placeholder="Brief description"
                                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={closeForm} 
                                    disabled={submitting}
                                    className="border-slate-300"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {editingId ? "Saving..." : "Uploading & Analyzing..."}
                                        </>
                                    ) : (
                                        editingId ? "Save Changes" : "Create & Analyze Policy"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Policy Cards Grid */}
            {policies.length === 0 ? (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-12 text-center">
                    <ShieldCheck className="h-12 w-12 text-blue-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Policies Found</h3>
                    <p className="text-slate-600 mb-6">Create your first internal policy to get started managing claim requirements.</p>
                    <Button 
                        onClick={openCreateForm}
                        className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2 rounded-lg"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Create Your First Policy
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {policies.map((policy, index) => (
                        <div
                            key={policy.id || policy._id}
                            style={{ animation: `slideInUp 0.6s ease-out ${index * 0.1}s both` }}
                        >
                            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group h-full flex flex-col">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                                                <ShieldCheck className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg font-bold text-slate-900 break-words">{policy.name}</CardTitle>
                                            </div>
                                        </div>
                                        {isOwnPolicy(policy) && (
                                            <Badge className="bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0">Internal</Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 mb-2">Required Documents</p>
                                        {policy.required_documents?.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {policy.required_documents.map((doc: any, idx: number) => (
                                                    <Badge 
                                                        key={idx} 
                                                        variant="outline" 
                                                        className="flex items-center gap-1 text-xs bg-blue-50 border-blue-200 text-blue-700"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        {doc.document_name}
                                                        {doc.mandatory && <span className="text-red-500 font-bold">*</span>}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500 italic">None specified</span>
                                        )}
                                    </div>

                                    {policy.additional_notes && (
                                        <p className="text-xs text-slate-600 line-clamp-2 p-2 bg-slate-50 rounded">{policy.additional_notes}</p>
                                    )}

                                    {policy.policy_pdf_url && (
                                        <a 
                                            href={policy.policy_pdf_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                                        >
                                            <FileText className="h-3 w-3" />
                                            View Policy PDF
                                        </a>
                                    )}

                                    {policy.connected_hospital_ids?.length > 0 && (
                                        <Badge className="bg-green-100 text-green-700 text-xs">Linked to Hospital</Badge>
                                    )}
                                </CardContent>

                                {isOwnPolicy(policy) && (
                                    <div className="border-t border-slate-200 pt-4">
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => openEditForm(policy)} 
                                            className="w-full gap-2 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                                        >
                                            <Pencil className="h-3 w-3" /> Edit Policy
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>
                    ))}
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

export default function HospitalPoliciesPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading policies...</p>
                </div>
            </div>
        }>
            <HospitalPoliciesContent />
        </Suspense>
    );
}