"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

interface Hospital {
    _id?: string;
    id?: string;
    name: string;
    address: string;
    contact_info: string;
    admin_user_id: string;
}

interface InsuranceCompany {
    _id?: string;
    id?: string;
    name: string;
    contact_info: string;
    admin_user_id: string;
}

export default function AdminView() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("hospitals");

    // Form states
    const [hospitalForm, setHospitalForm] = useState({
        name: "", address: "", contact_info: "", admin_username: "", admin_email: "", admin_name: "", admin_password: ""
    });
    const [companyForm, setCompanyForm] = useState({
        name: "", contact_info: "", admin_username: "", admin_email: "", admin_name: "", admin_password: ""
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const hRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/hospitals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const cRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/insurance-companies`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (hRes.ok) setHospitals(await hRes.json());
            if (cRes.ok) setCompanies(await cRes.json());
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHospital = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        setMessage("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/hospitals`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(hospitalForm)
            });
            if (res.ok) {
                setMessage("Hospital created successfully!");
                setHospitalForm({ name: "", address: "", contact_info: "", admin_username: "", admin_email: "", admin_name: "", admin_password: "" });
                fetchData();
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.detail}`);
            }
        } catch (err) {
            setMessage("Failed to create hospital.");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        setMessage("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/insurance-companies`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(companyForm)
            });
            if (res.ok) {
                setMessage("Insurance Company created successfully!");
                setCompanyForm({ name: "", contact_info: "", admin_username: "", admin_email: "", admin_name: "", admin_password: "" });
                fetchData();
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.detail}`);
            }
        } catch (err) {
            setMessage("Failed to create company.");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDelete = async (type: 'hospital' | 'company', id: string) => {
        if (!confirm("Are you sure?")) return;

        const endpoint = type === 'hospital' ? `/admin/hospitals/${id}` : `/admin/insurance-companies/${id}`;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${endpoint}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchData();
            else alert("Failed to delete");
        } catch (err) {
            alert("Error deleting");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

            <div className="flex space-x-4 mb-6 border-b">
                <button
                    className={`pb-2 ${activeTab === "hospitals" ? "border-b-2 border-blue-600 font-bold" : ""}`}
                    onClick={() => setActiveTab("hospitals")}
                >
                    Hospitals
                </button>
                <button
                    className={`pb-2 ${activeTab === "companies" ? "border-b-2 border-blue-600 font-bold" : ""}`}
                    onClick={() => setActiveTab("companies")}
                >
                    Insurance Companies
                </button>
            </div>

            {message && <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">{message}</div>}

            {activeTab === "hospitals" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-semibold mb-3">Add Hospital</h3>
                        <form onSubmit={handleCreateHospital} className="space-y-3 bg-white p-4 rounded shadow">
                            <input placeholder="Hospital Name" className="w-full border p-2 rounded" value={hospitalForm.name} onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })} required />
                            <input placeholder="Address" className="w-full border p-2 rounded" value={hospitalForm.address} onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })} required />
                            <input placeholder="Contact Info" className="w-full border p-2 rounded" value={hospitalForm.contact_info} onChange={e => setHospitalForm({ ...hospitalForm, contact_info: e.target.value })} required />
                            <div className="border-t pt-2 mt-2">
                                <h4 className="text-sm font-bold mb-2">Admin User Details</h4>
                                <input placeholder="Admin Username" className="w-full border p-2 rounded mb-2" value={hospitalForm.admin_username} onChange={e => setHospitalForm({ ...hospitalForm, admin_username: e.target.value })} required />
                                <input placeholder="Admin Email (Optional)" className="w-full border p-2 rounded mb-2" value={hospitalForm.admin_email} onChange={e => setHospitalForm({ ...hospitalForm, admin_email: e.target.value })} />
                                <input placeholder="Admin Name" className="w-full border p-2 rounded mb-2" value={hospitalForm.admin_name} onChange={e => setHospitalForm({ ...hospitalForm, admin_name: e.target.value })} required />
                                <input type="password" placeholder="Admin Password" className="w-full border p-2 rounded mb-2" value={hospitalForm.admin_password} onChange={e => setHospitalForm({ ...hospitalForm, admin_password: e.target.value })} required />
                            </div>
                            <button disabled={createLoading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                                {createLoading ? <Loader2 className="animate-spin inline" /> : "Create Hospital"}
                            </button>
                        </form>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-3">Existing Hospitals</h3>
                        <ul className="space-y-2">
                            {hospitals.map(h => (
                                <li key={h._id || h.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
                                    <div>
                                        <div className="font-bold">{h.name}</div>
                                        <div className="text-sm text-gray-500">{h.address}</div>
                                    </div>
                                    <button onClick={() => handleDelete('hospital', h._id || h.id!)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={18} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-semibold mb-3">Add Insurance Company</h3>
                        <form onSubmit={handleCreateCompany} className="space-y-3 bg-white p-4 rounded shadow">
                            <input placeholder="Company Name" className="w-full border p-2 rounded" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} required />
                            <input placeholder="Contact Info" className="w-full border p-2 rounded" value={companyForm.contact_info} onChange={e => setCompanyForm({ ...companyForm, contact_info: e.target.value })} required />
                            <div className="border-t pt-2 mt-2">
                                <h4 className="text-sm font-bold mb-2">Admin User Details</h4>
                                <input placeholder="Admin Username" className="w-full border p-2 rounded mb-2" value={companyForm.admin_username} onChange={e => setCompanyForm({ ...companyForm, admin_username: e.target.value })} required />
                                <input placeholder="Admin Email (Optional)" className="w-full border p-2 rounded mb-2" value={companyForm.admin_email} onChange={e => setCompanyForm({ ...companyForm, admin_email: e.target.value })} />
                                <input placeholder="Admin Name" className="w-full border p-2 rounded mb-2" value={companyForm.admin_name} onChange={e => setCompanyForm({ ...companyForm, admin_name: e.target.value })} required />
                                <input type="password" placeholder="Admin Password" className="w-full border p-2 rounded mb-2" value={companyForm.admin_password} onChange={e => setCompanyForm({ ...companyForm, admin_password: e.target.value })} required />
                            </div>
                            <button disabled={createLoading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                                {createLoading ? <Loader2 className="animate-spin inline" /> : "Create Company"}
                            </button>
                        </form>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-3">Existing Companies</h3>
                        <ul className="space-y-2">
                            {companies.map(c => (
                                <li key={c._id || c.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
                                    <div>
                                        <div className="font-bold">{c.name}</div>
                                        <div className="text-sm text-gray-500">{c.contact_info}</div>
                                    </div>
                                    <button onClick={() => handleDelete('company', c._id || c.id!)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={18} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
