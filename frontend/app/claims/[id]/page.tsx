"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClaim, uploadDocument } from "@/lib/api";
import { CheckCircle, AlertCircle, FileText, Upload, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/ui/file-upload";

export default function ClaimUploadPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        setLoading(true);
        getClaim(id)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const handleUpload = async (docName: string, file: File | null) => {
        if (!file) return;

        try {
            await uploadDocument(id, file, docName);
            fetchData(); // Refresh to see updates
        } catch (e) {
            console.error(e);
            alert("Upload failed");
        }
    };

    const handleProcess = () => {
        router.push(`/claims/${id}/result`);
    };

    if (loading) return <div className="p-8">Loading claim data...</div>;
    if (!data) return <div className="p-8">Claim not found</div>;

    const { claim, policy, uploaded_documents, missing_documents, required_documents } = data;

    return (
        <div className="container mx-auto p-8 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Claim #{id.slice(-6)}</h1>
                    <p className="text-muted-foreground">Patient: {claim.patient_name} | {claim.insurer_name}</p>
                </div>
                <div className="flex gap-4 items-center">
                    <Button
                        onClick={handleProcess}
                        disabled={missing_documents.length > 0}
                        className={cn(missing_documents.length === 0 ? "bg-black" : "opacity-50")}
                    >
                        {missing_documents.length === 0 ? "Process Claim" : "Complete Uploads first"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Requirements & Status */}
                <div className="space-y-8 md:col-span-2">

                    {/* Action Items / Missing Docs */}
                    <Card className="border-2 border-black">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                Required Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {missing_documents.length === 0 ? (
                                <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">All required documents uploaded!</span>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {missing_documents.map((doc: string) => (
                                        <li key={doc} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-md">
                                            <span className="font-medium">{doc}</span>
                                            <div className="w-[200px]">
                                                <FileUpload onFileSelect={(f) => handleUpload(doc, f)} label="Upload PDF" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Uploaded Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Uploaded Documents ({uploaded_documents.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {uploaded_documents.length === 0 ? (
                                <p className="text-muted-foreground">No documents uploaded yet.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {uploaded_documents.map((doc: any) => (
                                        <li key={doc._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                                <div>
                                                    <p className="font-medium">{doc.type}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                                                    {new Date(doc.uploaded_at).toLocaleDateString()}
                                                </span>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Policy & Claim Details (Extracted Details Simulation) */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Extracted Policy Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <h4 className="font-semibold">{policy?.name}</h4>
                                <p className="text-sm text-muted-foreground">{policy?.insurer}</p>
                                {policy?.notes && <p className="text-xs bg-yellow-50 p-2 border border-yellow-200 rounded mt-2">{policy.notes}</p>}
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-sm font-medium">Requirements</h5>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    {required_documents && required_documents.map((doc: string) => (
                                        <li key={doc} className="flex items-center gap-2">
                                            <span className={cn(
                                                "h-1.5 w-1.5 rounded-full",
                                                missing_documents.includes(doc) ? "bg-red-400" : "bg-green-400"
                                            )} />
                                            {doc}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Claim Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className="font-medium bg-gray-100 px-2 py-1 rounded">{claim.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">{claim.claim_type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created:</span>
                                <span className="font-medium">{new Date(claim.created_at).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
