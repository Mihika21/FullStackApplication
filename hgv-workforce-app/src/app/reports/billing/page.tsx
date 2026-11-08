"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  DollarSign,
  Download,
  Filter,
  Calendar,
  Building2,
  PieChart,
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

export default function BillingReportPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  // Filters
  const [billingMonth, setBillingMonth] = useState(
    new Date().toISOString().slice(0, 7) // "2026-08"
  );
  const [engagementType, setEngagementType] = useState("");
  const [domainLeadId, setDomainLeadId] = useState("");
  const [domainLeads, setDomainLeads] = useState<any[]>([]);

  useEffect(() => {
    async function loadDomainLeads() {
      try {
        const res = await fetch("/api/v1/reference/domain-leads");
        if (res.ok) setDomainLeads(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    loadDomainLeads();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("billingMonth", billingMonth);
      if (engagementType) params.append("engagementType", engagementType);
      if (domainLeadId) params.append("domainLeadId", domainLeadId);

      const res = await fetch(`/api/v1/reports/billing?${params.toString()}`);
      if (res.ok) {
        setReportData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [billingMonth, engagementType, domainLeadId]);

  const excelExportUrl = `/api/v1/reports/billing?format=excel&billingMonth=${billingMonth}${
    engagementType ? `&engagementType=${engagementType}` : ""
  }${domainLeadId ? `&domainLeadId=${domainLeadId}` : ""}`;

  const pdfExportUrl = `/api/v1/reports/billing?format=pdf&billingMonth=${billingMonth}${
    engagementType ? `&engagementType=${engagementType}` : ""
  }${domainLeadId ? `&domainLeadId=${domainLeadId}` : ""}`;

  const calculatedRows = reportData?.data?.filter((r: any) => r.billingStatus === "CALCULATED") || [];
  const avgCost = calculatedRows.length > 0
    ? (reportData?.totalBilledUsd || 0) / calculatedRows.length
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        crumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Monthly Billing Summary" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Monthly Billing Summary</h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic monthly billing figures across engagement types, domain leads, and cost components.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={excelExportUrl}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </a>

          <a
            href={pdfExportUrl}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </a>

          <Link
            href="/reports"
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Hub</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
          <Filter className="w-3.5 h-3.5 text-hgv-teal" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500 font-medium">Month:</span>
          <input
            type="month"
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
          />
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Monthly Billed (USD)
          </span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            ${reportData?.totalBilledUsd?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">For billing month: {billingMonth}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Billable Headcount
          </span>
          <p className="text-2xl font-bold text-hgv-navy mt-1">
            {calculatedRows.length} <span className="text-xs font-normal text-slate-400">/ {reportData?.totalEmployees || 0} total</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Non-GCC fixed bid tracked separately</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Average Cost per Billable Head
          </span>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            ${avgCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Fully loaded monthly average</p>
        </div>
      </div>

      {/* Aggregates: Domain Lead & Engagement Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Lead Rollup */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3 flex items-center justify-between">
            <span>Billing by Domain Lead</span>
            <Building2 className="w-3.5 h-3.5 text-hgv-teal" />
          </h2>
          <div className="space-y-2 text-xs">
            {reportData?.domainLeadTotals &&
              Object.entries(reportData.domainLeadTotals).map(([lead, stats]: any) => (
                <div key={lead} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <div>
                    <p className="font-semibold text-slate-800">{lead}</p>
                    <p className="text-[10px] text-slate-400">{stats.count} team members</p>
                  </div>
                  <span className="font-bold text-emerald-700">
                    ${stats.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Engagement Type Rollup */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3 flex items-center justify-between">
            <span>Billing by Engagement Model</span>
            <PieChart className="w-3.5 h-3.5 text-hgv-teal" />
          </h2>
          <div className="space-y-2 text-xs">
            {reportData?.engagementTotals &&
              Object.entries(reportData.engagementTotals).map(([eng, stats]: any) => (
                <div key={eng} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {eng}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-2">{stats.count} resources</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    ${stats.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Detailed Employee Billing Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-3 mb-4">
          Detailed Employee Billing Breakdown
        </h2>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading billing records...</div>
        ) : !reportData?.data || reportData.data.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No workforce billing records found for this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Engagement</th>
                  <th className="py-2.5 px-3">Lead</th>
                  <th className="py-2.5 px-3 text-right">Salary Cost</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                  <th className="py-2.5 px-3 text-right">Facility</th>
                  <th className="py-2.5 px-3 text-right">Shift Allow.</th>
                  <th className="py-2.5 px-3 text-right font-bold text-hgv-navy">Monthly Cost</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.data.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-800">{row.employeeName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{row.employeeId}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {row.engagementType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{row.domainLead}</td>
                    <td className="py-2.5 px-3 text-right font-mono">${row.salaryCostUsd.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">${row.operationalMarginUsd.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">${row.facilityCostUsd.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      ${row.shiftAllowanceUsd.toFixed(2)}
                      {row.shiftAllowanceSource === "PMO_OVERRIDE" && (
                        <span className="text-[9px] text-amber-600 ml-1 font-bold" title="PMO Override">★</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono">
                      ${row.monthlyFullyLoadedCostUsd.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.billingStatus === "CALCULATED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {row.billingStatus}
                      </span>
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
