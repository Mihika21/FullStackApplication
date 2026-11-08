"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-hgv-navy text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">
            HGV
          </div>
          <h2 className="text-lg font-bold text-slate-800">Reset Your Password</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your corporate email address to receive password reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-800">Reset Link Sent</p>
            <p className="text-xs text-slate-500 mt-1">
              If an active account exists for <span className="font-semibold">{email}</span>, a reset link has been dispatched.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-hgv-teal font-semibold mt-5 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hgv.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40 focus:border-hgv-teal"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-hgv-navy hover:bg-hgv-navy-light text-white font-medium py-2.5 px-4 rounded-lg text-xs transition"
            >
              Send Password Reset Link
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-hgv-navy font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
