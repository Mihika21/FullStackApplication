"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  FileSpreadsheet,
  Download,
  Filter,
  Users,
  Search,
  RotateCw,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

export default function MasterDataReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // Filters
  const [engagementType, setEngagementType] = useState("");
  const [domainLeadId, setDomainLeadId] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("");
  const [domainLeads, setDomainLeads] = useState<any[]>([]);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const res = await fetch("/api/v1/reference/domain-leads");
        if (res.ok) setDomainLeads(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    loadFilterOptions();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (engagementType) params.append("engagementType", engagementType);
      if (domainLeadId) params.append("domainLeadId", domainLeadId);
      if (assignmentStatus) params.append("assignmentStatus", assignmentStatus);

      const res = await fetch(`/api/v1/reports/master-data?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [engagementType, domainLeadId, assignmentStatus]);

  const excelExportUrl = `/api/v1/reports/master-data?format=excel${
    engagementType ? `&engagementType=${engagementType}` : ""
  }${domainLeadId ? `&domainLeadId=${domainLeadId}` : ""}${
    assignmentStatus ? `&assignmentStatus=${assignmentStatus}` : ""
  }`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        crumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Master Data Export" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Workforce Master Data Export</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete employee roster with employment categories, organization metadata, and compensation.
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
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
          <Filter className="w-3.5 h-3.5 text-hgv-teal" />
          <span>Filters:</span>
        </div>

        <div>
          <select
            value={engagementType}
            onChange={(e) => setEngagementType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-hgv-teal"
          >
            <option value="">All Engagement Models</option>
            <option value="GCC">GCC Dedicated</option>
            <option value="NOC">24x7 NOC</option>
            <option value="Rebadge">Rebadge</option>
            <option value="Colocation">Colocation</option>
            <option value="Non-GCC">Non-GCC Fixed Bid</option>
          </select>
        </div>

        <div>
          <select
            value={domainLeadId}
            onChange={(e) => setDomainLeadId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-hgv-teal"
          >
            <option value="">All Domain Leads</option>
            {domainLeads.map((dl) => (
              <option key={dl.id} value={dl.id}>
                {dl.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={assignmentStatus}
            onChange={(e) => setAssignmentStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-hgv-teal"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Resigned">Resigned</option>
          </select>
        </div>

        {(engagementType || domainLeadId || assignmentStatus) && (
          <button
            onClick={() => {
              setEngagementType("");
              setDomainLeadId("");
              setAssignmentStatus("");
            }}
            className="text-[11px] text-hgv-coral font-semibold hover:underline ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-2">
            <Users className="w-4 h-4 text-hgv-teal" />
            Live Report Preview ({total} Records)
          </h2>
          <span className="text-xs text-slate-400">
            Exporting applies exact active filters and masked PII standards
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Generating preview...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No employee records match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Engagement</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Role / Dept</th>
                  <th className="py-2.5 px-3">Domain Lead</th>
                  <th className="py-2.5 px-3">Start Date</th>
                  <th className="py-2.5 px-3">Base Location</th>
                  <th className="py-2.5 px-3 text-right">Fixed CTC (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-800">{row.employeeName}</p>
                      <p className="text-[10px] text-slate-400">
                        ID: <span className="font-mono text-slate-600">{row.employeeId}</span>
                      </p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {row.engagementType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.assignmentStatus === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {row.assignmentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-700">{row.hgvRole}</p>
                      <p className="text-[10px] text-slate-400">{row.hgvDepartment}</p>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{row.domainLead}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{row.hgvStartDate}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.baseLocation}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                      {row.fixedCtcInr > 0 ? `₹${row.fixedCtcInr.toLocaleString("en-IN")}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
