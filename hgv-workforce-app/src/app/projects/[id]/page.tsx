"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  ArrowLeft,
  X,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { permissions } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Allocate Resource Modal State
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [projectRole, setProjectRole] = useState("");
  const [allocationPct, setAllocationPct] = useState(0.5);
  const [allocStatus, setAllocStatus] = useState<"CONFIRMED" | "DRAFT">("CONFIRMED");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingAlloc, setSavingAlloc] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Allocation Modal State
  const [editingAlloc, setEditingAlloc] = useState<any>(null);
  const [editPct, setEditPct] = useState(0.5);
  const [editRole, setEditRole] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/projects/${params.id}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load project");
      }
      const data = await res.json();
      setProject(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesWithCapacity = async () => {
    try {
      const res = await fetch("/api/v1/skills/matrix");
      if (res.ok) {
        const data = await res.json();
        setAllEmployees(data.matrix || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchEmployeesWithCapacity();
  }, [params.id]);

  const handleOpenAllocateModal = () => {
    setModalError(null);
    // Find first employee with free capacity and not already on this project
    const assignedIds = new Set((project?.allocations || []).map((a: any) => a.employeeId));
    const available = allEmployees.find(
      (e) => e.freeCapacityPct > 0 && !assignedIds.has(e.id)
    );
    if (available) {
      setSelectedEmployeeId(available.id);
      setProjectRole(available.role || "");
      setAllocationPct(Math.min(0.5, available.freeCapacityPct));
    } else {
      setSelectedEmployeeId("");
      setProjectRole("");
      setAllocationPct(0.5);
    }
    setAllocateModalOpen(true);
  };

  const selectedEmpObj = allEmployees.find((e) => e.id === selectedEmployeeId);

  const handleEmployeeSelectChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    setModalError(null);
    const emp = allEmployees.find((e) => e.id === empId);
    if (emp) {
      setProjectRole(emp.role || "");
      setAllocationPct(Math.min(0.5, emp.freeCapacityPct));
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedEmployeeId) {
      setModalError("Please select an available resource.");
      return;
    }

    try {
      setSavingAlloc(true);
      const res = await fetch("/api/v1/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          projectId: project.id,
          projectName: project.name,
          projectRole: projectRole.trim() || selectedEmpObj?.role,
          allocationPct,
          startDate,
          status: allocStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Failed to allocate resource.");
        return;
      }

      setAllocateModalOpen(false);
      await Promise.all([fetchProject(), fetchEmployeesWithCapacity()]);
    } catch (err: any) {
      setModalError(err.message || "An error occurred.");
    } finally {
      setSavingAlloc(false);
    }
  };

  const handleConfirmDraft = async (allocId: string) => {
    try {
      const res = await fetch(`/api/v1/allocations/${allocId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Cannot confirm draft allocation.");
        return;
      }
      await Promise.all([fetchProject(), fetchEmployeesWithCapacity()]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalizeAllDrafts = async () => {
    if (!confirm(`Confirm all ${project.draftCount} draft allocation(s) on '${project.name}'?`)) return;
    try {
      const res = await fetch("/api/v1/allocations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, projectName: project.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Cannot finalize drafts due to over-allocation limits.");
        return;
      }
      await Promise.all([fetchProject(), fetchEmployeesWithCapacity()]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAllocation = async (allocId: string, empName: string) => {
    if (!confirm(`Remove ${empName} from '${project.name}'?`)) return;
    try {
      const res = await fetch(`/api/v1/allocations/${allocId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to remove allocation");
        return;
      }
      await Promise.all([fetchProject(), fetchEmployeesWithCapacity()]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (alloc: any) => {
    setEditingAlloc(alloc);
    setEditPct(alloc.allocationPct);
    setEditRole(alloc.projectRole || alloc.employee?.hgvRole || "");
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    try {
      setSavingEdit(true);
      const res = await fetch(`/api/v1/allocations/${editingAlloc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocationPct: editPct,
          projectRole: editRole.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update allocation");
        return;
      }
      setEditingAlloc(null);
      await Promise.all([fetchProject(), fetchEmployeesWithCapacity()]);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-36 bg-slate-200 rounded-xl"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">{error || "Project Not Found"}</h2>
        <Link href="/skills" className="mt-3 inline-block text-xs text-hgv-teal font-semibold hover:underline">
          Return to Skill Matrix & Project Rosters
        </Link>
      </div>
    );
  }

  const assignedEmployeeIds = new Set((project.allocations || []).map((a: any) => a.employeeId));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <Breadcrumbs
        crumbs={[
          { label: "Skill Matrix & Projects", href: "/skills" },
          { label: project.name },
        ]}
      />

      {/* Project Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-hgv-navy text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-hgv-navy">{project.name}</h1>
                {project.code && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {project.code}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {project.description || `Resource roster and capacity breakdown for ${project.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/skills"
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Projects</span>
            </Link>

            {permissions?.canEditWorkforce && project.draftCount > 0 && (
              <button
                type="button"
                onClick={handleFinalizeAllDrafts}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finalize All Drafts ({project.draftCount})</span>
              </button>
            )}

            {permissions?.canEditWorkforce && (
              <button
                type="button"
                onClick={handleOpenAllocateModal}
                className="px-3.5 py-2 rounded-lg bg-hgv-teal hover:bg-hgv-teal/90 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Allocate Resource</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Confirmed Resources
            </span>
            <span className="text-lg font-bold text-hgv-navy mt-0.5 block">
              {project.confirmedCount}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Confirmed Effort (FTE)
            </span>
            <span className="text-lg font-bold text-hgv-teal mt-0.5 block">
              {project.confirmedFte.toFixed(2)} FTE ({Math.round(project.confirmedFte * 100)}%)
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Draft Proposals
            </span>
            <span className="text-lg font-bold text-amber-600 mt-0.5 block">
              {project.draftCount}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Draft Effort (FTE)
            </span>
            <span className="text-lg font-bold text-slate-700 mt-0.5 block">
              {project.draftFte.toFixed(2)} FTE
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Resources Table (Requirements 4 & 5) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-1.5">
              <Users className="w-4 h-4 text-hgv-teal" />
              Allocated Resources Roster ({project.allocations?.length || 0})
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Detailed breakdown of every team member assigned to {project.name}, their project allocation %, and overall utilization.
            </p>
          </div>
        </div>

        {project.allocations && project.allocations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Resource Name</th>
                  <th className="py-3 px-4">Role & Practice</th>
                  <th className="py-3 px-4">Project Role</th>
                  <th className="py-3 px-4 text-center">Project Allocation %</th>
                  <th className="py-3 px-4 text-center">Total Utilization</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {permissions?.canEditWorkforce && (
                    <th className="py-3 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.allocations.map((alloc: any) => {
                  const emp = alloc.employee;
                  const totalUtilPct = Math.round((alloc.employeeConfirmedTotalPct || 0) * 100);
                  const freePct = Math.round((alloc.employeeFreeCapacityPct || 0) * 100);
                  const isOver = totalUtilPct > 100;

                  return (
                    <tr key={alloc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/workforce/${emp.id}`}
                          className="font-bold text-hgv-navy hover:text-hgv-teal hover:underline block"
                        >
                          {emp.employeeName}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-400">
                          {emp.employeeId || "—"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 block">{emp.hgvRole}</span>
                        <span className="text-[10px] text-slate-400">
                          {emp.practice || emp.hgvDepartment || "General"} • Lead: {emp.domainLead?.name || "—"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {alloc.projectRole || emp.hgvRole}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-hgv-navy/5 text-hgv-navy font-extrabold text-xs border border-hgv-navy/10">
                          {Math.round(alloc.allocationPct * 100)}% ({alloc.allocationPct.toFixed(2)} FTE)
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] font-bold block ${
                            isOver
                              ? "text-red-600"
                              : totalUtilPct === 100
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {totalUtilPct}% Used ({freePct}% Free)
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(alloc.startDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alloc.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {alloc.status}
                        </span>
                      </td>

                      {permissions?.canEditWorkforce && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {alloc.status === "DRAFT" && (
                              <button
                                type="button"
                                onClick={() => handleConfirmDraft(alloc.id)}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition"
                                title="Confirm draft allocation"
                              >
                                Confirm
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(alloc)}
                              className="p-1.5 rounded text-slate-500 hover:text-hgv-teal hover:bg-slate-100 transition"
                              title="Edit allocation %"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAllocation(alloc.id, emp.employeeName)}
                              className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Remove resource from project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No resources allocated to this project yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Allocate Resource" above to assign available team members.
            </p>
          </div>
        )}
      </div>

      {/* ALLOCATE RESOURCE MODAL (With Strict 100% Cap Enforcement) */}
      {allocateModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-hgv-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-hgv-teal" />
                <h3 className="text-sm font-bold">Allocate Resource to {project.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setAllocateModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Resource <span className="text-hgv-coral">*</span>
                </label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeSelectChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">-- Choose an employee --</option>
                  {allEmployees.map((emp) => {
                    const isAlreadyAssigned = assignedEmployeeIds.has(emp.id);
                    const isFull = emp.freeCapacityPct <= 0;
                    const freePct = Math.round(emp.freeCapacityPct * 100);
                    return (
                      <option
                        key={emp.id}
                        value={emp.id}
                        disabled={isFull || isAlreadyAssigned}
                      >
                        {emp.name} ({emp.role}) —{" "}
                        {isAlreadyAssigned
                          ? "Already Assigned"
                          : isFull
                          ? "100% Allocated (Unavailable)"
                          : `${freePct}% Free`}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Employees at 100% confirmed allocation cannot be assigned additional capacity.
                </span>
              </div>

              {selectedEmpObj && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Available Capacity:</span>
                    <span className="font-bold text-emerald-600">
                      {Math.round(selectedEmpObj.freeCapacityPct * 100)}% Remaining
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">Allocation %:</label>
                      <span className="font-bold text-hgv-navy">
                        {Math.round(allocationPct * 100)}% ({allocationPct.toFixed(2)} FTE)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max={Math.max(0.1, selectedEmpObj.freeCapacityPct)}
                      step="0.05"
                      value={allocationPct}
                      onChange={(e) => setAllocationPct(parseFloat(e.target.value))}
                      className="w-full accent-hgv-teal"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Role</label>
                <input
                  type="text"
                  value={projectRole}
                  onChange={(e) => setProjectRole(e.target.value)}
                  placeholder="e.g. Lead Data Engineer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Allocation Status</label>
                  <select
                    value={allocStatus}
                    onChange={(e) => setAllocStatus(e.target.value as "CONFIRMED" | "DRAFT")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="DRAFT">Draft Proposal</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAllocateModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAlloc || !selectedEmployeeId}
                  className="px-4 py-1.5 font-bold text-white bg-hgv-teal hover:bg-hgv-teal/90 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {savingAlloc ? "Saving..." : "Assign Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ALLOCATION MODAL */}
      {editingAlloc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-hgv-navy">
                Edit Allocation: {editingAlloc.employee?.employeeName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingAlloc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              {editError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-semibold text-slate-700">Allocation %:</label>
                  <span className="font-bold text-hgv-navy">
                    {Math.round(editPct * 100)}% ({editPct.toFixed(2)} FTE)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={editPct}
                  onChange={(e) => setEditPct(parseFloat(e.target.value))}
                  className="w-full accent-hgv-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Role</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAlloc(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 font-bold text-white bg-hgv-navy hover:bg-hgv-navy/90 rounded-lg"
                >
                  {savingEdit ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
