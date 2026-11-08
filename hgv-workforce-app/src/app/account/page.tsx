"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Shield,
  CheckCircle2,
  XCircle,
  Key,
  Building,
  Calendar,
  Lock,
  ArrowRight,
  LogOut,
} from "lucide-react";

export default function MyAccountPage() {
  const { user, permissions, switchRole } = useAuth();

  const permissionItems = [
    { label: "Maintain Workforce Master Data", allowed: permissions?.canEditWorkforce },
    { label: "Maintain Compensation Records", allowed: permissions?.canEditCompensation },
    { label: "Configure Billing & FX Multipliers", allowed: permissions?.canEditBillingConfig },
    { label: "Ingest CSV Bulk Uploads", allowed: permissions?.canUploadCsv },
    { label: "Inspect Compliance Audit Trail", allowed: permissions?.canViewAudit },
    { label: "Manage User Accounts & Roles", allowed: permissions?.canManageUsers },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs crumbs={[{ label: "My Account" }]} />

      {/* Header Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-hgv-navy text-white text-xl font-bold flex items-center justify-center shrink-0 shadow-sm">
              {user?.displayName ? user.displayName.split(" ").map((n) => n[0]).join("") : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-hgv-navy">{user?.displayName || "User Profile"}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {user?.status || "ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-slate-400">Assigned Persona:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-hgv-navy/10 text-hgv-navy border border-hgv-navy/20">
                  {user?.roleName || "Loading..."}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 text-hgv-coral hover:bg-red-50 text-xs font-semibold transition self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>

      {/* Role Switching / Testing Utility Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-2">
            <Shield className="w-4 h-4 text-hgv-teal" />
            Persona Switching (Development & UAT Evaluation)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Easily test application behaviors across the 3 standard enterprise personas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => switchRole("HR_MANAGER")}
            className={`p-3.5 rounded-xl border text-left transition ${
              user?.roleCode === "HR_MANAGER"
                ? "border-hgv-navy bg-hgv-navy/5 shadow-2xs"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="font-bold text-xs text-hgv-navy">HR Manager</p>
            <p className="text-[11px] text-slate-500 mt-1">Full master data, billing config & admin</p>
          </button>

          <button
            onClick={() => switchRole("HR_TEAM_MEMBER")}
            className={`p-3.5 rounded-xl border text-left transition ${
              user?.roleCode === "HR_TEAM_MEMBER"
                ? "border-emerald-600 bg-emerald-50/50 shadow-2xs"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="font-bold text-xs text-emerald-800">HR Team Member</p>
            <p className="text-[11px] text-slate-500 mt-1">Workforce & compensation; no config edit</p>
          </button>

          <button
            onClick={() => switchRole("GCC_LEAD")}
            className={`p-3.5 rounded-xl border text-left transition ${
              user?.roleCode === "GCC_LEAD"
                ? "border-indigo-600 bg-indigo-50/50 shadow-2xs"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="font-bold text-xs text-indigo-900">GCC Lead</p>
            <p className="text-[11px] text-slate-500 mt-1">Executive read-only reports & dashboards</p>
          </button>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-hgv-teal" />
          Active Persona Permission Privileges
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {permissionItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50"
            >
              <span className="font-medium text-slate-700">{item.label}</span>
              {item.allowed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Granted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                  Denied
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Organization & Environment Meta */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-3 mb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-hgv-teal" />
          Hilton Grand Vacations Infrastructure & Tenant Details
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Platform</span>
            <span className="font-semibold text-slate-800">HGV GCC Workforce</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">GCC Location</span>
            <span className="font-semibold text-slate-800">Hyderabad Hub</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Primary Currency</span>
            <span className="font-semibold text-slate-800">INR / USD Billed</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Data Residency</span>
            <span className="font-semibold text-slate-800">India / Enterprise Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
