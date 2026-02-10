const API_URL = "http://localhost:8000";

export async function fetchPolicies() {
    const res = await fetch(`${API_URL}/policies/`);
    if (!res.ok) throw new Error("Failed to fetch policies");
    return res.json();
}

export async function createPolicy(policy: any) {
    const res = await fetch(`${API_URL}/policies/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
    });
    if (!res.ok) throw new Error("Failed to create policy");
    return res.json();
}

export async function createClaim(claim: any) {
    const res = await fetch(`${API_URL}/claims/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claim),
    });
    if (!res.ok) throw new Error("Failed to create claim");
    return res.json();
}

export async function getClaims() {
    const res = await fetch(`${API_URL}/claims/`);
    if (!res.ok) throw new Error("Failed to fetch claims");
    return res.json();
}

export async function getClaim(id: string) {
    const res = await fetch(`${API_URL}/claims/${id}`);
    if (!res.ok) throw new Error("Failed to fetch claim");
    return res.json();
}

export async function uploadDocument(claimId: string, file: File, type: string) {
    const formData = new FormData();
    formData.append("file", file);
    // Passing type as query param or part of form-data? 
    // Backend expects: claim_id (path), type (query), file (form)
    const res = await fetch(`${API_URL}/claims/${claimId}/documents?type=${encodeURIComponent(type)}`, {
        method: "POST",
        body: formData,
        // Content-Type header is set automatically with boundary for FormData
    });
    if (!res.ok) throw new Error("Failed to upload document");
    return res.json();
}

export async function createPolicyWithFile(policy: any, file: File | null) {
    const formData = new FormData();
    formData.append("name", policy.name);
    formData.append("insurer", policy.insurer);
    formData.append("required_documents", policy.required_documents.join(","));
    if (policy.notes) formData.append("notes", policy.notes);
    if (file) formData.append("file", file);

    const res = await fetch(`${API_URL}/policies/with-file`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to create policy");
    return res.json();
}

export async function verifyClaim(claimId: string) {
    const res = await fetch(`${API_URL}/claims/${claimId}/verify`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to verify claim");
    return res.json();
}
