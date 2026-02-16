"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Link2, Link2Off, Search, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetchAllHospitals, linkHospitalsToCompany, fetchMyCompany } from "@/lib/api";

export default function InsuranceHospitalsPage() {
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [linkedIds, setLinkedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const [all, company] = await Promise.all([
                    fetchAllHospitals(),
                    fetchMyCompany()
                ]);
                setHospitals(all);
                setLinkedIds(company.connected_hospital_ids || []);
            } catch (err) {
                console.error("Failed to load hospitals", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const toggleLink = (id: string) => {
        setLinkedIds(prev =>
            prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]
        );
        setSuccess("");
    };

    const handleSaveLinks = async () => {
        setSubmitting(true);
        try {
            await linkHospitalsToCompany(linkedIds);
            setSuccess("Hospital network updated successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Failed to save links", err);
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = hospitals.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center">Loading hospitals...</div>;

    return (
        <div className="container mx-auto py-8 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-purple-700">
                        Hospital Network Management
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Link hospitals to your network to allow them to process claims for your policies.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search hospitals..."
                            className="pl-9 focus-visible:ring-purple-500"
                        />
                    </div>

                    <Button
                        onClick={handleSaveLinks}
                        disabled={submitting}
                        className="bg-purple-600 hover:bg-purple-700 text-white gap-2 min-w-[160px]"
                    >
                        {submitting ? "Saving..." : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Save Network
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {success && (
                <div className="mb-6 bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="h-5 w-5" />
                    {success}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((hospital) => {
                    const id = hospital.id || hospital._id;
                    const isLinked = linkedIds.includes(id);

                    return (
                        <Card
                            key={id}
                            className={`transition-all duration-200 ${
                                isLinked ? 'border-purple-200 bg-purple-50/30' : ''
                            }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-white rounded-lg border shadow-sm">
                                        <Building2
                                            className={`h-6 w-6 ${
                                                isLinked ? 'text-purple-600' : 'text-gray-400'
                                            }`}
                                        />
                                    </div>

                                    <Badge
                                        variant={isLinked ? "default" : "secondary"}
                                        className={isLinked ? "bg-purple-600" : ""}
                                    >
                                        {isLinked ? "Connected" : "Not Linked"}
                                    </Badge>
                                </div>

                                <CardTitle className="mt-4 text-xl">
                                    {hospital.name}
                                </CardTitle>

                                <CardDescription className="line-clamp-1">
                                    {hospital.address}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-sm text-gray-500">
                                        <p className="font-medium text-gray-700">Contact</p>
                                        <p>{hospital.contact_info}</p>
                                    </div>

                                    <Button
                                        variant={isLinked ? "outline" : "default"}
                                        className={`w-full gap-2 ${
                                            !isLinked
                                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                : 'text-purple-600 border-purple-200 hover:bg-purple-50'
                                        }`}
                                        onClick={() => toggleLink(id)}
                                    >
                                        {isLinked ? (
                                            <>
                                                <Link2Off className="h-4 w-4" />
                                                Unlink from Network
                                            </>
                                        ) : (
                                            <>
                                                <Link2 className="h-4 w-4" />
                                                Add to Network
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 bg-purple-50 rounded-xl border-2 border-dashed border-purple-200">
                    <Building2 className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-purple-800">
                        No hospitals found
                    </h3>
                    <p className="text-purple-500">
                        Try adjusting your search criteria
                    </p>
                </div>
            )}
        </div>
    );
}
