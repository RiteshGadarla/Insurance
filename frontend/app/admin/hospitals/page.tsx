"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Trash2,
  Building2,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface Hospital {
  _id: string;
  name: string;
  address: string;
  contact_info: string;
}

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_info: "",
    admin_username: "",
    admin_name: "",
    admin_password: ""
  });

  // ================= FETCH =================
  const fetchHospitals = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API}/admin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      console.log("Fetched hospitals:", data);

      if (Array.isArray(data)) {
        setHospitals(data);
      } else {
        setHospitals([]);
      }
    } catch (err) {
      setError("Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  // ================= CREATE =================
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API}/admin/hospitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error();

      setSuccess("Hospital created successfully!");
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
    } catch {
      setError("Failed to create hospital");
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    console.log("Deleting hospital ID:", id);

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API}/admin/hospitals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Delete error:", errText);
        throw new Error();
      }

      setSuccess("Hospital deleted successfully!");
      fetchHospitals();
    } catch {
      setError("Failed to delete hospital");
    } finally {
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  return (
    <div className="space-y-6 w-full px-6 pt-10 pb-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Manage Hospitals</h1>
          <p className="text-slate-600">Add, view and manage hospital accounts</p>
        </div>

        <Button 
          onClick={() => {
            setShowForm(!showForm);
            setError("");
            setSuccess("");
          }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 whitespace-nowrap ml-4"
        >
          {showForm ? "Cancel" : (
            <>
              <Plus className="mr-2 h-5 w-5" />
              Add Hospital
            </>
          )}
        </Button>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 flex gap-3 items-start animate-slide-in-up">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-900">{success}</p>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4 flex gap-3 items-start animate-slide-in-up">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-900">{error}</p>
          </div>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <Card className="border-0 shadow-lg bg-white animate-slide-in-up">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <CardTitle className="text-2xl text-slate-900">Add New Hospital</CardTitle>
            <p className="text-sm text-slate-600 mt-1">Enter hospital details and create an admin account</p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-900">Hospital Name</Label>
                <Input 
                  required 
                  placeholder="e.g., City Medical Center"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-900">Address</Label>
                <Input 
                  required 
                  placeholder="e.g., 123 Main Street, City"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-900">Contact Information</Label>
                <Input 
                  required 
                  placeholder="e.g., +1-555-0123 or email@hospital.com"
                  value={formData.contact_info}
                  onChange={e => setFormData({...formData, contact_info: e.target.value})}
                  className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="h-px bg-gradient-to-r from-emerald-200 to-transparent my-6"></div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-900">Admin Full Name</Label>
                <Input 
                  required 
                  placeholder="e.g., John Smith"
                  value={formData.admin_name}
                  onChange={e => setFormData({...formData, admin_name: e.target.value})}
                  className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-900">Username</Label>
                <Input 
                  required 
                  placeholder="e.g., jsmith"
                  value={formData.admin_username}
                  onChange={e => setFormData({...formData, admin_username: e.target.value})}
                  className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-900">Password</Label>
                <Input 
                  required 
                  type="password" 
                  placeholder="Create a strong password"
                  value={formData.admin_password}
                  onChange={e => setFormData({...formData, admin_password: e.target.value})}
                  className="border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <Button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 mt-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Hospital"
                )}
              </Button>

            </form>
          </CardContent>
        </Card>
      )}

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading hospitals...</p>
          </div>
        </div>
      ) : hospitals.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-lg p-12 text-center">
          <Building2 className="h-12 w-12 text-blue-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Hospitals Found</h3>
          <p className="text-slate-600 mb-6">Get started by adding your first hospital</p>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-6 py-2 rounded-lg"
          >
            <Plus className="mr-2 h-4 w-4" /> Add First Hospital
          </Button>
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
            {hospitals.map((h, index) => (
              <div
                key={h._id}
                style={{ animation: `slideInUp 0.6s ease-out ${index * 0.1}s both` }}
              >
                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white group h-full">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-slate-900 break-words">{h.name}</CardTitle>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(h._id, h.name)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-700 flex-shrink-0"
                        title="Delete hospital"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700 break-words">{h.address || "No address"}</p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Phone className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700 break-words">{h.contact_info || "No contact"}</p>
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