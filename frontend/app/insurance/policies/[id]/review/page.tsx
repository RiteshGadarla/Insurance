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
      setSuccess("Policy requirements confirmed and policy is now ACTIVE!");
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 bg-gradient-to-br from-purple-50 to-white">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <div className="text-xl font-semibold text-gray-700">
          AI is analyzing policy...
        </div>
        <p className="text-gray-500 text-sm">
          Extracting required claim documents.
        </p>
      </div>
    );

  /* ---------------- NOT FOUND ---------------- */

  if (!policy)
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 bg-gradient-to-br from-purple-50 to-white">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-xl font-semibold text-red-600">
          Policy not found.
        </div>
        <Button variant="outline" onClick={() => router.push("/insurance/policies")}>
          Return to Policies
        </Button>
      </div>
    );

  /* ---------------- MAIN PAGE ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 py-12">
      <div className="container mx-auto max-w-5xl px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 text-gray-800">
              <ShieldCheck className="h-9 w-9 text-purple-600" />
              Review Policy Requirements
            </h1>
            <p className="text-gray-500 mt-2">
              Policy:
              <span className="ml-2 font-semibold text-purple-700">
                {policy.name}
              </span>
            </p>
          </div>

          <Button
            onClick={handleFinalize}
            disabled={submitting}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white gap-2 h-12 px-8 shadow-lg hover:shadow-xl transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Finalize & Activate
              </>
            )}
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-purple-50 border border-purple-200 text-purple-700 px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Main Card */}
        <Card className="shadow-xl border border-purple-100 backdrop-blur-md bg-white/90 rounded-2xl">
          <CardHeader className="bg-purple-50/70 border-b border-purple-100 rounded-t-2xl">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
              <FileText className="h-5 w-5" />
              AI-Generated Document Suggestions
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Review and refine the required claim documents identified by AI.
            </p>
          </CardHeader>

          <CardContent className="pt-8">
            <div className="space-y-6">
              {requiredDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="group border border-gray-200 rounded-xl p-6 bg-white hover:shadow-md hover:border-purple-600 transition-all relative"
                >
                  <button
                    onClick={() => removeDocument(idx)}
                    className="absolute -top-3 -right-3 bg-red-100 text-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-red-200 shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        Description / Criteria
                      </Label>
                      <Input
                        value={doc.description}
                        onChange={(e) =>
                          updateDocument(idx, "description", e.target.value)
                        }
                        className="mt-2 focus-visible:ring-purple-500"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-end gap-6">
                      <div className="flex-1">
                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                          Notes for Hospital
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
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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
                className="w-full border-dashed border-2 py-10 text-gray-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all gap-2 rounded-xl"
              >
                <Plus className="h-5 w-5" />
                Add Custom Requirement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Summary */}
        <div className="mt-10 flex justify-between items-center bg-white shadow-sm p-6 rounded-2xl border border-purple-100">
          <div className="text-sm text-gray-600">
            <p>
              Total Requirements:
              <span className="ml-2 font-semibold text-purple-700">
                {requiredDocs.length}
              </span>
            </p>
            <p>
              Status:
              <span className="ml-2 capitalize font-semibold text-purple-600">
                {policy.status}
              </span>
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/insurance/policies")}
              className="hover:bg-purple-100 hover:text-purple-700"
            >
              Cancel
            </Button>

            <Button
              onClick={handleFinalize}
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 shadow-md"
            >
              Confirm & Activate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
