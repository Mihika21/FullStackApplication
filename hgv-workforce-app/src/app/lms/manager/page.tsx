"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  Flame,
  Users,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Filter,
  Search,
  Clock,
  Shield,
  MessageSquare,
  Mail,
  Zap,
  X,
  Check,
  ChevronDown,
} from "lucide-react";

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [nudgeModalOpen, setNudgeModalOpen] = useState(false);
  const [activeNudgeTarget, setActiveNudgeTarget] = useState<any>(null); // single or null for bulk
  const [selectedChannel, setSelectedChannel] = useState<string>("MULTI_CHANNEL");
  const [customMessage, setCustomMessage] = useState("");
  const [nudgeSending, setNudgeSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchHeatmap();
  }, [user, selectedManager, selectedDept]);

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedManager) params.set("manager", selectedManager);
      if (selectedDept && selectedDept !== "ALL") params.set("department", selectedDept);

      const res = await fetch(`/api/v1/lms/manager/heatmap?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHeatmapData(data);
      }
    } catch (err) {
      console.error("Failed to load manager heatmap:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1-Click Individual or Bulk Nudge
  const handleSendNudge = async () => {
    try {
      setNudgeSending(true);
      const payload: any = {
        channel: selectedChannel,
        customMessage: customMessage || undefined,
      };

      if (activeNudgeTarget) {
        payload.enrollmentId = activeNudgeTarget.enrollmentId;
      } else {
        // Bulk Nudge all overdue
        const overdueEnrollmentIds: string[] = [];
        heatmapData?.teamMatrix?.forEach((row: any) => {
          Object.values(row.courses).forEach((c: any) => {
            if (c.status === "OVERDUE" && c.enrollmentId) {
              overdueEnrollmentIds.push(c.enrollmentId);
            }
          });
        });
        payload.enrollmentIds = overdueEnrollmentIds;
      }

      const res = await fetch("/api/v1/lms/manager/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setNudgeModalOpen(false);
        setActiveNudgeTarget(null);
        setCustomMessage("");
        showToast(data.message || "Compliance nudge dispatched successfully!");
        await fetchHeatmap();
      } else {
        alert(data.error || "Failed to dispatch nudge");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNudgeSending(false);
    }
  };

  // Team export to CSV
  const handleExportTeamCsv = () => {
    const params = new URLSearchParams();
    if (selectedDept && selectedDept !== "ALL") params.set("department", selectedDept);
    window.open(`/api/v1/lms/reports/export?${params.toString()}`, "_blank");
  };

  // Filter team matrix by search query
  const filteredTeamMatrix = heatmapData?.teamMatrix?.filter((row: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      row.employee.employeeName.toLowerCase().includes(q) ||
      row.employee.employeeId?.toLowerCase().includes(q) ||
      row.employee.hgvRole?.toLowerCase().includes(q)
    );
  }) || [];

  const summary = heatmapData?.summary || {
    totalTeamMembers: 0,
    fullyCompliantCount: 0,
    overdueCount: 0,
    dueSoonCount: 0,
    teamCompliancePercent: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs crumbs={[{ label: "Learning & Compliance (ELMS)", href: "/lms" }, { label: "Manager Heatmap & Command Center" }]} />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white border border-teal-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-300">
                People Manager Command Center
              </span>
              <span className="text-xs text-slate-400">Team Heatmap & Nudge Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Direct Team Compliance Heatmap</h1>
            <p className="text-xs text-slate-500">
              Supervising compliance for team under{" "}
              <strong className="text-slate-800">
                {selectedManager || user?.displayName || "Jeff Chu"}
              </strong>
              . Instant visibility into overdue obligations and 1-click multi-channel nudging.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setActiveNudgeTarget(null);
                setNudgeModalOpen(true);
              }}
              disabled={summary.overdueCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl shadow-xs text-xs font-bold transition"
            >
              <Zap className="w-4 h-4" />
              <span>Bulk Nudge All Overdue ({summary.overdueCount})</span>
            </button>

            <button
              onClick={handleExportTeamCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl shadow-xs text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Team Compliance % Gauge */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Team Compliance Rate</span>
            <div className="flex items-baseline gap-2 mt-2">
              <p
                className={`text-2xl font-bold ${
                  summary.teamCompliancePercent >= 90
                    ? "text-emerald-600"
                    : summary.teamCompliancePercent >= 75
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {summary.teamCompliancePercent}%
              </p>
              <span className="text-[11px] text-slate-400">Target ≥ 99.5%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${
                  summary.teamCompliancePercent >= 90
                    ? "bg-emerald-500"
                    : summary.teamCompliancePercent >= 75
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(summary.teamCompliancePercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Direct Reports</span>
            <p className="text-2xl font-bold text-slate-800 mt-2">{summary.totalTeamMembers}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active personnel</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Fully Compliant</span>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{summary.fullyCompliantCount}</p>
            <p className="text-[11px] text-emerald-700/80 font-medium mt-0.5">All certifications valid</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Overdue (Delinquent)</span>
            <p className="text-2xl font-bold text-rose-600 mt-2">{summary.overdueCount}</p>
            <p className="text-[11px] text-rose-600/80 font-medium mt-0.5">Escalated to HR / SOC2</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Due in &lt; 7 Days</span>
            <p className="text-2xl font-bold text-amber-600 mt-2">{summary.dueSoonCount}</p>
            <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">Pre-expiry window</p>
          </div>
        </div>

        {/* Heatmap Matrix Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-3">
              {/* Department Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Department:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                >
                  <option value="ALL">All Departments</option>
                  {heatmapData?.filterOptions?.departments?.map((dept: string) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manager Filter */}
              {(user?.roleCode === "HR_MANAGER" || user?.roleCode === "AUDITOR") && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Manager:</span>
                  <select
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                  >
                    <option value="">My Team (Default)</option>
                    <option value="ALL">All Company Employees</option>
                    {heatmapData?.filterOptions?.managers?.map((mgr: string) => (
                      <option key={mgr} value={mgr}>
                        {mgr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter employee or ID..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="px-6 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-6 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Status Legend:</span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Compliant (100% Passed)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Due Soon (&lt; 7 Days)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Non-Compliant / Overdue</span>
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span>In Progress / Assigned</span>
            </span>
          </div>

          {/* Table Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 min-w-[200px]">Direct Report</th>
                  <th className="py-3 px-4">Role &amp; Department</th>
                  {heatmapData?.mandatoryCourses?.map((course: any) => (
                    <th key={course.id} className="py-3 px-4 min-w-[150px] text-center">
                      <div className="font-bold truncate max-w-[140px] mx-auto" title={course.title}>
                        {course.title}
                      </div>
                      <span className="text-[9px] font-normal text-slate-500 block">
                        {course.recertificationDays}d SLA
                      </span>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeamMatrix.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(heatmapData?.mandatoryCourses?.length || 0) + 3}
                      className="py-12 text-center text-slate-400"
                    >
                      No team members found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTeamMatrix.map((row: any) => {
                    const emp = row.employee;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                        {/* Employee Details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-hgv-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {emp.employeeName.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 leading-tight">
                                {emp.employeeName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {emp.employeeId || "IN0180000"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role & Dept */}
                        <td className="py-3 px-4">
                          <p className="text-slate-700 font-medium leading-tight">{emp.hgvRole}</p>
                          <p className="text-[10px] text-slate-400">{emp.hgvDepartment}</p>
                        </td>

                        {/* Course Status Cells */}
                        {heatmapData?.mandatoryCourses?.map((course: any) => {
                          const statusData = row.courses[course.id];
                          const badge = statusData?.badge;

                          return (
                            <td key={course.id} className="py-3 px-4 text-center">
                              {badge === "green" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Passed</span>
                                </span>
                              ) : badge === "red" ? (
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Overdue</span>
                                  </span>
                                  <button
                                    onClick={() => {
                                      setActiveNudgeTarget({
                                        userName: emp.employeeName,
                                        userEmail: `${emp.employeeName.toLowerCase().replace(/[^a-z]/g, ".")}@hgv.com`,
                                        courseTitle: course.title,
                                        enrollmentId: statusData.enrollmentId,
                                      });
                                      setNudgeModalOpen(true);
                                    }}
                                    className="text-[9px] font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-0.5"
                                  >
                                    <Send className="w-2.5 h-2.5" />
                                    <span>Nudge</span>
                                  </button>
                                </div>
                              ) : badge === "yellow" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Due Soon</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                  <span>{statusData?.progressPercent || 0}% Done</span>
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Row Actions */}
                        <td className="py-3 px-4 text-right">
                          {row.hasOverdue ? (
                            <button
                              onClick={() => {
                                // Find first overdue course enrollment
                                const firstOverdue = Object.entries(row.courses).find(
                                  ([_, c]: any) => c.status === "OVERDUE"
                                );
                                if (firstOverdue) {
                                  const [courseId, cData]: any = firstOverdue;
                                  const crs = heatmapData.mandatoryCourses.find((c: any) => c.id === courseId);
                                  setActiveNudgeTarget({
                                    userName: emp.employeeName,
                                    userEmail: `${emp.employeeName.toLowerCase().replace(/[^a-z]/g, ".")}@hgv.com`,
                                    courseTitle: crs?.title || "Mandatory Compliance",
                                    enrollmentId: cData.enrollmentId,
                                  });
                                  setNudgeModalOpen(true);
                                }
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 shadow-xs"
                            >
                              <Send className="w-3 h-3" />
                              <span>Nudge</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Compliant
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1-Click Multi-Channel Nudge Modal (FR-MGR-02, FR-MGR-03) */}
        {nudgeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {activeNudgeTarget
                        ? `Send Compliance Nudge to ${activeNudgeTarget.userName}`
                        : `Bulk Nudge All Delinquent Team Members (${summary.overdueCount})`}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {activeNudgeTarget
                        ? `Course: ${activeNudgeTarget.courseTitle}`
                        : "Dispatches automated escalation to all team members with overdue deadlines"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setNudgeModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4">
                {/* Channel Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Delivery Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChannel("MULTI_CHANNEL")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                        selectedChannel === "MULTI_CHANNEL"
                          ? "border-hgv-teal bg-teal-50 text-hgv-navy"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Zap className="w-4 h-4 text-hgv-teal" />
                      <span>Email + Slack Bot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedChannel("EMAIL")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                        selectedChannel === "EMAIL"
                          ? "border-hgv-teal bg-teal-50 text-hgv-navy"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Corporate Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedChannel("SLACK")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                        selectedChannel === "SLACK"
                          ? "border-hgv-teal bg-teal-50 text-hgv-navy"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Slack Bot Direct</span>
                    </button>
                  </div>
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Reminder Message (Optional customization)
                  </label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Urgent Reminder: Your mandatory compliance training is overdue. Please complete it by EOD to satisfy SOC 2 and ISO 27001 regulatory standards."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    System will automatically append direct deep-links to the course player and timestamp the audit log.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => setNudgeModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSendNudge}
                  disabled={nudgeSending}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{nudgeSending ? "Dispatching Alerts..." : "Confirm & Dispatch Nudge"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
