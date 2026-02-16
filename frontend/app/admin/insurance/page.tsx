"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, ShieldCheck, Phone, AlertCircle, CheckCircle2 } from "lucide-react";

interface Company {
    _id?: string;
    id?: string;
    name: string;
    contact_info: string;
    admin_user_id?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminInsuranceCompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [createLoading, setCreateLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    const [form, setForm] = useState({
        name: "",
        contact_info: "",
        admin_username: "",
        admin_email: "",
        admin_name: "",
        admin_password: "",
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
                setMessageType("success");
                setMessage("Insurance company created successfully!");
                setForm({ name: "", contact_info: "", admin_username: "", admin_email: "", admin_name: "", admin_password: "" });
                setShowForm(false);
                
                const list = await fetch(`${API}/admin/insurance-companies`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
                setCompanies(list);
                
                setTimeout(() => setMessage(""), 3000);
            } else {
                const data = await res.json();
                setMessageType("error");
                setMessage(data.detail || "Failed to create insurance company. Please check inputs.");
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (error) {
            console.error("Error creating company", error);
            setMessageType("error");
            setMessage("An error occurred while creating the insurance company.");
            setTimeout(() => setMessage(""), 3000);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
        
        const token = localStorage.getItem("token");
        console.log("Deleting company ID:", id);

        try {
            const res = await fetch(`${API}/admin/insurance-companies/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error("Delete error:", errText);
                setMessageType("error");
                setMessage("Failed to delete insurance company. Please try again.");
                setTimeout(() => setMessage(""), 3000);
                throw new Error();
            }

            setMessageType("success");
            setMessage("Insurance company deleted successfully!");
            setCompanies((prev) => prev.filter((c) => (c._id || c.id) !== id));
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Error deleting company:", error);
            if (!message) {
                setMessageType("error");
                setMessage("Error deleting insurance company.");
                setTimeout(() => setMessage(""), 3000);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading insurance companies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full pt-8 px-6">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Manage Insurance Companies</h1>
                    <p className="text-slate-600">Add, view, and manage all insurance company accounts</p>
                </div>

                <Button 
                    onClick={() => {
                        setShowForm(!showForm);
                        setMessage("");
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 whitespace-nowrap ml-4"
                >
                    {showForm ? "Cancel" : (
                        <>
                            <Plus className="mr-2 h-5 w-5" />
                            Add Company
                        </>
                    )}
                </Button>
            </div>

            {/* SUCCESS MESSAGE */}
            {message && messageType === "success" && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 flex gap-3 items-start animate-slide-in-up">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-green-900">{message}</p>
                    </div>
                </div>
            )}

            {/* ERROR MESSAGE */}
            {message && messageType === "error" && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4 flex gap-3 items-start animate-slide-in-up">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-red-900">{message}</p>
                    </div>
                </div>
            )}

            {/* FORM */}
            {showForm && (
                <Card className="border-0 shadow-lg bg-white animate-slide-in-up">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                        <CardTitle className="text-2xl text-slate-900">Add New Insurance Company</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">Enter company details and create an admin account</p>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <form onSubmit={handleCreate} className="space-y-6">

                            {/* Company Details */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                    Company Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-900">Company Name</Label>
                                        <Input 
                                            required 
                                            placeholder="e.g., Global Health Insurance"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-900">Contact Information</Label>
                                        <Input 
                                            required 
                                            placeholder="e.g., +1-555-0123 or email@insurance.com"
                                            value={form.contact_info}
                                            onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gradient-to-r from-emerald-200 to-transparent"></div>

                            {/* Admin Account Details */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-teal-600" />
                                    Admin Account Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-900">Admin Full Name</Label>
                                        <Input 
                                            required 
                                            placeholder="e.g., Jane Doe"
                                            value={form.admin_name}
                                            onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-900">Username</Label>
                                        <Input 
                                            required 
                                            placeholder="e.g., jdoe"
                                            value={form.admin_username}
                                            onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-900">Email (Optional)</Label>
                                        <Input 
                                            type="email"
                                            placeholder="e.g., jane@insurance.com"
                                            value={form.admin_email}
                                            onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-900">Password</Label>
                                        <Input 
                                            required 
                                            type="password" 
                                            placeholder="Create a strong password"
                                            value={form.admin_password}
                                            onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                                            className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                disabled={createLoading}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 mt-6"
                            >
                                {createLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Company"
                                )}
                            </Button>

                        </form>
                    </CardContent>
                </Card>
            )}

            {/* LIST */}
            {companies.length === 0 ? (
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-lg p-12 text-center">
                    <ShieldCheck className="h-12 w-12 text-blue-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Insurance Companies Found</h3>
                    <p className="text-slate-600 mb-6">Get started by adding your first insurance company</p>
                    <Button 
                        onClick={() => setShowForm(true)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-6 py-2 rounded-lg"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add First Company
                    </Button>
                </div>
            ) : (
                <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                        {companies.map((company, index) => (
                            <div
                                key={company._id || company.id}
                                style={{ animation: `slideInUp 0.6s ease-out ${index * 0.1}s both` }}
                            >
                                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group h-full">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                                                    <ShieldCheck className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-lg font-bold text-slate-900 break-words">{company.name}</CardTitle>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(company._id || company.id!, company.name)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-700 flex-shrink-0"
                                                title="Delete company"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                            <Phone className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-slate-700 break-words">{company.contact_info}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

        </div>
    );
}