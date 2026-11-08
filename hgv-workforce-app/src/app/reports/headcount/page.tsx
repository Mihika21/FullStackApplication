"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  PieChart,
  Download,
  Users,
  Building2,
  ArrowLeft,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function HeadcountReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState("");

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.append("assignmentStatus", status);

      const res = await fetch(`/api/v1/reports/headcount?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [status]);

  const excelExportUrl = `/api/v1/reports/headcount?format=excel${status ? `&assignmentStatus=${status}` : ""}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs
        crumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Headcount & Distribution" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Headcount & Distribution Summary</h1>
          <p className="text-xs text-slate-500 mt-1">
            Workforce demographics, engagement models, leadership coverage, and GCC dedicated presence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={excelExportUrl}
            download
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel (.xlsx)</span>
          </a>

          <Link
            href="/reports"
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Reports Hub</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
          <Filter className="w-3.5 h-3.5 text-hgv-teal" />
          <span>Status Filter:</span>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-hgv-teal"
        >
          <option value="">All Assignment Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
          <option value="Resigned">Resigned</option>
        </select>
      </div>

      {/* Total Headcount Banner */}
      <div className="bg-hgv-navy text-white rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-hgv-sky uppercase tracking-wider">
            Total Organization Headcount
          </span>
          <p className="text-3xl font-extrabold mt-1">
            {data?.totalHeadcount || 0} <span className="text-sm font-normal text-slate-300">Team Members</span>
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block text-[11px]">GCC Dedicated</span>
            <span className="font-bold text-white text-base">
              {data?.byGccPresence?.Yes || 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Vendor / Colocated</span>
            <span className="font-bold text-white text-base">
              {data?.byGccPresence?.No || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Engagement Type */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3">
            Headcount by Engagement Model
          </h2>
          <div className="space-y-2.5 text-xs">
            {data?.byEngagement &&
              Object.entries(data.byEngagement).map(([eng, count]: any) => {
                const pct = data.totalHeadcount > 0 ? ((count / data.totalHeadcount) * 100).toFixed(1) : 0;
                return (
                  <div key={eng} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700 font-semibold">{eng}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-hgv-navy h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* By Domain Lead */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3">
            Headcount by Domain Lead
          </h2>
          <div className="space-y-2.5 text-xs">
            {data?.byDomainLead &&
              Object.entries(data.byDomainLead).map(([lead, count]: any) => {
                const pct = data.totalHeadcount > 0 ? ((count / data.totalHeadcount) * 100).toFixed(1) : 0;
                return (
                  <div key={lead} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700 font-semibold">{lead}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-hgv-teal h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* By Gender Diversity */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3">
            Gender Representation
          </h2>
          <div className="space-y-2.5 text-xs">
            {data?.byGender &&
              Object.entries(data.byGender).map(([gender, count]: any) => {
                const pct = data.totalHeadcount > 0 ? ((count / data.totalHeadcount) * 100).toFixed(1) : 0;
                return (
                  <div key={gender} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700 font-semibold">{gender}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3">
            Assignment Status Distribution
          </h2>
          <div className="space-y-2.5 text-xs">
            {data?.byStatus &&
              Object.entries(data.byStatus).map(([st, count]: any) => {
                const pct = data.totalHeadcount > 0 ? ((count / data.totalHeadcount) * 100).toFixed(1) : 0;
                return (
                  <div key={st} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-700 font-semibold">{st}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
