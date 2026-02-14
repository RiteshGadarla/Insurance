"use client";

import { useState, useEffect } from "react";
import { Loader2, Upload, FileText, Plus } from "lucide-react";

export default function HospitalView() {
    const [policies, setPolicies] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("files"); // files | upload | policies | create-policy

    // Upload Form
    const [uploadData, setUploadData] = useState({
        patient_name: "", age: "", diagnosis: "", policy_id: ""
    });
    const [file, setFile] = useState<File | null>(null);

    // Policy Form
    const [policyData, setPolicyData] = useState({
        name: "", coverage_details: "", required_documents: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [pRes, fRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hospital/policies`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hospital/files`, { headers })
            ]);

            if (pRes.ok) setPolicies(await pRes.json());
            if (fRes.ok) setFiles(await fRes.json());
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("Please select a file");

        const formData = new FormData();
        formData.append("patient_name", uploadData.patient_name);
        formData.append("age", uploadData.age);
        formData.append("diagnosis", uploadData.diagnosis);
        formData.append("policy_id", uploadData.policy_id);
        formData.append("file", file);

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hospital/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                alert("File uploaded!");
                setUploadData({ patient_name: "", age: "", diagnosis: "", policy_id: "" });
                setFile(null);
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error("Upload failed", error);
        }
    };

    const handleCreatePolicy = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hospital/policies`, {
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

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Hospital Dashboard</h2>

            <div className="flex space-x-4 border-b overflow-x-auto">
                {["files", "upload", "policies", "create-policy"].map(tab => (
                    <button key={tab}
                        className={`pb-2 px-4 capitalize whitespace-nowrap ${activeTab === tab ? "border-b-2 border-blue-600 font-bold" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.replace("-", " ")}
                    </button>
                ))}
            </div>

            <div>
                {activeTab === "files" && (
                    <div className="grid gap-4">
                        {files.map((f: any) => (
                            <div key={f._id || f.id} className="p-4 border rounded shadow bg-white">
                                <p className="font-bold">{f.patient_name} (Age: {f.age})</p>
                                <p className="text-sm">Diagnosis: {f.diagnosis}</p>
                                <p className="text-sm">Status: <span className="font-semibold text-blue-600">{f.status}</span></p>
                                {f.score && <p className="text-sm">Score: {f.score}</p>}
                            </div>
                        ))}
                        {files.length === 0 && <p>No files uploaded.</p>}
                    </div>
                )}

                {activeTab === "upload" && (
                    <form onSubmit={handleUpload} className="max-w-lg space-y-4 bg-gray-50 p-6 rounded shadow">
                        <input placeholder="Patient Name" value={uploadData.patient_name} onChange={e => setUploadData({ ...uploadData, patient_name: e.target.value })} className="w-full p-2 border rounded" required />
                        <input placeholder="Age" type="number" value={uploadData.age} onChange={e => setUploadData({ ...uploadData, age: e.target.value })} className="w-full p-2 border rounded" required />
                        <input placeholder="Diagnosis" value={uploadData.diagnosis} onChange={e => setUploadData({ ...uploadData, diagnosis: e.target.value })} className="w-full p-2 border rounded" required />
                        <select value={uploadData.policy_id} onChange={e => setUploadData({ ...uploadData, policy_id: e.target.value })} className="w-full p-2 border rounded" required>
                            <option value="">Select Policy</option>
                            {policies.map((p: any) => (
                                <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.insurer})</option>
                            ))}
                        </select>
                        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full p-2 border rounded" required />
                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Upload File</button>
                    </form>
                )}

                {activeTab === "policies" && (
                    <div className="grid gap-4">
                        {policies.map((p: any) => (
                            <div key={p._id || p.id} className="p-4 border rounded shadow bg-white">
                                <p className="font-bold">{p.name}</p>
                                <p className="text-sm text-gray-600">Insurer: {p.insurer}</p>
                                <p className="text-sm">{p.coverage_details}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "create-policy" && (
                    <form onSubmit={handleCreatePolicy} className="max-w-lg space-y-4 bg-gray-50 p-6 rounded shadow">
                        <input placeholder="Policy Name" value={policyData.name} onChange={e => setPolicyData({ ...policyData, name: e.target.value })} className="w-full p-2 border rounded" required />
                        <textarea placeholder="Coverage Details" value={policyData.coverage_details} onChange={e => setPolicyData({ ...policyData, coverage_details: e.target.value })} className="w-full p-2 border rounded" required />
                        <input placeholder="Required Documents (comma separated)" value={policyData.required_documents} onChange={e => setPolicyData({ ...policyData, required_documents: e.target.value })} className="w-full p-2 border rounded" required />
                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Create Custom Policy</button>
                    </form>
                )}
            </div>
        </div>
    );
}
