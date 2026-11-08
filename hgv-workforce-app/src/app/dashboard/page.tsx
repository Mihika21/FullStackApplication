"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  DollarSign,
  TrendingUp,
  Building2,
  AlertTriangle,
  UploadCloud,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user, permissions } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingMonth, setBillingMonth] = useState("2026-08");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/dashboard?month=${billingMonth}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [billingMonth]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  const { headcount, billing, attentionItems = [], recentUploads = [], recentAudits = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Workforce master data, compensation, deterministic billing, and operational activity at a glance.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Billing Period:</span>
          <select
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
            className="text-xs font-semibold text-hgv-navy bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option value="2026-08">August 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-12">December 2026</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Headcount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Workforce</span>
            <div className="w-8 h-8 rounded-lg bg-hgv-sky/30 flex items-center justify-center text-hgv-navy">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-hgv-navy">{headcount?.active || 0}</span>
            <span className="text-xs text-slate-400 ml-2">/ {headcount?.total || 0} Total</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {headcount?.inactive || 0} historical / attrition records retained
          </p>
        </div>

        {/* Card 2: Total Calculated Monthly Billing */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Monthly Billing ({billingMonth})</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-hgv-navy">
              ${billing?.totalMonthlyBillingUsd?.toLocaleString() || 0}
            </span>
            <span className="text-[11px] text-slate-400 ml-1">USD</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Run rate: ${billing?.annualRunRateUsd?.toLocaleString()} USD/yr
          </p>
        </div>

        {/* Card 3: GCC Presence */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">GCC Presence</span>
            <div className="w-8 h-8 rounded-lg bg-hgv-teal/15 flex items-center justify-center text-hgv-teal">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-hgv-navy">
              {headcount?.active ? Math.round((headcount.gccPresenceCount / headcount.active) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400 ml-2">
              ({headcount?.gccPresenceCount || 0} employees)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Direct GCC dedicated staffing</p>
        </div>

        {/* Card 4: Billing Config Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Billing Config</span>
            <div className="w-8 h-8 rounded-lg bg-hgv-yellow/40 flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-hgv-navy">v{billing?.configVersion || 1}</span>
            <span className="text-xs text-slate-600 font-medium">FX: {billing?.fxRate} INR/USD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {billing?.billedEmployeesCount || 0} employees in scope
          </p>
        </div>
      </div>

      {/* Quick Actions (Role Aware) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {permissions?.canEditWorkforce && (
            <Link
              href="/workforce/new"
              className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-hgv-teal hover:bg-slate-50 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-hgv-navy text-white flex items-center justify-center shrink-0">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-hgv-teal">
                  Add Employee
                </p>
                <p className="text-[10px] text-slate-400">Create workforce record</p>
              </div>
            </Link>
          )}

          {permissions?.canUploadCsv && (
            <Link
              href="/bulk-upload/master-data"
              className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-hgv-teal hover:bg-slate-50 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-hgv-teal text-white flex items-center justify-center shrink-0">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-hgv-teal">
                  Upload Master Data
                </p>
                <p className="text-[10px] text-slate-400">Bulk import workforce CSV</p>
              </div>
            </Link>
          )}

          {permissions?.canUploadCsv && (
            <Link
              href="/bulk-upload/shift-allowance"
              className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-hgv-teal hover:bg-slate-50 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-hgv-teal">
                  PMO Shift Upload
                </p>
                <p className="text-[10px] text-slate-400">Apply monthly overrides</p>
              </div>
            </Link>
          )}

          <Link
            href="/reports/billing"
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-hgv-teal hover:bg-slate-50 transition group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 group-hover:text-hgv-teal">
                Billing Reports
              </p>
              <p className="text-[10px] text-slate-400">Excel / PDF finance summary</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Split: Engagement Mix & Attention Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Mix */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-hgv-navy">Workforce Distribution by Engagement</h2>
              <p className="text-[11px] text-slate-400">Population breakdown across business models</p>
            </div>
            <Link href="/workforce" className="text-xs text-hgv-teal hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {Object.entries(headcount?.engagementMix || {}).map(([key, val]) => (
              <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  {key}
                </span>
                <span className="text-xl font-bold text-hgv-navy mt-1 block">{val as number}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {key === "Non-GCC" ? "External billing" : key === "Rebadge" || key === "Colocation" ? "Facility bundle" : "Full salary loaded"}
                </span>
              </div>
            ))}
          </div>

          {/* Billing Components Snapshot */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Monthly Cost Breakdown Snapshot ({billingMonth})
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-hgv-sky/15 border border-hgv-sky/30">
                <span className="text-[11px] text-slate-600 block">Salary Cost (USD)</span>
                <span className="text-base font-bold text-hgv-navy mt-1 block">
                  ${billing?.totalSalaryCostUsd?.toLocaleString() || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60">
                <span className="text-[11px] text-slate-600 block">Operational Margin (30%)</span>
                <span className="text-base font-bold text-amber-800 mt-1 block">
                  ${billing?.totalOpsMarginUsd?.toLocaleString() || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                <span className="text-[11px] text-slate-600 block">Facility & Bundle Costs</span>
                <span className="text-base font-bold text-emerald-800 mt-1 block">
                  ${billing?.totalFacilityCostUsd?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Quality & Attention Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-hgv-navy">Data Quality Alerts</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
              {attentionItems.length} Notice{attentionItems.length === 1 ? "" : "s"}
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">All Master Data Validated</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No missing CTC or unassigned shift types found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionItems.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900 leading-tight">{item.title}</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {item.count} employee record{item.count === 1 ? "" : "s"} require attention.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Consequential Changes */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Recent Audit Events
              </h3>
              {permissions?.canViewAudit && (
                <Link href="/audit" className="text-[11px] text-hgv-teal hover:underline font-medium">
                  All logs
                </Link>
              )}
            </div>

            <div className="space-y-2">
              {recentAudits.slice(0, 4).map((audit: any) => (
                <div key={audit.id} className="text-xs py-1.5 border-b border-slate-50 last:border-none">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">{audit.action}</span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(audit.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{audit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
