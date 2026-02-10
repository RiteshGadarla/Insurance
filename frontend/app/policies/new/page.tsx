"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPolicyWithFile } from "@/lib/api";
import { FileUpload } from "@/components/ui/file-upload";

export default function NewPolicyPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [insurer, setInsurer] = useState("");
    const [requiredDocs, setRequiredDocs] = useState<string[]>([]);

    const [policyFile, setPolicyFile] = useState<File | null>(null);

    const commonDocs = [
        "Discharge Summary",
        "Final Hospital Bill",
        "Pharmacy Bills",
        "Investigation Reports",
        "Patient ID Proof",
        "Policy Document",
        "Employee ID Card",
        "Pre-authorization Letter"
    ];

    const toggleDoc = (doc: string) => {
        setRequiredDocs(prev =>
            prev.includes(doc)
                ? prev.filter(d => d !== doc)
                : [...prev, doc]
        );
    };

    const calculatePolicy = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPolicyWithFile({
                name,
                insurer,
                required_documents: requiredDocs
            }, policyFile);
            router.push("/claims/new");
        } catch (error) {
            console.error("Failed to create policy", error);
            alert("Failed to create policy");
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Create Custom Policy</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={calculatePolicy} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Policy Name</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Gold Health Plus" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Insurer Name</label>
                            <Input value={insurer} onChange={(e) => setInsurer(e.target.value)} required placeholder="e.g. Acme Insurance" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Policy Document (Optional)</label>
                            <FileUpload onFileSelect={setPolicyFile} label="Upload Policy PDF" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Required Documents</label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {commonDocs.map((doc) => (
                                    <div key={doc} className="flex items-center space-x-2 border p-2 border-gray-200">
                                        <input
                                            type="checkbox"
                                            id={doc}
                                            checked={requiredDocs.includes(doc)}
                                            onChange={() => toggleDoc(doc)}
                                            className="h-4 w-4"
                                        />
                                        <label htmlFor={doc} className="text-sm">{doc}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full">Save and Return to Claim Creation</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
