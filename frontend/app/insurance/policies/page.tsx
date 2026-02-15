"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck, FileText, PlusCircle, X, Plus, Trash2,
    Pencil, Building2, Check, Link2
} from "lucide-react";
import {
    fetchInsurancePolicies, createInsurancePolicy, updateInsurancePolicy,
    fetchAllHospitals, linkHospitalsToPolicy
} from "@/lib/api";

interface RequiredDoc {
    document_name: string;
    description: string;
    notes: string;
    mandatory: boolean;
}

const emptyDoc = (): RequiredDoc => ({ document_name: "", description: "", notes: "", mandatory: true });

export default function InsurancePoliciesPage() {
    const [policies, setPolicies] = useState<any[]>([]);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [policyName, setPolicyName] = useState("");
    const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
    const [requiredDocs, setRequiredDocs] = useState<RequiredDoc[]>([emptyDoc()]);
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [policyPdfUrl, setPolicyPdfUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Manage hospitals modal
    const [managingPolicyId, setManagingPolicyId] = useState<string | null>(null);
    const [managingHospitalIds, setManagingHospitalIds] = useState<string[]>([]);
    const [linkingSubmitting, setLinkingSubmitting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, h] = await Promise.all([fetchInsurancePolicies(), fetchAllHospitals()]);
            setPolicies(p);
            setHospitals(h);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const resetForm = () => {
        setPolicyName("");
        setSelectedHospitals([]);
        setRequiredDocs([emptyDoc()]);
        setAdditionalNotes("");
        setPolicyPdfUrl("");
        setEditingId(null);
        setError("");
        setSuccess("");
    };

    const openCreateForm = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditForm = (policy: any) => {
        resetForm();
        setEditingId(policy.id || policy._id);
        setPolicyName(policy.name || "");
        setSelectedHospitals(policy.connected_hospital_ids || []);
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

    const closeForm = () => {
        setShowForm(false);
        resetForm();
    };

    const addDocument = () => setRequiredDocs([...requiredDocs, emptyDoc()]);
    const removeDocument = (idx: number) => setRequiredDocs(requiredDocs.filter((_, i) => i !== idx));
    const updateDocument = (idx: number, field: keyof RequiredDoc, value: any) => {
        const updated = [...requiredDocs];
        (updated[idx] as any)[field] = value;
        setRequiredDocs(updated);
    };

    const toggleHospital = (id: string) =>
        setSelectedHospitals(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);

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
                connected_hospital_ids: selectedHospitals,
                required_documents: validDocs,
                additional_notes: additionalNotes.trim() || undefined,
                policy_pdf_url: policyPdfUrl.trim() || undefined,
            };

            if (editingId) {
                await updateInsurancePolicy(editingId, payload);
                setSuccess("Policy updated successfully!");
            } else {
                await createInsurancePolicy(payload);
                setSuccess("Policy created successfully!");
            }
            setTimeout(() => {
                closeForm();
                loadData();
            }, 1000);
        } catch (err: any) {
            setError(err.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    // Manage Hospitals
    const openManageHospitals = (policy: any) => {
        const pid = policy.id || policy._id;
        setManagingPolicyId(pid);
        setManagingHospitalIds(policy.connected_hospital_ids || []);
    };

    const toggleManagingHospital = (id: string) =>
        setManagingHospitalIds(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);

    const saveHospitalLinks = async () => {
        if (!managingPolicyId) return;
        setLinkingSubmitting(true);
        try {
            await linkHospitalsToPolicy(managingPolicyId, managingHospitalIds);
            setManagingPolicyId(null);
            loadData();
        } catch (err) {
            console.error(err);
        } finally {
            setLinkingSubmitting(false);
        }
    };

    const getHospitalName = (id: string) => {
        const h = hospitals.find((h: any) => (h.id || h._id) === id);
        return h ? h.name : id;
    };

    if (loading) return <div className="p-10">Loading policies...</div>;

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">My Policies</h1>
                <Button onClick={openCreateForm} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    Add Policy
                </Button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="mb-6 border-2 border-blue-200 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">{editingId ? "Edit Policy" : "Create New Policy"}</CardTitle>
                        <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}
                            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">{success}</div>}

                            <div>
                                <Label>Policy Name *</Label>
                                <Input value={policyName} onChange={e => setPolicyName(e.target.value)} placeholder="e.g. Gold Health Plan" className="mt-1" />
                            </div>

                            <div>
                                <Label>Connected Hospitals</Label>
                                <div className="mt-2 border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                                    {hospitals.length === 0 && <p className="text-sm text-gray-400">No hospitals available</p>}
                                    {hospitals.map((h: any) => {
                                        const hid = h.id || h._id;
                                        return (
                                            <label key={hid} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input type="checkbox" checked={selectedHospitals.includes(hid)} onChange={() => toggleHospital(hid)} className="rounded border-gray-300" />
                                                <span className="text-sm">{h.name}</span>
                                                <span className="text-xs text-gray-400 ml-auto">{h.address}</span>
                                            </label>
                                        );
                                    })}
                                </div>
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
                                                    <Input value={doc.document_name} onChange={e => updateDocument(idx, "document_name", e.target.value)} placeholder="e.g. Diagnosis Report" className="mt-1" />
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
                                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {submitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Policy")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Manage Hospitals Modal */}
            {managingPolicyId && (
                <Card className="mb-6 border-2 border-green-200 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-green-600" /> Manage Connected Hospitals
                        </CardTitle>
                        <button onClick={() => setManagingPolicyId(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2 mb-4">
                            {hospitals.map((h: any) => {
                                const hid = h.id || h._id;
                                return (
                                    <label key={hid} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                        <input type="checkbox" checked={managingHospitalIds.includes(hid)} onChange={() => toggleManagingHospital(hid)} className="rounded border-gray-300" />
                                        <span className="text-sm font-medium">{h.name}</span>
                                        <span className="text-xs text-gray-400 ml-auto">{h.address}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setManagingPolicyId(null)}>Cancel</Button>
                            <Button onClick={saveHospitalLinks} disabled={linkingSubmitting} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                <Check className="h-4 w-4" />
                                {linkingSubmitting ? "Saving..." : "Save Hospital Links"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Policy Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {policies.map((policy) => {
                    const pid = policy.id || policy._id;
                    return (
                        <Card key={pid} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold">{policy.name}</CardTitle>
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm font-semibold">Required Documents:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(policy.required_documents || []).map((doc: any, idx: number) => (
                                                <Badge key={idx} variant="outline" className="flex items-center gap-1 text-xs">
                                                    <FileText className="h-3 w-3" />
                                                    {doc.document_name}
                                                    {doc.mandatory && <span className="text-red-500">*</span>}
                                                </Badge>
                                            ))}
                                            {(!policy.required_documents || policy.required_documents.length === 0) && (
                                                <span className="text-xs text-gray-400">None specified</span>
                                            )}
                                        </div>
                                    </div>

                                    {(policy.connected_hospital_ids || []).length > 0 && (
                                        <div>
                                            <span className="text-xs font-semibold text-gray-600">Connected Hospitals:</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {policy.connected_hospital_ids.map((hid: string) => (
                                                    <Badge key={hid} variant="secondary" className="bg-green-50 text-green-700 text-xs flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" />
                                                        {getHospitalName(hid)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {policy.additional_notes && (
                                        <p className="text-xs text-gray-500 truncate">{policy.additional_notes}</p>
                                    )}

                                    {policy.policy_pdf_url && (
                                        <a href={policy.policy_pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">
                                            View Policy PDF
                                        </a>
                                    )}

                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button size="sm" variant="outline" onClick={() => openEditForm(policy)} className="gap-1 text-xs">
                                            <Pencil className="h-3 w-3" /> Edit
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => openManageHospitals(policy)} className="gap-1 text-xs">
                                            <Building2 className="h-3 w-3" /> Manage Hospitals
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                {policies.length === 0 && (
                    <div className="text-gray-500 col-span-full text-center py-10">
                        No policies created yet. Click &quot;Add Policy&quot; to create your first policy.
                    </div>
                )}
            </div>
        </div>
    );
}
