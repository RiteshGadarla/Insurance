"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileText, PlusCircle, X, Plus, Trash2, Pencil } from "lucide-react";
import { fetchHospitalPolicies, createHospitalPolicy, updateHospitalPolicy } from "@/lib/api";

interface RequiredDoc {
    document_name: string;
    description: string;
    notes: string;
    mandatory: boolean;
}

const emptyDoc = (): RequiredDoc => ({ document_name: "", description: "", notes: "", mandatory: true });

export default function HospitalPoliciesPage() {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!policyName.trim()) { setError("Policy name is required"); return; }
        const validDocs = requiredDocs.filter(d => d.document_name.trim());
        if (validDocs.length === 0) { setError("At least one required document must be defined"); return; }

        setSubmitting(true);
        try {
            const payload = {
                name: policyName.trim(),
                required_documents: validDocs,
                additional_notes: additionalNotes.trim() || undefined,
                policy_pdf_url: policyPdfUrl.trim() || undefined,
            };

            if (editingId) {
                await updateHospitalPolicy(editingId, payload);
                setSuccess("Policy updated successfully!");
            } else {
                await createHospitalPolicy(payload);
                setSuccess("Internal policy created successfully!");
            }
            setTimeout(() => { closeForm(); loadData(); }, 1000);
        } catch (err: any) {
            setError(err.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    // Determine if hospital owns the policy (has hospital_id set)
    const isOwnPolicy = (policy: any) => !!policy.hospital_id;

    if (loading) return <div className="p-10">Loading policies...</div>;

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Available Policies</h1>
                <Button onClick={openCreateForm} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    Create Internal Policy
                </Button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="mb-6 border-2 border-emerald-200 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">{editingId ? "Edit Policy" : "Create Internal Policy"}</CardTitle>
                        <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}
                            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">{success}</div>}

                            <div>
                                <Label>Policy Name *</Label>
                                <Input value={policyName} onChange={e => setPolicyName(e.target.value)} placeholder="e.g. Internal Trauma Protocol" className="mt-1" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Required Documents *</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addDocument} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Add Document</Button>
                                </div>
                                <div className="space-y-3">
                                    {requiredDocs.map((doc, idx) => (
                                        <div key={idx} className="border rounded-md p-3 bg-gray-50 relative">
                                            {requiredDocs.length > 1 && (
                                                <button type="button" onClick={() => removeDocument(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                            )}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs">Document Name *</Label>
                                                    <Input value={doc.document_name} onChange={e => updateDocument(idx, "document_name", e.target.value)} placeholder="e.g. Discharge Summary" className="mt-1" />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Description</Label>
                                                    <Input value={doc.description} onChange={e => updateDocument(idx, "description", e.target.value)} placeholder="Brief description" className="mt-1" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                <div>
                                                    <Label className="text-xs">Notes</Label>
                                                    <Input value={doc.notes} onChange={e => updateDocument(idx, "notes", e.target.value)} placeholder="Optional notes" className="mt-1" />
                                                </div>
                                                <div className="flex items-end gap-2 pb-1">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={doc.mandatory} onChange={e => updateDocument(idx, "mandatory", e.target.checked)} className="rounded border-gray-300" />
                                                        <span className="text-sm">Mandatory</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label>Additional Notes</Label>
                                <Textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} placeholder="Any additional information..." className="mt-1" />
                            </div>

                            <div>
                                <Label>Policy PDF Link</Label>
                                <Input value={policyPdfUrl} onChange={e => setPolicyPdfUrl(e.target.value)} placeholder="https://example.com/policy.pdf" className="mt-1" />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {submitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Policy")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Policy Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {policies.map((policy) => (
                    <Card key={policy.id || policy._id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold">{policy.name}</CardTitle>
                            <div className="flex items-center gap-2">
                                {isOwnPolicy(policy) && (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">Internal</Badge>
                                )}
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-semibold">Required Documents:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {policy.required_documents?.length > 0 ? (
                                            policy.required_documents.map((doc: any, idx: number) => (
                                                <Badge key={idx} variant="outline" className="flex items-center gap-1 text-xs">
                                                    <FileText className="h-3 w-3" />
                                                    {doc.document_name}
                                                    {doc.mandatory && <span className="text-red-500">*</span>}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400">None specified</span>
                                        )}
                                    </div>
                                </div>

                                {policy.additional_notes && (
                                    <p className="text-xs text-gray-500 truncate">{policy.additional_notes}</p>
                                )}

                                {policy.policy_pdf_url && (
                                    <a href={policy.policy_pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                                        View Policy PDF
                                    </a>
                                )}

                                {policy.connected_hospital_ids?.length > 0 && (
                                    <div className="text-xs text-green-600 flex items-center gap-1">
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">Linked to Hospital</Badge>
                                    </div>
                                )}

                                {isOwnPolicy(policy) && (
                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button size="sm" variant="outline" onClick={() => openEditForm(policy)} className="gap-1 text-xs">
                                            <Pencil className="h-3 w-3" /> Edit
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {policies.length === 0 && (
                    <div className="text-gray-500 col-span-full text-center py-10">
                        No policies available. Click &quot;Create Internal Policy&quot; to create your first policy.
                    </div>
                )}
            </div>
        </div>
    );
}
