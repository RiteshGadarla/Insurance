"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle, XCircle, AlertCircle, PlusCircle, X, Plus, Trash2 } from "lucide-react";
import { createInsurancePolicy, fetchAllHospitals } from "@/lib/api";

interface RequiredDoc {
    document_name: string;
    description: string;
    notes: string;
    mandatory: boolean;
}

export function InsuranceView() {
    const [stats, setStats] = useState({
        toReview: 0,
        approved: 0,
        rejected: 0,
        policiesCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
    const [policyName, setPolicyName] = useState("");
    const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
    const [requiredDocs, setRequiredDocs] = useState<RequiredDoc[]>([
        { document_name: "", description: "", notes: "", mandatory: true }
    ]);
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [policyPdfUrl, setPolicyPdfUrl] = useState("");
    const [hospitals, setHospitals] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const claimsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/claims/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const claims = claimsRes.ok ? await claimsRes.json() : [];

                const policiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/insurance/policies`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const policies = policiesRes.ok ? await policiesRes.json() : [];

                const toReview = claims.filter((c: any) => c.status === "REVIEW_READY").length;
                const approved = claims.filter((c: any) => c.status === "APPROVED").length;
                const rejected = claims.filter((c: any) => c.status === "REJECTED").length;

                setStats({
                    toReview,
                    approved,
                    rejected,
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

    const loadHospitals = async () => {
        try {
            const data = await fetchAllHospitals();
            setHospitals(data);
        } catch (e) {
            console.error("Failed to load hospitals", e);
        }
    };

    const openForm = () => {
        setShowForm(true);
        setError("");
        setSuccess("");
        loadHospitals();
    };

    const closeForm = () => {
        setShowForm(false);
        setPolicyName("");
        setSelectedHospitals([]);
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

    const toggleHospital = (id: string) => {
        setSelectedHospitals(prev =>
            prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
        );
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
            await createInsurancePolicy({
                name: policyName.trim(),
                connected_hospital_ids: selectedHospitals,
                required_documents: validDocs,
                additional_notes: additionalNotes.trim() || undefined,
                policy_pdf_url: policyPdfUrl.trim() || undefined,
            });
            setSuccess("Policy created successfully!");
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
                <h1 className="text-2xl font-bold tracking-tight">Insurance Dashboard</h1>
                <Button onClick={openForm} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    Add Policy
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Claims to Review</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.toReview}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.approved}</div>
                        <p className="text-xs text-muted-foreground">Total approved claims</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rejected}</div>
                        <p className="text-xs text-muted-foreground">Total rejected claims</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.policiesCount}</div>
                        <p className="text-xs text-muted-foreground">Policies managed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Add Policy Form */}
            {showForm && (
                <Card className="border-2 border-blue-200 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Create New Policy</CardTitle>
                        <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                                    {success}
                                </div>
                            )}

                            <div>
                                <Label htmlFor="policyName">Policy Name *</Label>
                                <Input
                                    id="policyName"
                                    value={policyName}
                                    onChange={e => setPolicyName(e.target.value)}
                                    placeholder="e.g. Gold Health Plan"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Connected Hospitals</Label>
                                <div className="mt-2 border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                                    {hospitals.length === 0 && (
                                        <p className="text-sm text-gray-400">No hospitals available</p>
                                    )}
                                    {hospitals.map((h: any) => {
                                        const hid = h.id || h._id;
                                        return (
                                            <label key={hid} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedHospitals.includes(hid)}
                                                    onChange={() => toggleHospital(hid)}
                                                    className="rounded border-gray-300"
                                                />
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
                                    <Button type="button" variant="outline" size="sm" onClick={addDocument} className="gap-1 text-xs">
                                        <Plus className="h-3 w-3" /> Add Document
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {requiredDocs.map((doc, idx) => (
                                        <div key={idx} className="border rounded-md p-3 bg-gray-50 relative">
                                            {requiredDocs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeDocument(idx)}
                                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs">Document Name *</Label>
                                                    <Input
                                                        value={doc.document_name}
                                                        onChange={e => updateDocument(idx, "document_name", e.target.value)}
                                                        placeholder="e.g. Diagnosis Report"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Description</Label>
                                                    <Input
                                                        value={doc.description}
                                                        onChange={e => updateDocument(idx, "description", e.target.value)}
                                                        placeholder="Brief description"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                <div>
                                                    <Label className="text-xs">Notes</Label>
                                                    <Input
                                                        value={doc.notes}
                                                        onChange={e => updateDocument(idx, "notes", e.target.value)}
                                                        placeholder="Optional notes"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div className="flex items-end gap-2 pb-1">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={doc.mandatory}
                                                            onChange={e => updateDocument(idx, "mandatory", e.target.checked)}
                                                            className="rounded border-gray-300"
                                                        />
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
                                    placeholder="Any additional information about this policy..."
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
                                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {submitting ? "Creating..." : "Create Policy"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Recent Claims</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-500">
                        {stats.toReview > 0 ? "You have pending claims to review." : "No pending claims."}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
