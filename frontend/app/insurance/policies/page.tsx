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
    Loader2,
    Sparkles,
    Shield,
    Clock,
    Upload
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
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
            <style jsx global>{`
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
                }
                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                    background: linear-gradient(
                        to right,
                        transparent 0%,
                        rgba(139, 92, 246, 0.1) 50%,
                        transparent 100%
                    );
                    background-size: 1000px 100%;
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
                .animate-slide-in {
                    animation: slide-in 0.5s ease-out;
                }
                .gradient-border {
                    position: relative;
                    background: white;
                    border-radius: 1rem;
                }
                .gradient-border::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 1rem;
                    padding: 2px;
                    background: linear-gradient(135deg, #8b5cf6, #d946ef, #7c3aed);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                }
            `}</style>

            {/* Animated Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '0s' }} />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />
            </div>

            <div className="container mx-auto py-12 px-4 relative z-10">
                {/* Header Section */}
                <div className="mb-12 animate-slide-in">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        
                        {!showForm && (
                            <Button 
                                onClick={() => setShowForm(true)} 
                                className="bg-gradient-to-r ml-auto from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white gap-2 px-6 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <Plus className="h-5 w-5" />
                                Create New Policy
                            </Button>
                        )}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-3 gap-4 mt-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-violet-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-100 rounded-lg">
                                    <ShieldCheck className="h-5 w-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Active Policies</p>
                                    <p className="text-2xl font-bold text-violet-600">
                                        {policies.filter(p => p.status !== "DRAFT").length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Draft Policies</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {policies.filter(p => p.status === "DRAFT").length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-fuchsia-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-fuchsia-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-fuchsia-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Documents</p>
                                    <p className="text-2xl font-bold text-fuchsia-600">
                                        {policies.reduce((acc, p) => acc + (p.required_documents?.length || 0), 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                {showForm && (
                    <Card className="mb-8 border-2 border-violet-200 shadow-2xl bg-white/90 backdrop-blur-sm animate-slide-in overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-50 to-purple-50 opacity-50" />
                        <CardHeader className="flex flex-row items-center justify-between relative z-10 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50">
                            <CardTitle className="text-xl flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-lg">
                                    <PlusCircle className="h-6 w-6 text-white" />
                                </div>
                                <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-bold">
                                    Create New Policy
                                </span>
                            </CardTitle>
                            <button 
                                onClick={() => setShowForm(false)} 
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="relative z-10 p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm flex items-center gap-3 animate-slide-in">
                                        <div className="bg-red-100 p-2 rounded-full">
                                            <AlertCircle className="h-5 w-5 text-red-600" />
                                        </div>
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg shadow-sm flex items-center gap-3 animate-slide-in">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        </div>
                                        <span className="font-medium">{success}</span>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="policyName" className="text-gray-700 font-semibold flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-violet-600" />
                                            Policy Name *
                                        </Label>
                                        <Input
                                            id="policyName"
                                            value={policyName}
                                            onChange={e => setPolicyName(e.target.value)}
                                            placeholder="e.g. Gold Health Plan"
                                            className="border-violet-200 focus:border-violet-400 focus:ring-violet-400 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="policyFile" className="text-gray-700 font-semibold flex items-center gap-2">
                                            <Upload className="h-4 w-4 text-purple-600" />
                                            Upload Policy PDF *
                                        </Label>
                                        <Input
                                            id="policyFile"
                                            type="file"
                                            accept=".pdf"
                                            onChange={e => setPolicyFile(e.target.files?.[0] || null)}
                                            className="
                                                h-10 py-1
                                                border-violet-200 
                                                focus:border-violet-400
                                                file:mr-4 
                                                file:py-1.5 
                                                file:px-4 
                                                file:rounded-full 
                                                file:border-0 
                                                file:text-sm 
                                                file:font-semibold 
                                                file:bg-gradient-to-r 
                                                file:from-violet-50 
                                                file:to-purple-50 
                                                file:text-violet-700 
                                                hover:file:from-violet-100 
                                                hover:file:to-purple-100 
                                                transition-all 
                                                cursor-pointer
                                            "
                                            />

                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-200 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Sparkles className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-violet-900 mb-1">AI-Powered Analysis</h4>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                Our AI analyzes the uploaded policy and suggests required claim documents.                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setShowForm(false)} 
                                        disabled={submitting}
                                        className="border-violet-200 text-violet-700 hover:bg-violet-50"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={submitting} 
                                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white min-w-[220px] shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Analyzing with AI...
                                            </>
                                        ) : (
                                            <>
                                                Create & Analyze Policy
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Policies List */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block">
                            <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
                            <p className="mt-4 text-gray-600 font-medium">Loading policies...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {policies.map((policy: any, index: number) => (
                            <Card 
                                key={policy.id || policy._id} 
                                className={`
                                    group hover:shadow-2xl transition-all duration-300 overflow-hidden
                                    ${policy.status === "DRAFT" 
                                        ? "border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50/50 to-yellow-50/50" 
                                        : "border border-violet-200 bg-white/80 backdrop-blur-sm hover:border-violet-300"
                                    }
                                    animate-slide-in
                                `}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                p-3 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300
                                                ${policy.status === "DRAFT" 
                                                    ? 'bg-gradient-to-br from-amber-400 to-yellow-500' 
                                                    : 'bg-gradient-to-br from-violet-500 to-purple-600'
                                                }
                                            `}>
                                                <ShieldCheck className="h-7 w-7 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
                                                    {policy.name}
                                                </CardTitle>
                                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                    <Badge 
                                                        variant={policy.status === "DRAFT" ? "outline" : "default"} 
                                                        className={`
                                                            font-semibold px-3 py-1 shadow-sm
                                                            ${policy.status === "DRAFT" 
                                                                ? "text-amber-700 border-amber-300 bg-amber-50" 
                                                                : "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0"
                                                            }
                                                        `}
                                                    >
                                                        {policy.status || "ACTIVE"}
                                                    </Badge>
                                                    {policy.required_documents?.length > 0 && (
                                                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                                                            <FileText className="h-3 w-3" />
                                                            {policy.required_documents.length} documents required
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {policy.status === "DRAFT" ? (
                                                <Button
                                                    onClick={() => router.push(`/insurance/policies/${policy.id || policy._id}/review`)}
                                                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                                >
                                                    <AlertCircle className="h-4 w-4" />
                                                    Complete Setup
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 transition-all shadow-sm hover:shadow-md"
                                                    onClick={() => router.push(`/insurance/policies/${policy.id || policy._id}/review`)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                    Edit Policy
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <div className="w-1 h-4 bg-violet-500 rounded-full" />
                                                Required Documents
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {policy.required_documents?.slice(0, 4).map((doc: any, i: number) => (
                                                    <Badge 
                                                        key={i} 
                                                        variant="secondary" 
                                                        className="font-normal bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors"
                                                    >
                                                        {doc.document_name}
                                                    </Badge>
                                                ))}
                                                {policy.required_documents?.length > 4 && (
                                                    <Badge 
                                                        variant="secondary" 
                                                        className="font-semibold bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border border-violet-200"
                                                    >
                                                        +{policy.required_documents.length - 4} more
                                                    </Badge>
                                                )}
                                                {(!policy.required_documents || policy.required_documents.length === 0) && (
                                                    <span className="text-sm text-gray-400 italic">No documents defined yet</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                                                Policy Document
                                            </div>
                                            {policy.policy_pdf_path ? (
                                                <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-200 hover:border-violet-300 transition-all group/file cursor-pointer">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover/file:shadow-md transition-shadow">
                                                        <FileText className="h-5 w-5 text-violet-600" />
                                                    </div>
                                                    <span className="truncate max-w-[250px] text-violet-700 font-medium">
                                                        {policy.policy_pdf_path.split('/').pop().split('_').slice(1).join('_')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">No document uploaded</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        
                        {/* Empty State */}
                        {policies.length === 0 && !showForm && (
                            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-violet-200 animate-slide-in">
                                <div className="inline-block p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-full mb-6 animate-float">
                                    <ShieldCheck className="h-16 w-16 text-violet-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No policies found</h3>
                                <p className="text-gray-600 mb-6">Get started by creating your first insurance policy</p>
                                <Button 
                                    onClick={() => setShowForm(true)}
                                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white gap-2 px-6 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <Plus className="h-5 w-5" />
                                    Create Your First Policy
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function InsurancePoliciesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading policies page...</p>
                </div>
            </div>
        }>
            <PoliciesContent />
        </Suspense>
    );
} 