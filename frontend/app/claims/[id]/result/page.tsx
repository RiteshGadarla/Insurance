"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClaim, verifyClaim } from "@/lib/api";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ClaimResultPage() {
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (id) {
            // Trigger verification on load
            verifyClaim(id)
                .then(setVerificationResult)
                .catch((err) => {
                    console.error(err);
                    setError("Failed to verify claim. Please try again.");
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="text-xl font-semibold">Analyzing Claim...</h2>
                <p className="text-muted-foreground">Verifying documents and policy details</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-8 max-w-3xl text-center">
                <div className="bg-red-50 p-8 rounded-lg border border-red-100">
                    <h2 className="text-red-600 text-xl font-bold mb-2">Verification Failed</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Link href={`/claims/${id}`}>
                        <Button variant="outline">Go Back</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8 max-w-5xl">
            <div className="mb-8">
                <Link href={`/claims/${id}`} className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Uploads
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Verification Results</h1>
                        <p className="text-muted-foreground">Claim #{id.slice(-6)}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Acceptance Score</span>
                        <span className={cn("text-4xl font-bold", (verificationResult?.score || 0) >= 80 ? "text-green-600" : "text-yellow-600")}>
                            {verificationResult?.score}%
                        </span>
                    </div>
                </div>
            </div>

            <Card className="mb-8 border-green-200 bg-green-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <ShieldCheck className="h-6 w-6" />
                        Analysis Complete
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {verificationResult?.findings.map((finding: any, idx: number) => (
                            <div key={idx} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm">{finding.item}</h4>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded uppercase font-bold",
                                        finding.status === "Pass" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                    )}>
                                        {finding.status}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{finding.details}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
                <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
                <Button>Submit Final Claim</Button>
            </div>
        </div>
    );
}
