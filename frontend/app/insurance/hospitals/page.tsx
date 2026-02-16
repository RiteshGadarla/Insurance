"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Link2, Link2Off, Search, CheckCircle2, AlertCircle, MapPin, Phone } from "lucide-react";
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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading hospitals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 px-4 md:px-8 lg:px-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        Hospital Network Management
                    </h1>
                    <p className="text-slate-600">
                        Link hospitals to your network to allow them to process claims for your policies.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search hospitals..."
                            className="pl-10 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <Button
                        onClick={handleSaveLinks}
                        disabled={submitting}
                        className="gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 min-w-[160px]"
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Save Network
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Success Alert */}
            {success && (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 text-purple-700 px-6 py-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-md">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <p className="font-medium">{success}</p>
                </div>
            )}

            {/* Hospitals Grid */}
            {filtered.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((hospital, index) => {
                        const id = hospital.id || hospital._id;
                        const isLinked = linkedIds.includes(id);

                        return (
                            <div
                                key={id}
                                style={{ animation: `slideInUp 0.6s ease-out ${index * 0.1}s both` }}
                            >
                                <Card
                                    className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col ${
                                        isLinked 
                                            ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200' 
                                            : 'bg-white'
                                    }`}
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg shadow-md">
                                                <Building2 className="h-6 w-6 text-white" />
                                            </div>

                                            <Badge
                                                className={`text-xs font-semibold ${
                                                    isLinked 
                                                        ? 'bg-purple-600 text-white' 
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {isLinked ? "✓ Connected" : "Not Linked"}
                                            </Badge>
                                        </div>

                                        <CardTitle className="mt-4 text-xl text-slate-900">
                                            {hospital.name}
                                        </CardTitle>

                                        <CardDescription className="flex items-center gap-2 mt-2 text-slate-600">
                                            <MapPin className="h-4 w-4 flex-shrink-0" />
                                            <span className="line-clamp-1">{hospital.address}</span>
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 flex flex-col gap-4">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                                <Phone className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-600">Contact</p>
                                                    <p className="text-sm text-slate-900 font-medium">{hospital.contact_info}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            className={`w-full gap-2 font-semibold transition-all duration-300 rounded-lg ${
                                                isLinked
                                                    ? 'bg-white text-purple-600 border-2 border-purple-300 hover:bg-purple-100'
                                                    : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-md hover:shadow-lg'
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
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-dashed border-purple-300 shadow-sm">
                    <Building2 className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-purple-900 mb-2">
                        No hospitals found
                    </h3>
                    <p className="text-purple-700 text-sm">
                        Try adjusting your search criteria to find hospitals in your network
                    </p>
                </div>
            )}

            {/* Summary Card */}
            <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50 to-purple-100">
                <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-600 font-semibold">Hospitals Connected</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">{linkedIds.length} / {hospitals.length}</p>
                    </div>
                    <p className="text-sm text-slate-600 text-center sm:text-right max-w-xs">
                        {linkedIds.length === 0 
                            ? "Start adding hospitals to build your network"
                            : linkedIds.length === hospitals.length
                            ? "All hospitals are connected to your network!"
                            : `${hospitals.length - linkedIds.length} more hospitals available to connect`
                        }
                    </p>
                </CardContent>
            </Card>

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