"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { fetchPolicyById, finalizeInsurancePolicy } from "@/lib/api";

export default function ReviewPolicyRequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: policyId } = use(params);

  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requiredDocs, setRequiredDocs] = useState<any[]>([]);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const data = await fetchPolicyById(policyId);
        setPolicy(data);
        setRequiredDocs(data.required_documents || []);
      } catch (err: any) {
        setError(err.message || "Failed to load policy");
      } finally {
        setLoading(false);
      }
    };
    loadPolicy();
  }, [policyId]);

  const addDocument = () => {
    setRequiredDocs([
      ...requiredDocs,
      { document_name: "", description: "", notes: "", mandatory: true },
    ]);
  };

  const removeDocument = (idx: number) => {
    setRequiredDocs(requiredDocs.filter((_, i) => i !== idx));
  };

  const updateDocument = (idx: number, field: string, value: any) => {
    const updated = [...requiredDocs];
    (updated[idx] as any)[field] = value;
    setRequiredDocs(updated);
  };

  const handleFinalize = async () => {
    setError("");
    setSuccess("");

    const validDocs = requiredDocs.filter((d) => d.document_name.trim());
    if (validDocs.length === 0) {
      setError("At least one required document must be defined");
      return;
    }

    setSubmitting(true);
    try {
      await finalizeInsurancePolicy(policyId, validDocs);
      setSuccess("Policy successfully activated.");
      setTimeout(() => {
        router.push("/insurance/policies");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to finalize policy");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- LOADING ---------------- */

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <Loader2 className="h-14 w-14 animate-spin text-purple-600" />
        <p className="mt-4 text-lg font-medium text-gray-700">
          AI analyzing policy document...
        </p>
      </div>
    );

  if (!policy)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <AlertCircle className="h-14 w-14 text-red-500" />
        <p className="mt-4 text-lg font-semibold text-red-600">
          Policy not found.
        </p>
        <Button className="mt-4" onClick={() => router.push("/insurance/policies")}>
          Return to Policies
        </Button>
      </div>
    );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 py-12 overflow-hidden">

      {/* Decorative Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-200 rounded-full blur-3xl opacity-30" />

      <div className="container mx-auto max-w-6xl px-6 relative z-10">

        {/* Sticky Action Bar */}
        <div className="sticky top-0 backdrop-blur-md bg-white/70 border border-purple-100 shadow-md rounded-2xl px-8 py-6 mb-10 flex items-center justify-between transition-all">

          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
              <ShieldCheck className="h-8 w-8 text-purple-600" />
              Review Policy Requirements
            </h1>
            <p className="text-gray-500 mt-1">
              {policy.name}
            </p>
          </div>

          <Button
            onClick={handleFinalize}
            disabled={submitting}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Activating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Finalize & Activate
              </>
            )}
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-purple-50 border border-purple-200 text-purple-700 px-6 py-4 rounded-xl shadow-sm flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Main Card */}
        <Card className="rounded-3xl border border-purple-100 shadow-2xl backdrop-blur-lg bg-white/90 transition-all">
          <CardHeader className="bg-purple-50/70 border-b border-purple-100 rounded-t-3xl px-8 py-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-700 text-lg">
                <FileText className="h-5 w-5" />
                AI-Suggested Claim Requirements
              </div>
              <span className="bg-purple-100 text-purple-700 px-4 py-1 text-sm rounded-full font-semibold">
                {requiredDocs.length} Items
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="px-8 py-10 space-y-6">
            {requiredDocs.map((doc, idx) => (
              <div
                key={idx}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300"
              >
                <button
                  onClick={() => removeDocument(idx)}
                  className="absolute -top-3 -right-3 bg-red-100 text-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition border border-red-200 shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-gray-500">
                      Document Name *
                    </Label>
                    <Input
                      value={doc.document_name}
                      onChange={(e) =>
                        updateDocument(idx, "document_name", e.target.value)
                      }
                      className="mt-2 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div>
                    <Label className="text-xs uppercase tracking-wide text-gray-500">
                      Description
                    </Label>
                    <Input
                      value={doc.description}
                      onChange={(e) =>
                        updateDocument(idx, "description", e.target.value)
                      }
                      className="mt-2 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-between items-end gap-6">
                    <div className="flex-1">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">
                        Notes
                      </Label>
                      <Input
                        value={doc.notes}
                        onChange={(e) =>
                          updateDocument(idx, "notes", e.target.value)
                        }
                        className="mt-2 focus-visible:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 pb-2">
                      <input
                        type="checkbox"
                        checked={doc.mandatory}
                        onChange={(e) =>
                          updateDocument(idx, "mandatory", e.target.checked)
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                      />
                      <Label className="text-sm font-medium">
                        Mandatory
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addDocument}
              className="w-full py-8 border-dashed border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-600 rounded-2xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Custom Requirement
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
