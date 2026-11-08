"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Layers,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function MasterDataUploadPage() {
  const router = useRouter();
  const { permissions } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a valid CSV file to upload.");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/imports/master-data", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to process master data import.");
      } else {
        setResult(json);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
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
      "Deepika Rao",
      "8812345",
      "Active",
      "Female",
      "GCC",
      "Full Time",
      "Yes",
      "Lead Software Engineer",
      "Core Platforms",
      "Jeff Chu",
      "Sarah Jenkins",
      "Hospitality Tech",
      "Core Engineering",
      "Cloud Infrastructure",
      "L6",
      "",
      "Direct Hire",
      "US_SHIFT",
      "Hyderabad",
      "2026-08-01",
      "3200000",
      "FLAT_PERCENT",
      "5.0",
      "",
      "150000",
      "deepika.rao@hgv.com",
      "+91 99887 76655",
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        crumbs={[
          { label: "Bulk Upload", href: "/bulk-upload" },
          { label: "Master Data Ingestion" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Master Data Ingestion</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ingest and stage multi-engagement workforce records with schema validation.
          </p>
        </div>
        <button
          onClick={downloadSampleTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Download Template CSV</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-hgv-coral text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box or Result Box */}
      {!result ? (
        <form onSubmit={handleUpload} className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-2xs space-y-6">
          <div className="border-2 border-dashed border-slate-200 hover:border-hgv-teal/60 rounded-2xl p-8 text-center transition flex flex-col items-center justify-center bg-slate-50/50">
            <div className="w-14 h-14 rounded-2xl bg-hgv-sky/30 text-hgv-navy flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Choose a CSV file to upload workforce master data
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports .csv formatted exports up to 10MB
            </p>

            <label className="mt-4 cursor-pointer">
              <span className="px-4 py-2 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-semibold shadow-xs transition">
                Browse Files
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <div className="mt-4 p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-700 shadow-2xs">
                <FileText className="w-4 h-4 text-hgv-teal" />
                <span className="font-semibold">{file.name}</span>
                <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Validation Rules Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-2">
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
              Ingestion Validation Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Employee ID required for GCC, NOC, Non-GCC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Project required for Non-GCC records</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Fixed CTC & Variable Pay required for GCC/NOC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Domain Lead & Shift Type must match active references</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/bulk-upload"
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!file || uploading}
              className="px-6 py-2.5 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {uploading ? "Validating & Ingesting..." : "Process Master Data CSV"}
            </button>
          </div>
        </form>
      ) : (
        /* Result Screen */
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                result.status === "COMPLETED"
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-600 text-white"
              }`}
            >
              {result.status === "COMPLETED" ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-hgv-navy">
                {result.status === "COMPLETED"
                  ? "Import Processed Successfully"
                  : "Import Processed with Row Warnings / Errors"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Batch ID: <span className="font-mono text-slate-700">{result.batchId}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Rows</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{result.totalRows}</p>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Successfully Ingested</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{result.successRows}</p>
            </div>
            <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 text-center">
              <span className="text-[11px] font-semibold text-hgv-coral uppercase">Errors / Rejected</span>
              <p className="text-2xl font-bold text-hgv-coral mt-1">{result.errorRows}</p>
            </div>
          </div>

          {result.rowErrors && result.rowErrors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy">
                Row-Level Validation Errors ({result.rowErrors.length})
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-64">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Row #</th>
                      <th className="py-2 px-3">Column</th>
                      <th className="py-2 px-3">Error Code</th>
                      <th className="py-2 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.rowErrors.map((err: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{err.rowNumber}</td>
                        <td className="py-2 px-3 text-slate-600 font-medium">{err.columnName || "—"}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-50 text-hgv-coral border border-red-100">
                            {err.errorCode}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700">{err.errorMessage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link
              href={`/bulk-upload/${result.batchId}`}
              className="text-xs text-hgv-teal font-semibold hover:underline"
            >
              View Full Batch Audit & Details →
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                Upload Another File
              </button>

              <Link
                href="/workforce"
                className="px-4 py-2 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-semibold shadow-xs transition"
              >
                Go to Workforce Roster
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
