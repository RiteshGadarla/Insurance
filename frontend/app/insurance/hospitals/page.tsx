"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Building2, MapPin, Phone } from "lucide-react";

// Fallback if Table components don't exist in existing project, but likely do or I can use divs.
// Step 88 showed Badge, Button, Card, Input, Label, Select, Textarea. No Table.
// So I will use Cards or Divs.

export default function InsuranceHospitalsPage() {
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHospitals = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/insurance/hospitals`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setHospitals(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch hospitals", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHospitals();
    }, []);

    if (loading) return <div className="p-10">Loading hospitals...</div>;

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Registered Hospitals</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {hospitals.map((hospital) => (
                    <Card key={hospital.id || hospital._id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold">{hospital.name}</CardTitle>
                            <Building2 className="h-5 w-5 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MapPin className="h-4 w-4" />
                                <span>{hospital.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{hospital.contact_info}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {hospitals.length === 0 && <div className="text-gray-500 col-span-full text-center py-10">No hospitals found.</div>}
            </div>
        </div>
    );
}
