"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBatch() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/imports/${params.id}`);
        if (res.ok) {
          setBatch(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBatch();
  }, [params.id]);

  const downloadErrorCsv = () => {
    if (!batch || !batch.rowErrors || batch.rowErrors.length === 0) return;

    const headers = ["Row Number", "Column Name", "Error Code", "Error Message"];
    const rows = batch.rowErrors.map((err: any) => [
      err.rowNumber,
      `"${err.columnName || ""}"`,
      `"${err.errorCode || ""}"`,
      `"${(err.errorMessage || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HGV_Batch_${params.id}_Errors.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-xl"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Batch Record Not Found</h2>
        <Link href="/bulk-upload" className="mt-3 inline-block text-xs text-hgv-teal font-semibold hover:underline">
          Return to Bulk Upload Center
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        crumbs={[
          { label: "Bulk Upload", href: "/bulk-upload" },
          { label: `Batch: ${batch.id.slice(0, 8)}...` },
        ]}
      />

      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-hgv-navy text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-6 h-6 text-hgv-sky" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-hgv-navy">{batch.fileName}</h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    batch.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : batch.status === "PARTIAL_SUCCESS"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {batch.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {batch.uploadType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Batch ID: <span className="font-mono text-slate-600">{batch.id}</span> • Uploaded by{" "}
                <span className="text-slate-700 font-semibold">{batch.uploadedBy}</span> on{" "}
                {new Date(batch.startedAt || batch.uploadedAt || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {batch.rowErrors && batch.rowErrors.length > 0 && (
              <button
                onClick={downloadErrorCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 text-hgv-coral hover:bg-red-100 text-xs font-semibold shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Error CSV</span>
              </button>
            )}

            <Link
              href="/bulk-upload"
              className="flex items-center gap-1 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back</span>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Rows Staged
            </span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{batch.totalRows}</p>
          </div>
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 text-center">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Valid & Ingested
            </span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{batch.validRows ?? batch.successRows ?? 0}</p>
          </div>
          <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 text-center">
            <span className="text-[11px] font-semibold text-hgv-coral uppercase tracking-wider">
              Errors / Rejected
            </span>
            <p className="text-2xl font-bold text-hgv-coral mt-1">{batch.failedRows ?? batch.errorRows ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Row Errors Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Row-Level Failure Diagnostics ({batch.rowErrors?.length || 0})
          </h2>
          {batch.rowErrors?.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">Download error CSV for offline correction</span>
          )}
        </div>

        {!batch.rowErrors || batch.rowErrors.length === 0 ? (
          <div className="p-8 text-center text-xs text-emerald-700 flex flex-col items-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
            <span className="font-semibold">Clean Batch: No row-level validation errors detected!</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Row #</th>
                  <th className="py-2.5 px-3">Field / Column</th>
                  <th className="py-2.5 px-3">Violation Code</th>
                  <th className="py-2.5 px-3">Error Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batch.rowErrors.map((err: any) => (
                  <tr key={err.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Row {err.rowNumber}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{err.columnName || "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-50 text-hgv-coral border border-red-100">
                        {err.errorCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{err.errorMessage}</td>
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
