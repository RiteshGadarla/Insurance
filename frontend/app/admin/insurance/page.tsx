"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface InsuranceCompany {
    id: string;
    name: string;
    contact_info: string;
}

export default function AdminInsurancePage() {
    const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        contact_info: "",
        admin_username: "",
        admin_name: "",
        admin_password: ""
    });

    const fetchCompanies = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/insurance-companies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch (error) {
            console.error("Failed to fetch companies", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/insurance-companies`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowForm(false);
                setFormData({
                    name: "",
                    contact_info: "",
                    admin_username: "",
                    admin_name: "",
                    admin_password: ""
                });
                fetchCompanies();
            } else {
                alert("Failed to create company. Check inputs.");
            }
        } catch (error) {
            console.error("Error creating company", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/insurance-companies/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                fetchCompanies();
            }
        } catch (error) {
            console.error("Error deleting company", error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Manage Insurance Companies</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Add Company</>}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Company</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Company Name</Label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Info</Label>
                                    <Input required value={formData.contact_info} onChange={e => setFormData({ ...formData, contact_info: e.target.value })} />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-semibold mb-2">Admin Account Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Admin Name</Label>
                                        <Input required value={formData.admin_name} onChange={e => setFormData({ ...formData, admin_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Username</Label>
                                        <Input required value={formData.admin_username} onChange={e => setFormData({ ...formData, admin_username: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password</Label>
                                        <Input required type="password" value={formData.admin_password} onChange={e => setFormData({ ...formData, admin_password: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full">Create Company</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {companies.map(company => (
                        <Card key={company.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold">{company.name}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">{company.contact_info}</p>
                            </CardContent>
                        </Card>
                    ))}
                    {companies.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10">No companies found.</p>}
                </div>
            )}
        </div>
    );
}
