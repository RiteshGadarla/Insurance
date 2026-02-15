"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Activity, FileText, DollarSign, Clock, AlertCircle, PlusCircle, X, Plus, Trash2 } from "lucide-react";
import { createHospitalPolicy } from "@/lib/api";

interface RequiredDoc {
    document_name: string;
    description: string;
    notes: string;
    mandatory: boolean;
}

export function HospitalView() {
    const [stats, setStats] = useState({
        activeClaims: 0,
        pendingReview: 0,
        verifiedAmount: 0,
        policiesCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
    const [policyName, setPolicyName] = useState("");
    const [requiredDocs, setRequiredDocs] = useState<RequiredDoc[]>([
        { document_name: "", description: "", notes: "", mandatory: true }
    ]);
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [policyPdfUrl, setPolicyPdfUrl] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const claimsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const claims = claimsRes.ok ? await claimsRes.json() : [];

                const policiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hospital/policies`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const policies = policiesRes.ok ? await policiesRes.json() : [];

                const active = claims.length;
                const pending = claims.filter((c: any) => c.status === "REVIEW_READY" || c.status === "SUBMITTED").length;
                const totalAmount = claims.reduce((sum: number, c: any) => sum + (c.ai_estimated_amount || 0), 0);

                setStats({
                    activeClaims: active,
                    pendingReview: pending,
                    verifiedAmount: totalAmount,
                    policiesCount: policies.length
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const openForm = () => {
        setShowForm(true);
        setError("");
        setSuccess("");
    };

    const closeForm = () => {
        setShowForm(false);
        setPolicyName("");
        setRequiredDocs([{ document_name: "", description: "", notes: "", mandatory: true }]);
        setAdditionalNotes("");
        setPolicyPdfUrl("");
        setError("");
    };

    const addDocument = () => {
        setRequiredDocs([...requiredDocs, { document_name: "", description: "", notes: "", mandatory: true }]);
    };

    const removeDocument = (idx: number) => {
        setRequiredDocs(requiredDocs.filter((_, i) => i !== idx));
    };

    const updateDocument = (idx: number, field: keyof RequiredDoc, value: any) => {
        const updated = [...requiredDocs];
        (updated[idx] as any)[field] = value;
        setRequiredDocs(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!policyName.trim()) {
            setError("Policy name is required");
            return;
        }

        const validDocs = requiredDocs.filter(d => d.document_name.trim());
        if (validDocs.length === 0) {
            setError("At least one required document must be defined");
            return;
        }

        setSubmitting(true);
        try {
            await createHospitalPolicy({
                name: policyName.trim(),
                required_documents: validDocs,
                additional_notes: additionalNotes.trim() || undefined,
                policy_pdf_url: policyPdfUrl.trim() || undefined,
            });
            setSuccess("Internal policy created successfully!");
            setStats(prev => ({ ...prev, policiesCount: prev.policiesCount + 1 }));
            setTimeout(() => closeForm(), 1500);
        } catch (err: any) {
            setError(err.message || "Failed to create policy");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6">Loading dashboard data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Hospital Dashboard</h1>
                <Button onClick={openForm} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    Create Internal Policy
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Claims</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeClaims}</div>
                        <p className="text-xs text-muted-foreground">Total claims filed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingReview}</div>
                        <p className="text-xs text-muted-foreground">Waiting for insurance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Est. Verified Amount</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.verifiedAmount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">AI Estimated Total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Policies</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.policiesCount}</div>
                        <p className="text-xs text-muted-foreground">Active insurance protocols</p>
                    </CardContent>
                </Card>
            </div>

            {stats.activeClaims === 0 && (
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-blue-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <div>No claims yet. Start by creating a new claim from the sidebar.</div>
                </div>
            )}

            {/* Create Internal Policy Form */}
            {showForm && (
                <Card className="border-2 border-emerald-200 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Create Internal Policy</CardTitle>
                        <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
                            )}
                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">{success}</div>
                            )}

                            <div>
                                <Label htmlFor="policyName">Policy Name *</Label>
                                <Input
                                    id="policyName"
                                    value={policyName}
                                    onChange={e => setPolicyName(e.target.value)}
                                    placeholder="e.g. Internal Trauma Protocol"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Required Documents *</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addDocument} className="gap-1 text-xs">
                                        <Plus className="h-3 w-3" /> Add Document
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {requiredDocs.map((doc, idx) => (
                                        <div key={idx} className="border rounded-md p-3 bg-gray-50 relative">
                                            {requiredDocs.length > 1 && (
                                                <button type="button" onClick={() => removeDocument(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
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
                                <Label htmlFor="additionalNotes">Additional Notes</Label>
                                <Textarea
                                    id="additionalNotes"
                                    value={additionalNotes}
                                    onChange={e => setAdditionalNotes(e.target.value)}
                                    placeholder="Any additional information..."
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="pdfUrl">Policy PDF Link</Label>
                                <Input
                                    id="pdfUrl"
                                    value={policyPdfUrl}
                                    onChange={e => setPolicyPdfUrl(e.target.value)}
                                    placeholder="https://example.com/policy.pdf"
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {submitting ? "Creating..." : "Create Policy"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-gray-500">Use the sidebar to manage claims and policies, or create a new internal policy above.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
