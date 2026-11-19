"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  Shield,
  Download,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  Building,
  UserCheck,
  Send,
  Zap,
} from "lucide-react";

export default function ComplianceAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningRecert, setRunningRecert] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/lms/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRunRecertification = async () => {
    try {
      setRunningRecert(true);
      const res = await fetch("/api/v1/lms/recertification/run", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Recertification cadence scan completed successfully!");
        await fetchAnalytics();
      } else {
        alert(data.error || "Failed to trigger recertification scan");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningRecert(false);
    }
  };

  const handleDownloadAuditPackage = () => {
    window.open("/api/v1/lms/reports/export", "_blank");
  };

  const scorecard = analytics?.scorecard || {
    overallCompliancePercent: 0,
    targetSla: 99.5,
    totalEnrollments: 0,
    completedCount: 0,
    overdueCount: 0,
    overdueRatePercent: 0,
    overdueSlaTarget: 2.0,
    totalCertificatesIssued: 0,
    recertificationRadarCount: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs crumbs={[{ label: "Learning & Compliance (ELMS)", href: "/lms" }, { label: "Compliance Scorecard & Analytics" }]} />

        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white border border-teal-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-700 border border-purple-300">
                Executive Compliance &amp; Audit (FR-REP)
              </span>
              <span className="text-xs text-slate-400">SOC 2 Type II &amp; ISO 27001 Inspection Hub</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Executive Compliance Scorecard</h1>
            <p className="text-xs text-slate-500">
              Real-time enterprise regulatory health, department rankings, automated 365-day recertification cadence, and 1-click audit evidence package export.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRunRecertification}
              disabled={runningRecert}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-hgv-teal text-slate-700 hover:text-hgv-navy rounded-xl shadow-xs text-xs font-semibold transition"
            >
              <RotateCw className={`w-3.5 h-3.5 text-hgv-teal ${runningRecert ? "animate-spin" : ""}`} />
              <span>{runningRecert ? "Scanning Radar..." : "Run Recertification Scan"}</span>
            </button>

            <button
              onClick={handleDownloadAuditPackage}
              className="flex items-center gap-2 px-4 py-2 bg-hgv-navy hover:bg-slate-800 text-white rounded-xl shadow-xs text-xs font-bold transition"
            >
              <Download className="w-4 h-4 text-hgv-teal" />
              <span>Export Audit Package (CSV)</span>
            </button>
          </div>
        </div>

        {/* Executive Scorecard Gauges (FR-REP-01) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main KPI Gauge */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Workforce Compliance %
              </span>
              <Shield className="w-4 h-4 text-hgv-teal" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {scorecard.overallCompliancePercent}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Target ≥ {scorecard.targetSla}%
              </span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-hgv-teal to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(scorecard.overallCompliancePercent, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {scorecard.completedCount} of {scorecard.totalEnrollments} total compliance obligations fulfilled
            </p>
          </div>

          {/* Overdue Escalations (< 2% Target SLA) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Overdue Escalations
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600">
                {scorecard.overdueCount}
              </span>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Rate: {scorecard.overdueRatePercent}%
              </span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${Math.min(scorecard.overdueRatePercent * 10, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              SLA Threshold: &lt; {scorecard.overdueSlaTarget}% max allowable delinquency
            </p>
          </div>

          {/* Certified Employees */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Certificates
              </span>
              <FileCheck className="w-4 h-4 text-hgv-teal" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {scorecard.totalCertificatesIssued}
              </span>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                SHA-256 Hashed
              </span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-hgv-teal" style={{ width: "100%" }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Tamper-evident audit trails with verified cryptographic signatures
            </p>
          </div>

          {/* Recertification Radar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                T-30 Recert Radar
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600">
                {scorecard.recertificationRadarCount}
              </span>
              <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Expiring in &le; 30d
              </span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: "60%" }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Automated renewal triggers at T-30, T-14, T-7, and T-1 days
            </p>
          </div>
        </div>

        {/* Department Rankings Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-hgv-navy" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Departmental Compliance Breakdown &amp; Ranking
              </h2>
            </div>
            <span className="text-xs text-slate-400">SOC 2 Departmental Evidence</span>
          </div>

          <div className="space-y-3">
            {analytics?.departmentRankings?.map((dept: any, idx: number) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{dept.name}</span>
                    <span className="text-slate-400 text-[11px]">
                      ({dept.completed}/{dept.total} completed, {dept.overdue} overdue)
                    </span>
                  </div>

                  <span
                    className={`font-bold ${
                      dept.compliancePercent >= 90
                        ? "text-emerald-600"
                        : dept.compliancePercent >= 75
                        ? "text-amber-600"
                        : "text-rose-600"
                    }`}
                  >
                    {dept.compliancePercent}%
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      dept.compliancePercent >= 90
                        ? "bg-emerald-500"
                        : dept.compliancePercent >= 75
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(dept.compliancePercent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Immutable Audit Trail Log Explorer (FR-REP-02) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-hgv-teal" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Immutable Regulatory Audit Trail
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Append-Only • 7-Year Retention Mandate
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Target Entity</th>
                  <th className="py-2.5 px-4">Audit Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {analytics?.recentAuditLogs?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      No audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  analytics?.recentAuditLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 font-medium">{log.actorEmail}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            log.action === "CERTIFICATE_ISSUED"
                              ? "bg-teal-50 text-hgv-teal border border-teal-200"
                              : log.action === "NUDGE_SENT"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : log.action === "RECERTIFICATION_TRIGGERED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{log.targetEntity}</td>
                      <td className="py-2.5 px-4 text-slate-600 truncate max-w-xs" title={log.detailsJson}>
                        {log.detailsJson || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
