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
  RefreshCw,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Database,
} from "lucide-react";
import Papa from "papaparse";

export default function BulkUpdatePage() {
  const router = useRouter();
  const { permissions } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [filePreviewRows, setFilePreviewRows] = useState<any[]>([]);
  const [validating, setValidating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation output state
  const [validationResult, setValidationResult] = useState<{
    fileName: string;
    totalRows: number;
    validRowsCount: number;
    invalidRowsCount: number;
    validatedRows: any[];
    failedRows: any[];
    failedRowsCsv: string | null;
  } | null>(null);

  // Completed apply state
  const [appliedResult, setAppliedResult] = useState<{
    success: boolean;
    updatedCount: number;
    batchId: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setValidationResult(null);
      setAppliedResult(null);

      // Parse initial preview
      Papa.parse(selected, {
        header: true,
        preview: 5,
        skipEmptyLines: true,
        complete: (results) => {
          setFilePreviewRows(results.data);
        },
      });
    }
  };

  const handleValidate = async () => {
    if (!file) {
      setError("Please choose a CSV file first.");
      return;
    }

    try {
      setValidating(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/imports/bulk-update", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Validation failed.");
      }

      setValidationResult(json);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during validation.");
    } finally {
      setValidating(false);
    }
  };

  const handleApplyUpdates = async () => {
    if (!validationResult || validationResult.validRowsCount === 0) return;

    try {
      setApplying(true);
      setError(null);

      const res = await fetch("/api/v1/imports/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          validRows: validationResult.validatedRows,
          fileName: validationResult.fileName,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to apply updates.");
      }

      setAppliedResult(json);
    } catch (err: any) {
      setError(err.message || "Failed to persist bulk updates.");
    } finally {
      setApplying(false);
    }
  };

  const downloadFailedCsv = () => {
    if (!validationResult?.failedRowsCsv) return;
    const blob = new Blob([validationResult.failedRowsCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `failed_rows_${validationResult.fileName.replace(/\.csv$/i, "")}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleTemplate = () => {
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
    link.setAttribute("download", "hgv_workforce_bulk_update_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!permissions?.canEditWorkforce) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          crumbs={[
            { label: "Bulk Operations", href: "/bulk-upload" },
            { label: "Workforce Bulk Update" },
          ]}
        />
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            Workforce Bulk Updates require an HR Team Member or HR Manager role. Please switch your persona to proceed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumbs
        crumbs={[
          { label: "Bulk Operations", href: "/bulk-upload" },
          { label: "Workforce Bulk Update" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/bulk-upload"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-hgv-teal" />
              Workforce Master Bulk Update
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-6">
            Stage, validate, and batch update existing employee records by <strong>Employee ID</strong> with automated error reporting.
          </p>
        </div>

        <button
          type="button"
          onClick={downloadSampleTemplate}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-hgv-navy bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-hgv-teal" />
          Download Update Template (.csv)
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Operation Notice</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* STAGE 3: APPLICATION COMPLETE BANNER */}
      {appliedResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-in fade-in-50">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-900">
              Bulk Update Completed Successfully!
            </h3>
            <p className="text-xs text-emerald-700 mt-1">
              Successfully updated <strong>{appliedResult.updatedCount}</strong> workforce master records. An immutable audit record has been committed to the security ledger.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/workforce"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              View Workforce Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setFilePreviewRows([]);
                setValidationResult(null);
                setAppliedResult(null);
              }}
              className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-100/50 transition-colors"
            >
              Upload Another Batch
            </button>
          </div>
        </div>
      )}

      {/* STAGE 1: FILE PICKER & INITIAL STAGING */}
      {!appliedResult && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-hgv-teal/15 text-hgv-teal flex items-center justify-center text-[10px]">1</span>
            Select Update File & Review Staging
          </h2>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-hgv-teal transition-colors bg-slate-50/50">
            <input
              type="file"
              id="bulk-update-file-input"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="bulk-update-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400">
                <UploadCloud className="w-6 h-6 text-hgv-teal" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {file ? file.name : "Click to select CSV update file or drag and drop"}
              </p>
              <p className="text-[11px] text-slate-400">
                Primary identifier: <strong>Employee ID</strong> (e.g. IN01806555). Only non-empty columns will be modified.
              </p>
            </label>
          </div>

          {/* Staging Raw Preview Table */}
          {file && filePreviewRows.length > 0 && !validationResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  File Detected Preview (First {filePreviewRows.length} rows):
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      {Object.keys(filePreviewRows[0] || {}).map((col) => (
                        <th key={col} className="px-3 py-2 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filePreviewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        {Object.values(row).map((val: any, cidx) => (
                          <td key={cidx} className="px-3 py-1.5 whitespace-nowrap font-mono text-slate-700">
                            {String(val || "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Button: Validate Uploaded Data */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={validating}
                  className="px-5 py-2.5 bg-hgv-teal hover:bg-hgv-teal/90 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {validating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Validating Uploaded Data...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Validate Uploaded Data
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: VALIDATION SUMMARY & ACTION MATRIX */}
      {validationResult && !appliedResult && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6 animate-in fade-in-50">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-hgv-teal/15 text-hgv-teal flex items-center justify-center text-[10px]">2</span>
                Validation Results & Verification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target batch: <strong>{validationResult.fileName}</strong> • Scanned: <strong>{validationResult.totalRows} rows</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {validationResult.invalidRowsCount > 0 && (
                <button
                  type="button"
                  onClick={downloadFailedCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Failed Records CSV
                </button>
              )}

              {validationResult.validRowsCount > 0 && (
                <button
                  type="button"
                  onClick={handleApplyUpdates}
                  disabled={applying}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {applying ? (
                    <>Applying Updates...</>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Apply Valid Updates ({validationResult.validRowsCount} records)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-xs block font-medium">Total Rows Evaluated</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">
                {validationResult.totalRows}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-emerald-700 text-xs block font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Valid Records (Ready to Apply)
              </span>
              <span className="text-xl font-extrabold text-emerald-900 mt-1 block">
                {validationResult.validRowsCount}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
              <span className="text-rose-700 text-xs block font-semibold flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Invalid / Failed Records
              </span>
              <span className="text-xl font-extrabold text-rose-900 mt-1 block">
                {validationResult.invalidRowsCount}
              </span>
            </div>
          </div>

          {/* Failed Records Notice if applicable */}
          {validationResult.invalidRowsCount > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Validation Errors Detected ({validationResult.invalidRowsCount} rows)</span>
              </div>
              <p className="text-[11px] text-rose-700">
                The rows listed below failed validation (e.g. Employee ID does not exist in master data, or invalid assignment status/domain lead/shift type). Click <strong>&quot;Download Failed Records CSV&quot;</strong> to export a CSV containing these rows and their specific failure reasons.
              </p>

              {/* Table of Failed Rows */}
              <div className="overflow-x-auto max-h-56 border border-rose-200 rounded-lg bg-white mt-2">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-100/60 text-rose-900 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Employee ID</th>
                      <th className="px-3 py-2">Employee Name</th>
                      <th className="px-3 py-2">Validation Error Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 font-mono text-[11px]">
                    {validationResult.failedRows.map((fr: any, idx: number) => (
                      <tr key={idx} className="hover:bg-rose-50/40">
                        <td className="px-3 py-1.5 text-slate-500">{idx + 2}</td>
                        <td className="px-3 py-1.5 font-bold text-rose-900">
                          {fr["Employee ID"] || fr["employeeId"] || "MISSING"}
                        </td>
                        <td className="px-3 py-1.5 text-slate-700">
                          {fr["Employee Name"] || fr["employeeName"] || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-rose-700 font-sans font-medium">
                          {fr["Validation Error Reason"]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid Records Preview */}
          {validationResult.validRowsCount > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Valid Records Staged for Update ({validationResult.validRowsCount})
              </h3>
              <div className="overflow-x-auto max-h-64 border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Employee ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Assignment Status</th>
                      <th className="px-3 py-2">HGV Role</th>
                      <th className="px-3 py-2">Domain Lead</th>
                      <th className="px-3 py-2">Shift Type</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validationResult.validatedRows.map((vr: any) => (
                      <tr key={vr.rowNumber} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-slate-400 text-[11px]">{vr.rowNumber}</td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-800">{vr.employeeId}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{vr.employeeName}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {vr.assignmentStatus || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{vr.hgvRole || "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{vr.domainLead || "—"}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{vr.shiftType || "—"}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VALID
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setValidationResult(null);
                setFile(null);
                setFilePreviewRows([]);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              Reset & Select New File
            </button>

            {validationResult.validRowsCount > 0 && (
              <button
                type="button"
                onClick={handleApplyUpdates}
                disabled={applying}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {applying ? "Applying Updates..." : `Apply Valid Updates (${validationResult.validRowsCount} records)`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
