const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

// ─── Generic Policies (legacy) ───────────────────────────────────────────────

export async function fetchPolicies() {
    const res = await fetch(`${API_URL}/policies/`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch policies");
    return res.json();
}

export async function createPolicy(policy: any) {
    const res = await fetch(`${API_URL}/policies/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(policy),
    });
    if (!res.ok) throw new Error("Failed to create policy");
    return res.json();
}

// ─── Insurance Company ──────────────────────────────────────────────────────

export async function createInsurancePolicy(data: {
    name: string;
    connected_hospital_ids: string[];
    required_documents: { document_name: string; description: string; notes?: string; mandatory: boolean }[];
    additional_notes?: string;
    policy_pdf_url?: string;
}) {
    const res = await fetch(`${API_URL}/insurance/policies`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create policy");
    }
    return res.json();
}

export async function fetchInsurancePolicies() {
    const res = await fetch(`${API_URL}/insurance/policies`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch policies");
    return res.json();
}

export async function updateInsurancePolicy(policyId: string, data: any) {
    const res = await fetch(`${API_URL}/insurance/policies/${policyId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update policy");
    }
    return res.json();
}

export async function linkHospitalsToPolicy(policyId: string, hospitalIds: string[]) {
    const res = await fetch(`${API_URL}/insurance/policies/${policyId}/hospitals`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(hospitalIds),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to link hospitals");
    }
    return res.json();
}

export async function fetchAllHospitals() {
    const res = await fetch(`${API_URL}/insurance/hospitals`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch hospitals");
    return res.json();
}

// ─── Hospital ────────────────────────────────────────────────────────────────

export async function createHospitalPolicy(data: {
    name: string;
    required_documents: { document_name: string; description: string; notes?: string; mandatory: boolean }[];
    additional_notes?: string;
    policy_pdf_url?: string;
}) {
    const res = await fetch(`${API_URL}/hospital/policies`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create policy");
    }
    return res.json();
}

export async function fetchHospitalPolicies() {
    const res = await fetch(`${API_URL}/hospital/policies`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch policies");
    return res.json();
}

export async function updateHospitalPolicy(policyId: string, data: any) {
    const res = await fetch(`${API_URL}/hospital/policies/${policyId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update policy");
    }
    return res.json();
}

// ─── Legacy (backward compat) ────────────────────────────────────────────────

export async function createPolicyWithFile(policy: any, file: File | null) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = new FormData();
    formData.append("name", policy.name);
    formData.append("insurer", policy.insurer);
    formData.append("required_documents", policy.required_documents.join(","));
    if (policy.notes) formData.append("notes", policy.notes);
    if (file) formData.append("file", file);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/policies/with-file`, {
        method: "POST",
        headers,
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to create policy");
    return res.json();
}

// ─── Claims ──────────────────────────────────────────────────────────────────

export async function createClaim(claim: any) {
    const res = await fetch(`${API_URL}/claims/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(claim),
    });
    if (!res.ok) throw new Error("Failed to create claim");
    return res.json();
}

export async function getClaims() {
    const res = await fetch(`${API_URL}/claims/`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch claims");
    return res.json();
}

export async function getClaim(id: string) {
    const res = await fetch(`${API_URL}/claims/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch claim");
    return res.json();
}

export async function uploadDocument(claimId: string, file: File, type: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/claims/${claimId}/documents?type=${encodeURIComponent(type)}`, {
        method: "POST",
        headers,
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload document");
    return res.json();
}

export async function verifyClaim(claimId: string) {
    const res = await fetch(`${API_URL}/claims/${claimId}/verify`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to verify claim");
    return res.json();
}
