"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileText,
  Calendar,
  Layers,
  Database,
} from "lucide-react";

export default function BulkUploadPage() {
  const { permissions } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBatches() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/imports");
        if (res.ok) {
          setBatches(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  const downloadMasterDataTemplate = () => {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Oracle Person Number",
      "Assignment Status",
      "Gender",
      "Engagement Type",
      "Employment Category",
      "GCC Presence",
      "HGV Role",
      "HGV Department",
      "Domain Lead",
      "Reporting Manager",
      "Business Unit",
      "Practice",
      "Sub Practice",
      "Grade Level",
      "Project",
      "Source",
      "Shift Type",
      "Base Location",
      "HGV Start Date",
      "Fixed CTC",
      "Variable Pay Mode",
      "Variable Pay %",
      "Custom Variable Pay",
      "Joining Bonus",
      "Work Email",
      "Personal Phone",
      "City",
      "State",
    ];

    const sampleRow = [
      "IN01809999",
      "Ananya Sen",
      "7890123",
      "Active",
      "Female",
      "GCC",
      "Full Time",
      "Yes",
      "Senior Cloud Engineer",
      "Cloud & DevOps",
      "Sue Pawa",
      "Michael Chang",
      "Hospitality Tech",
      "Infrastructure",
      "Cloud Operations",
      "L5",
      "",
      "Direct Hire",
      "US_SHIFT",
      "Hyderabad",
      "2026-08-01",
      "2400000",
      "FLAT_PERCENT",
      "5.0",
      "",
      "100000",
      "ananya.sen@hgv.com",
      "+91 98765 43210",
      "Hyderabad",
      "Telangana",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), sampleRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "HGV_Master_Data_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadShiftAllowanceTemplate = () => {
    const headers = ["Employee ID", "Billing Month", "Validated Shift Allowance Amount"];
    const sampleRows = [
      ["IN01806551", "2026-08", "250.00"],
      ["IN01808003", "2026-08", "300.00"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...sampleRows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "HGV_Shift_Allowance_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBulkUpdateTemplate = () => {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Assignment Status",
      "HGV Role",
      "HGV Department",
      "Domain Lead",
      "Reporting Manager",
      "Business Unit",
      "Practice",
      "Sub Practice",
      "Grade Level",
      "Shift Type",
      "Base Location",
      "Fixed CTC",
      "Variable Pay Mode",
      "Variable Pay %",
      "Custom Variable Pay",
      "Joining Bonus",
    ];

    const sampleRow = [
      "IN01806555",
      "Radha Subramanian",
      "Active",
      "Lead System Architect",
      "Architecture & Core Eng",
      "Sue Pawa",
      "Michael Chang",
      "Hospitality Tech",
      "Architecture",
      "Enterprise Platform",
      "L6",
      "US_SHIFT",
      "Hyderabad",
      "4200000",
      "FLAT_PERCENT",
      "5.0",
      "",
      "0",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), sampleRow.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "HGV_Workforce_Bulk_Update_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs crumbs={[{ label: "Bulk Upload" }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Bulk Ingestion & Maintenance Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standardized, staged CSV workflows for workforce master data onboarding, staged bulk record updates, and validated shift allowances.
          </p>
        </div>
      </div>

      {/* Upload Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Master Data */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between hover:border-hgv-teal/50 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-hgv-navy text-white flex items-center justify-center mb-4 shadow-xs">
              <Layers className="w-6 h-6 text-hgv-sky" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Workforce Master Onboarding</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Upload multi-model workforce records (GCC, NOC, Rebadge, Colocation, Non-GCC). Performs
              strict header validation, dynamic mandatory checks, and non-blocking partial success.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <p>• <strong>Employee ID</strong> required for GCC, NOC, Non-GCC.</p>
              <p>• <strong>Project</strong> required for Non-GCC Fixed Bid.</p>
              <p>• <strong>Fixed CTC & Variable Pay</strong> required for GCC/NOC.</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={downloadMasterDataTemplate}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-hgv-navy font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template</span>
            </button>

            <Link
              href="/bulk-upload/master-data"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-semibold shadow-xs transition"
            >
              <span>Onboard</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Bulk Update */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between hover:border-hgv-teal/50 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-hgv-teal text-white flex items-center justify-center mb-4 shadow-xs">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Workforce Bulk Update</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Batch update existing employee records by <strong>Employee ID</strong>. Includes staged verification, failure reason CSV download, and selective apply.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <p>• Checks employee existence against master database.</p>
              <p>• Validates lifecycle status, shift types, & domain leads.</p>
              <p>• Exports downloadable CSV of failed rows with exact errors.</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={downloadBulkUpdateTemplate}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-hgv-teal font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template</span>
            </button>

            <Link
              href="/bulk-upload/bulk-update"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-hgv-teal hover:bg-hgv-teal/90 text-white text-xs font-semibold shadow-xs transition"
            >
              <span>Bulk Update</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Shift Allowance */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between hover:border-hgv-teal/50 transition">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-xs">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Monthly Shift Allowance</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Upload monthly PMO-validated night and weekend shift allowances in USD. Stored as billing
              overrides for exact Employee ID and Billing Month combinations.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <p>• Validates Employee ID against active roster.</p>
              <p>• Requires Billing Month format (<strong>YYYY-MM</strong>).</p>
              <p>• Overrides Shift Type default allowance.</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={downloadShiftAllowanceTemplate}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-emerald-700 font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template</span>
            </button>

            <Link
              href="/bulk-upload/shift-allowance"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <span>Upload Allowance</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Import Batches History */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-hgv-teal" />
            Ingestion History & Audit
          </h2>
          <span className="text-xs text-slate-400 font-medium">Last 20 batches</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading batch history...</div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No bulk imports executed yet. Use the upload triggers above to ingest records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Batch ID / File</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Total Rows</th>
                  <th className="py-2.5 px-3 text-center">Success</th>
                  <th className="py-2.5 px-3 text-center">Errors</th>
                  <th className="py-2.5 px-3">Uploaded By</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-800">{b.fileName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{b.id.slice(0, 8)}...</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {b.uploadType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "PARTIAL_SUCCESS"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {b.status === "COMPLETED" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                        )}
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                      {b.totalRows}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                      {b.validRows ?? b.successRows ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-hgv-coral">
                      {b.failedRows ?? b.errorRows ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{b.uploadedBy}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(b.startedAt || b.uploadedAt || Date.now()).toLocaleDateString()}{" "}
                      {new Date(b.startedAt || b.uploadedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/bulk-upload/${b.id}`}
                        className="text-xs text-hgv-teal font-semibold hover:underline"
                      >
                        View Details
                      </Link>
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
