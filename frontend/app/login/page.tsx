"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Login failed");
            }

            // Store token and user details
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("name", data.name);
            localStorage.setItem("user_id", data.id);

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center px-6 relative overflow-hidden">
            <style jsx global>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slide-in-up {
                    animation: slideInUp 0.6s ease-out;
                }
                @keyframes shimmer {
                    0% {
                        background-position: -1000px 0;
                    }
                    100% {
                        background-position: 1000px 0;
                    }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>

            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-40 right-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
            </div>

            {/* Content */}
            <div className="w-full max-w-md relative z-10">

                {/* Login Card */}
                <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-8 py-10 text-center">
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-blue-100 text-sm">Sign in to your account to continue</p>
                        </div>

                        {/* Card Body */}
                        <div className="p-8">
                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3 animate-slide-in-up">
                                    <div className="flex-shrink-0">
                                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-red-800">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleLogin} className="space-y-5">
                                {/* Username Field */}
                                <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Enter your username"
                                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Sign In Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-600/40 transition transform hover:-translate-y-1 duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:-translate-y-0 flex justify-center items-center gap-2 mt-6 animate-slide-in-up"
                                    style={{ animationDelay: '0.4s' }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="text-center mt-6 animate-slide-in-up" style={{ animationDelay: '0.7s' }}>
                        <p className="text-sm text-slate-600">
                            Secure login powered by <span className="font-semibold text-blue-600">ClaimVerify AI</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}