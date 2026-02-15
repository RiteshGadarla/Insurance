"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

interface Company {
    _id?: string;
    id?: string;
    name: string;
    contact_info: string;
    admin_user_id: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminInsuranceCompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [createLoading, setCreateLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [form, setForm] = useState({
        name: "", contact_info: "",
        admin_username: "", admin_email: "", admin_name: "", admin_password: "",
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch(`${API}/admin/insurance-companies`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.ok ? r.json() : [])
            .then(setCompanies)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        setCreateLoading(true);
        setMessage("");
        try {
            const res = await fetch(`${API}/admin/insurance-companies`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setMessage("Insurance company created successfully.");
                setForm({ name: "", contact_info: "", admin_username: "", admin_email: "", admin_name: "", admin_password: "" });
                const list = await fetch(`${API}/admin/insurance-companies`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
                setCompanies(list);
            } else {
                const data = await res.json();
                setMessage(data.detail || "Error creating company.");
            }
        } catch {
            setMessage("Request failed.");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API}/admin/insurance-companies/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                setCompanies((prev) => prev.filter((c) => (c._id || c.id) !== id));
            } else {
                alert("Failed to delete");
            }
        } catch {
            alert("Error deleting");
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Manage Insurance Companies</h1>
            {message && <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded text-sm">{message}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Add Insurance Company</h2>
                    <form onSubmit={handleCreate} className="space-y-3">
                        <input placeholder="Company Name" className="w-full border p-2 rounded text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        <input placeholder="Contact Info" className="w-full border p-2 rounded text-sm" value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} required />
                        <div className="border-t pt-2 mt-2">
                            <p className="text-xs font-medium text-gray-500 mb-2">Admin user</p>
                            <input placeholder="Username" className="w-full border p-2 rounded text-sm mb-2" value={form.admin_username} onChange={(e) => setForm({ ...form, admin_username: e.target.value })} required />
                            <input placeholder="Email (optional)" type="email" className="w-full border p-2 rounded text-sm mb-2" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} />
                            <input placeholder="Name" className="w-full border p-2 rounded text-sm mb-2" value={form.admin_name} onChange={(e) => setForm({ ...form, admin_name: e.target.value })} required />
                            <input type="password" placeholder="Password" className="w-full border p-2 rounded text-sm" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} required />
                        </div>
                        <button type="submit" disabled={createLoading} className="w-full bg-black text-white p-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50">
                            {createLoading ? <Loader2 className="animate-spin inline h-4 w-4" /> : "Create Company"}
                        </button>
                    </form>
                </div>
                <div>
                    <h2 className="text-lg font-semibold mb-4">Insurance Companies</h2>
                    <ul className="space-y-2">
                        {companies.map((c) => (
                            <li key={c._id || c.id} className="bg-white p-3 rounded border flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{c.name}</div>
                                    <div className="text-xs text-gray-500">{c.contact_info}</div>
                                </div>
                                <button type="button" onClick={() => handleDelete(c._id || c.id!)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 size={18} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
