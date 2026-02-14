"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function InsuranceView() {
    const [policies, setPolicies] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("policies");

    // Policy Form
    const [policyData, setPolicyData] = useState({
        name: "", coverage_details: "", required_documents: ""
    });

    // Link Hospital State
    const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
    const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [pRes, hRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/insurance/policies`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/insurance/hospitals`, { headers })
            ]);

            if (pRes.ok) setPolicies(await pRes.json());
            if (hRes.ok) setHospitals(await hRes.json());
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePolicy = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/insurance/policies`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...policyData,
                    required_documents: policyData.required_documents.split(",").map(s => s.trim())
                })
            });

            if (res.ok) {
                alert("Policy created!");
                setPolicyData({ name: "", coverage_details: "", required_documents: "" });
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error("Create Policy failed", error);
        }
    };

    const handleLinkHospitals = async () => {
        if (!selectedPolicy) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/insurance/policies/${selectedPolicy}/hospitals`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(selectedHospitals)
            });
            if (res.ok) {
                alert("Hospitals linked!");
                setSelectedPolicy(null);
                setSelectedHospitals([]);
                fetchData();
            }
        } catch (error) {
            console.error("Link failed", error);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Insurance Company Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4">Create Policy</h3>
                    <form onSubmit={handleCreatePolicy} className="space-y-4 bg-gray-50 p-6 rounded shadow">
                        <input placeholder="Policy Name" value={policyData.name} onChange={e => setPolicyData({ ...policyData, name: e.target.value })} className="w-full p-2 border rounded" required />
                        <textarea placeholder="Coverage Details" value={policyData.coverage_details} onChange={e => setPolicyData({ ...policyData, coverage_details: e.target.value })} className="w-full p-2 border rounded" required />
                        <input placeholder="Required Documents (comma separated)" value={policyData.required_documents} onChange={e => setPolicyData({ ...policyData, required_documents: e.target.value })} className="w-full p-2 border rounded" required />
                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Create Policy</button>
                    </form>
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-4">Your Policies</h3>
                    <div className="space-y-4">
                        {policies.map((p: any) => (
                            <div key={p._id || p.id} className="p-4 border rounded shadow bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{p.name}</p>
                                        <p className="text-sm text-gray-600">{p.coverage_details}</p>
                                        <p className="text-xs text-gray-500 mt-1">Linked Hospitals: {p.eligible_hospital_ids?.length || 0}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedPolicy(p._id || p.id);
                                            setSelectedHospitals(p.eligible_hospital_ids || []);
                                        }}
                                        className="text-blue-600 text-sm hover:underline"
                                    >
                                        Manage Links
                                    </button>
                                </div>

                                {selectedPolicy === (p._id || p.id) && (
                                    <div className="mt-4 p-2 bg-gray-50 rounded border">
                                        <h4 className="font-semibold text-sm mb-2">Link Hospitals using ID</h4>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {hospitals.map((h: any) => (
                                                <label key={h._id || h.id} className="flex items-center space-x-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedHospitals.includes(h._id || h.id)}
                                                        onChange={e => {
                                                            const hid = h._id || h.id;
                                                            if (e.target.checked) setSelectedHospitals([...selectedHospitals, hid]);
                                                            else setSelectedHospitals(selectedHospitals.filter(id => id !== hid));
                                                        }}
                                                    />
                                                    <span>{h.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="mt-2 flex space-x-2">
                                            <button onClick={handleLinkHospitals} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                                            <button onClick={() => setSelectedPolicy(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
