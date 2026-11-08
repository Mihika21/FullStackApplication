"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, ArrowRight, Lock, Mail, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { switchRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleCode: "HR_MANAGER" | "HR_TEAM_MEMBER" | "GCC_LEAD") => {
    try {
      setLoading(true);
      setError(null);
      await switchRole(roleCode);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-hgv-navy px-8 py-8 text-center text-white relative">
          <div className="w-12 h-12 rounded-xl bg-hgv-teal text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow">
            HGV
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            GCC Workforce Platform
          </h2>
          <p className="text-xs text-hgv-sky/90 mt-1">
            Master Data & Configurable Billing Engine
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.jenkins@hgv.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40 focus:border-hgv-teal"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-hgv-teal hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40 focus:border-hgv-teal"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-hgv-navy hover:bg-hgv-navy-light text-white font-medium py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Role Demonstration
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("HR_MANAGER")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-hgv-teal hover:bg-slate-50 transition text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800">Sarah Jenkins</p>
                  <p className="text-[10px] text-slate-500">HR Manager (Full Admin Access)</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-hgv-navy text-white">
                  HR Manager
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("HR_TEAM_MEMBER")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-hgv-teal hover:bg-slate-50 transition text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800">Alex Rivera</p>
                  <p className="text-[10px] text-slate-500">HR Team Member (Operations & Uploads)</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-hgv-teal text-white">
                  Team Member
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("GCC_LEAD")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-hgv-teal hover:bg-slate-50 transition text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800">Jeff Chu</p>
                  <p className="text-[10px] text-slate-500">GCC Lead (Read-Only Oversight)</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                  GCC Lead
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
