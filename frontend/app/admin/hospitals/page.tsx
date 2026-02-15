"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Hospital {
    id: string;
    name: string;
    address: string;
    contact_info: string;
}

export default function AdminHospitalsPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        contact_info: "",
        admin_username: "",
        admin_name: "",
        admin_password: ""
    });

    const fetchHospitals = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/hospitals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHospitals(data);
            }
        } catch (error) {
            console.error("Failed to fetch hospitals", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/hospitals`, {
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
                    address: "",
                    contact_info: "",
                    admin_username: "",
                    admin_name: "",
                    admin_password: ""
                });
                fetchHospitals();
            } else {
                alert("Failed to create hospital. Check inputs.");
            }
        } catch (error) {
            console.error("Error creating hospital", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/hospitals/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                fetchHospitals();
            }
        } catch (error) {
            console.error("Error deleting hospital", error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Manage Hospitals</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Add Hospital</>}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Hospital</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Hospital Name</Label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
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

                            <Button type="submit" className="w-full">Create Hospital</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {hospitals.map(hospital => (
                        <Card key={hospital.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold">{hospital.name}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(hospital.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">{hospital.address}</p>
                                <p className="text-sm text-gray-500 mt-1">{hospital.contact_info}</p>
                            </CardContent>
                        </Card>
                    ))}
                    {hospitals.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10">No hospitals found.</p>}
                </div>
            )}
        </div>
    );
}
