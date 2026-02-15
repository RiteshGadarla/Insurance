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

export async function createInsurancePolicy(name: string, file: File) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/insurance/policies`, {
        method: "POST",
        headers,
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create policy");
    }
    return res.json();
}

export async function finalizeInsurancePolicy(policyId: string, requiredDocuments: { document_name: string; description: string; notes?: string; mandatory: boolean }[]) {
    const res = await fetch(`${API_URL}/insurance/policies/${policyId}/finalize`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(requiredDocuments),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to finalize policy");
    }
    return res.json();
}

export async function fetchInsurancePolicies() {
    const res = await fetch(`${API_URL}/insurance/policies`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch policies");
    return res.json();
}

export async function fetchPolicyById(policyId: string) {
    const res = await fetch(`${API_URL}/policies/${policyId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch policy");
    return res.json();
}

export async function linkHospitalsToCompany(hospitalIds: string[]) {
    const res = await fetch(`${API_URL}/insurance/hospitals/link`, {
        method: "POST",
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

export async function fetchMyCompany() {
    const res = await fetch(`${API_URL}/insurance/my-company`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch company info");
    return res.json();
}

// ─── Hospital ────────────────────────────────────────────────────────────────

export async function createHospitalPolicy(name: string, file: File) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/hospital/policies`, {
        method: "POST",
        headers,
        body: formData,
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

export async function finalizeHospitalPolicy(policyId: string, requiredDocuments: { document_name: string; description: string; notes?: string; mandatory: boolean }[]) {
    const res = await fetch(`${API_URL}/hospital/policies/${policyId}/finalize`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(requiredDocuments),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to finalize policy");
    }
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
