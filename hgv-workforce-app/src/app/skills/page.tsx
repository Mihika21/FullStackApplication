"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  Award,
  Search,
  Target,
  Briefcase,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  UserCheck,
  Calendar,
  X,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

const PROFICIENCY_LEVELS = [
  { level: 0, label: "Any / L0", title: "No Exposure", color: "bg-slate-100 text-slate-700" },
  { level: 1, label: "L1", title: "Awareness", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { level: 2, label: "L2", title: "Working", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { level: 3, label: "L3", title: "Proficient", color: "bg-teal-50 text-teal-800 border-teal-200" },
  { level: 4, label: "L4", title: "Advanced", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  { level: 5, label: "L5", title: "Expert", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
];

export default function SkillMatrixPage() {
  const { permissions } = useAuth();
  const [activeTab, setActiveTab] = useState<"matrix" | "matcher" | "gaps" | "allocations">("matrix");
  const [loading, setLoading] = useState(true);

  // Matrix State
  const [matrixData, setMatrixData] = useState<any>(null);
  const [selectedPractice, setSelectedPractice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchEmployee, setSearchEmployee] = useState("");

  // Talent Matcher State
  const [availableSkillsList, setAvailableSkillsList] = useState<any[]>([]);
  const [matcherSkillId, setMatcherSkillId] = useState("");
  const [minProficiency, setMinProficiency] = useState(3);
  const [benchOnly, setBenchOnly] = useState(false);
  const [selectedRolePreset, setSelectedRolePreset] = useState("");

  // Gap Analysis State
  const [gapData, setGapData] = useState<any>(null);

  // Allocations State & Projects & Staffing Drawer
  const [allocationsList, setAllocationsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [isStaffingDrawerOpen, setIsStaffingDrawerOpen] = useState(false);
  const [drawerProjectMode, setDrawerProjectMode] = useState<"existing" | "new">("existing");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [draftProjectName, setDraftProjectName] = useState("");
  const [draftCandidates, setDraftCandidates] = useState<any[]>([]);
  const [savingRoster, setSavingRoster] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Create Project Modal State (Tab 4)
  const [createProjModalOpen, setCreateProjModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjClient, setNewProjClient] = useState("HGV");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [createProjError, setCreateProjError] = useState<string | null>(null);
  const [creatingProj, setCreatingProj] = useState(false);

  useEffect(() => {
    fetchMatrix();
    fetchSkillsCatalog();
    fetchGaps();
    fetchAllocations();
    fetchProjects();
  }, []);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/skills/matrix");
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data);
      }
    } catch (err) {
      console.error("Failed to load skill matrix", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillsCatalog = async () => {
    try {
      const res = await fetch("/api/v1/skills");
      if (res.ok) {
        const data = await res.json();
        setAvailableSkillsList(data);
        if (data.length > 0 && !matcherSkillId) {
          setMatcherSkillId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGaps = async () => {
    try {
      const res = await fetch("/api/v1/skills/gap-analysis");
      if (res.ok) {
        const data = await res.json();
        setGapData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllocations = async () => {
    try {
      const res = await fetch("/api/v1/allocations");
      if (res.ok) {
        const data = await res.json();
        setAllocationsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/v1/projects");
      if (res.ok) {
        const data = await res.json();
        setProjectsList(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateProjError(null);

    const trimmed = newProjName.trim();
    if (!trimmed) {
      setCreateProjError("Project name is required.");
      return;
    }

    const dup = projectsList.find(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (dup) {
      setCreateProjError(
        `A project named '${dup.name}' already exists. Duplicate project names are not allowed.`
      );
      return;
    }

    try {
      setCreatingProj(true);
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          clientName: newProjClient.trim() || "HGV",
          description: newProjDesc.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateProjError(data.error || "Failed to create project.");
        return;
      }

      setNewProjName("");
      setNewProjDesc("");
      setCreateProjModalOpen(false);
      await fetchProjects();
      if (data.project?.id) {
        setSelectedProjectId(data.project.id);
      }
    } catch (err: any) {
      setCreateProjError(err.message || "Error creating project.");
    } finally {
      setCreatingProj(false);
    }
  };

  // Staffing Drawer Actions
  const handleAddToProjectDraft = (candidate: any) => {
    if (candidate.freeCapacityPct <= 0 || candidate.allocationPct >= 1.0) {
      alert(
        `${candidate.name} is already 100% allocated and cannot be added to another project.`
      );
      return;
    }

    setDrawerError(null);
    const existing = draftCandidates.find((c) => c.id === candidate.id);
    if (existing) {
      setIsStaffingDrawerOpen(true);
      return;
    }

    const proposedAlloc = Math.min(0.5, candidate.freeCapacityPct);

    setDraftCandidates([
      ...draftCandidates,
      {
        id: candidate.id,
        name: candidate.name,
        role: candidate.role,
        currentAllocation: candidate.allocationPct,
        proposedAllocation: Math.round(proposedAlloc * 100) / 100,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        projectRole: candidate.role,
      },
    ]);
    setIsStaffingDrawerOpen(true);
  };

  const handleRemoveDraftCandidate = (id: string) => {
    setDraftCandidates(draftCandidates.filter((c) => c.id !== id));
    setDrawerError(null);
  };

  const handleUpdateDraftCandidate = (id: string, field: string, value: any) => {
    setDrawerError(null);
    setDraftCandidates(
      draftCandidates.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveRoster = async (status: "DRAFT" | "CONFIRMED") => {
    setDrawerError(null);

    if (drawerProjectMode === "existing" && !selectedProjectId) {
      setDrawerError("Please select an existing project.");
      return;
    }

    if (drawerProjectMode === "new") {
      const trimmed = draftProjectName.trim();
      if (!trimmed) {
        setDrawerError("Please enter a new project name.");
        return;
      }
      const dup = projectsList.find(
        (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (dup) {
        setDrawerError(
          `A project named '${dup.name}' already exists. Duplicate project names are not allowed — select it from Existing Projects instead.`
        );
        return;
      }
    }

    if (draftCandidates.length === 0) {
      setDrawerError("No candidates in the roster.");
      return;
    }

    // Check over-allocation client-side before sending
    for (const c of draftCandidates) {
      if (Math.round((c.currentAllocation + c.proposedAllocation) * 100) > 100) {
        setDrawerError(
          `Over-allocation prevented: ${c.name} would exceed 100% total allocation.`
        );
        return;
      }
    }

    try {
      setSavingRoster(true);

      let targetProjectId = drawerProjectMode === "existing" ? selectedProjectId : null;
      let targetProjectName =
        drawerProjectMode === "existing"
          ? projectsList.find((p) => p.id === selectedProjectId)?.name || ""
          : draftProjectName.trim();

      if (drawerProjectMode === "new") {
        const projRes = await fetch("/api/v1/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: targetProjectName }),
        });
        const projData = await projRes.json();
        if (!projRes.ok) {
          setDrawerError(projData.error || "Failed to create project.");
          return;
        }
        targetProjectId = projData.project.id;
        targetProjectName = projData.project.name;
      }

      for (const cand of draftCandidates) {
        const res = await fetch("/api/v1/allocations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: cand.id,
            projectId: targetProjectId,
            projectName: targetProjectName,
            projectRole: cand.projectRole,
            allocationPct: cand.proposedAllocation,
            startDate: cand.startDate,
            endDate: cand.endDate || null,
            status,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setDrawerError(data.error || `Failed to assign ${cand.name}.`);
          await Promise.all([fetchAllocations(), fetchProjects(), fetchMatrix()]);
          return;
        }
      }

      alert(
        `Successfully saved ${draftCandidates.length} candidate(s) as ${status} on '${targetProjectName}'!`
      );
      setDraftCandidates([]);
      setDraftProjectName("");
      setDrawerProjectMode("existing");
      setIsStaffingDrawerOpen(false);
      await Promise.all([fetchAllocations(), fetchProjects(), fetchMatrix()]);
    } catch (err: any) {
      console.error(err);
      setDrawerError(err.message || "Failed to save staffing roster");
    } finally {
      setSavingRoster(false);
    }
  };

  const handleExportExcel = () => {
    let url = "/api/v1/skills/export";
    if (selectedPractice) {
      url += `?practice=${encodeURIComponent(selectedPractice)}`;
    }
    window.location.href = url;
  };

  // Filtered Matrix Employees
  const filteredMatrixEmployees = matrixData?.matrix?.filter((emp: any) => {
    if (selectedPractice && emp.practice !== selectedPractice) return false;
    if (searchEmployee && !emp.name.toLowerCase().includes(searchEmployee.toLowerCase())) return false;
    return true;
  }) || [];

  // Filtered Skills by Category
  const displayedSkills = matrixData?.skills?.filter((s: any) => {
    if (selectedCategory && s.categoryId !== selectedCategory) return false;
    return true;
  }) || [];

  // Talent Matcher Search Results
  const matchedCandidates = matrixData?.matrix?.filter((emp: any) => {
    const rating = emp.skills[matcherSkillId] || 0;
    if (rating < minProficiency) return false;
    if (benchOnly && emp.allocationPct >= 0.5) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs crumbs={[{ label: "Skill Matrix & Capability Management" }]} />

      {/* Header & Sub-Nav */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-hgv-navy text-white flex items-center justify-center font-bold shadow-sm">
              <Award className="w-6 h-6 text-hgv-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-hgv-navy">
                  Skill Matrix & Capability Platform
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-hgv-teal/10 text-hgv-teal border border-hgv-teal/20">
                  BRD v0.1 Aligned
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Skills Inventory, Automated Role Gap Analysis, & Skill-Based Resource Staffing Workbench
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {activeTab === "matrix" && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-hgv-navy hover:bg-hgv-navy/90 rounded-lg shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5 text-hgv-teal" />
                <span>Export Excel (.xlsx)</span>
              </button>
            )}

            {draftCandidates.length > 0 && (
              <button
                type="button"
                onClick={() => setIsStaffingDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-hgv-teal hover:bg-hgv-teal/90 rounded-lg shadow-sm transition animate-pulse"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Draft Roster ({draftCandidates.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 mt-6 border-b border-slate-200/80 -mx-6 px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "matrix"
                ? "border-hgv-teal text-hgv-teal font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Capability Heatmap Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("matcher")}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "matcher"
                ? "border-hgv-teal text-hgv-teal font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Talent Matcher & Staffing Workbench</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gaps")}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "gaps"
                ? "border-hgv-teal text-hgv-teal font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Target className="w-4 h-4 text-red-500" />
            <span>Role Requirements & Gap Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("allocations")}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "allocations"
                ? "border-hgv-teal text-hgv-teal font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4 text-hgv-sky" />
            <span>Active Project Rosters</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CAPABILITY HEATMAP GRID */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search employee by name..."
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                />
              </div>

              <div>
                <select
                  value={selectedPractice}
                  onChange={(e) => setSelectedPractice(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700"
                >
                  <option value="">All Practices</option>
                  <option value="Data & Analytics">Data & Analytics</option>
                  <option value="QA">QA & Quality</option>
                  <option value="DevOps & SRE">DevOps & SRE</option>
                  <option value="Command Center">Command Center / NOC</option>
                  <option value="Oracle Cloud">Oracle Cloud</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-700"
                >
                  <option value="">All Skill Categories</option>
                  {matrixData?.categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Proficiency Scale Legend (As required by BRD §6) */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="font-bold mr-1">Legend:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">0 None</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">1 Aware</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">2 Working</span>
              <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 font-semibold">3 Proficient</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold">4 Advanced</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-950 font-extrabold">5 Expert</span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] relative">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-hgv-navy text-white text-[11px] uppercase tracking-wider sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="py-3 px-3 sticky left-0 z-30 bg-hgv-navy border-r border-white/10 min-w-[100px]">
                      ID
                    </th>
                    <th className="py-3 px-3 sticky left-[100px] z-30 bg-hgv-navy border-r border-white/10 min-w-[160px]">
                      Employee Name
                    </th>
                    <th className="py-3 px-3 min-w-[140px] border-r border-white/10">Role</th>
                    <th className="py-3 px-3 min-w-[120px] border-r border-white/10">Practice</th>
                    <th className="py-3 px-3 text-center min-w-[70px] border-r border-white/20">Alloc %</th>

                    {displayedSkills.map((s: any) => (
                      <th
                        key={s.id}
                        className="py-3 px-2 text-center min-w-[105px] border-r border-white/10"
                        title={`${s.name} (${s.category?.name})`}
                      >
                        <span className="block truncate max-w-[100px]">{s.name}</span>
                        <span className="text-[9px] text-hgv-sky/80 font-normal lowercase block">
                          {s.category?.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMatrixEmployees.map((emp: any, idx: number) => {
                    const rowBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50/40";
                    return (
                      <tr key={emp.id} className={`${rowBg} hover:bg-slate-100/60 transition-colors`}>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 sticky left-0 z-10 bg-inherit border-r border-slate-200">
                          {emp.employeeId}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-hgv-navy sticky left-[100px] z-10 bg-inherit border-r border-slate-200">
                          <Link href={`/workforce/${emp.id}`} className="hover:underline hover:text-hgv-teal">
                            {emp.name}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 truncate max-w-[140px]">
                          {emp.role}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                          {emp.practice}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              emp.allocationPct > 1.0
                                ? "bg-red-100 text-red-800"
                                : emp.allocationPct >= 0.8
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {Math.round(emp.allocationPct * 100)}%
                          </span>
                        </td>

                        {/* Skill Cells */}
                        {displayedSkills.map((s: any) => {
                          const val = emp.skills[s.id] ?? 0;
                          const cellStyles = [
                            "bg-slate-50/80 text-slate-400 font-normal", // 0
                            "bg-sky-50 text-sky-800 font-medium", // 1
                            "bg-blue-50 text-blue-900 font-semibold", // 2
                            "bg-teal-50 text-teal-900 font-bold", // 3
                            "bg-indigo-100 text-indigo-950 font-bold", // 4
                            "bg-emerald-200 text-emerald-950 font-extrabold", // 5
                          ];

                          return (
                            <td
                              key={s.id}
                              className={`py-2 px-2 text-center border-r border-slate-100 ${
                                cellStyles[val] || cellStyles[0]
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>

                {/* Summary Rows (Matching BRD Starter Workbook) */}
                <tfoot className="bg-slate-100/90 text-slate-800 text-[11px] font-bold border-t-2 border-slate-300 sticky bottom-0 z-20">
                  {/* Headcount >= L3 */}
                  <tr>
                    <td colSpan={5} className="py-2 px-3 text-right bg-slate-200/80 border-r border-slate-300">
                      Headcount ≥ L3 (Proficient)
                    </td>
                    {displayedSkills.map((s: any) => (
                      <td key={s.id} className="py-2 px-2 text-center border-r border-slate-200">
                        {matrixData?.summary?.[s.id]?.headcountL3 ?? 0}
                      </td>
                    ))}
                  </tr>

                  {/* Headcount >= L4 */}
                  <tr>
                    <td colSpan={5} className="py-2 px-3 text-right bg-slate-200/80 border-r border-slate-300">
                      Headcount ≥ L4 (Advanced)
                    </td>
                    {displayedSkills.map((s: any) => (
                      <td key={s.id} className="py-2 px-2 text-center border-r border-slate-200">
                        {matrixData?.summary?.[s.id]?.headcountL4 ?? 0}
                      </td>
                    ))}
                  </tr>

                  {/* Average Rating */}
                  <tr>
                    <td colSpan={5} className="py-2 px-3 text-right bg-slate-200/80 border-r border-slate-300">
                      Average Rating (Rated Staff)
                    </td>
                    {displayedSkills.map((s: any) => (
                      <td key={s.id} className="py-2 px-2 text-center border-r border-slate-200 font-mono text-[10px]">
                        {matrixData?.summary?.[s.id]?.averageRating ?? "0.0"}
                      </td>
                    ))}
                  </tr>

                  {/* Coverage Risk (SPOF / NO COVER) */}
                  <tr className="bg-slate-200 text-xs">
                    <td colSpan={5} className="py-2.5 px-3 text-right text-red-900 border-r border-slate-300">
                      Coverage Risk (SPOF / NO COVER)
                    </td>
                    {displayedSkills.map((s: any) => {
                      const risk = matrixData?.summary?.[s.id]?.coverageRisk || "OK";
                      return (
                        <td key={s.id} className="py-2.5 px-2 text-center border-r border-slate-300">
                          {risk === "NO COVER" ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-extrabold">
                              NO COVER
                            </span>
                          ) : risk === "SPOF" ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                              SPOF
                            </span>
                          ) : (
                            <span className="text-emerald-700 text-[10px]">OK</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Showing {filteredMatrixEmployees.length} active workforce members across {displayedSkills.length} competencies.</span>
              <span className="text-[10px] text-slate-400">
                SPOF = Single Point of Failure (Only 1 person at L4+). NO COVER = Nobody at L4+.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TALENT MATCHER & STAFFING WORKBENCH */}
      {activeTab === "matcher" && (
        <div className="space-y-6">
          {/* Expressive Search & Filter Panel */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-hgv-navy flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Expressive Skill Search & Talent Matcher
              </h2>
              <p className="text-xs text-slate-500">
                Search candidates by competency level, filter by bench capacity, or auto-fill from role requirements.
              </p>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Skill Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Competency / Skill
                </label>
                <select
                  value={matcherSkillId}
                  onChange={(e) => setMatcherSkillId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-hgv-teal"
                >
                  {availableSkillsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category?.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expressive 5-Step Segmented Slider */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Minimum Proficiency Level Required:
                  </label>
                  <span className="text-xs font-bold text-hgv-teal">
                    {PROFICIENCY_LEVELS[minProficiency]?.label} — {PROFICIENCY_LEVELS[minProficiency]?.title}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1 bg-slate-100 p-1 rounded-lg">
                  {PROFICIENCY_LEVELS.map((p) => {
                    const isSelected = minProficiency === p.level;
                    return (
                      <button
                        key={p.level}
                        type="button"
                        onClick={() => setMinProficiency(p.level)}
                        className={`py-1.5 text-center rounded-md text-xs transition font-semibold ${
                          isSelected
                            ? "bg-hgv-navy text-white shadow-xs font-bold"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Filter Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBenchOnly(!benchOnly)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    benchOnly
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>⚡ Available Bench Capacity Only (&lt;50% Allocated)</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Found <strong>{matchedCandidates.length}</strong> matching candidate(s)
              </div>
            </div>
          </div>

          {/* Candidate Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedCandidates.length > 0 ? (
              matchedCandidates.map((cand: any) => {
                const rating = cand.skills[matcherSkillId] || 0;
                const freeCap = cand.freeCapacityPct;
                const isOver = cand.allocationPct > 1.0;

                return (
                  <div
                    key={cand.id}
                    className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/workforce/${cand.id}`}
                            className="font-bold text-sm text-hgv-navy hover:text-hgv-teal hover:underline"
                          >
                            {cand.name}
                          </Link>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {cand.role} • {cand.practice}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Lead: {cand.domainLead}
                          </span>
                        </div>

                        {/* Validated Rating Badge */}
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-hgv-teal text-white shadow-xs">
                            Level {rating}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Validated Rating
                          </span>
                        </div>
                      </div>

                      {/* Capacity Meter */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            Current Allocation:{" "}
                            <span className={isOver ? "text-red-600 font-bold" : "text-hgv-navy font-bold"}>
                              {Math.round(cand.allocationPct * 100)}%
                            </span>
                          </span>
                          <span className="font-bold text-emerald-600">
                            {Math.round(freeCap * 100)}% Free Capacity
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              isOver ? "bg-red-500" : cand.allocationPct > 0.8 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, cand.allocationPct * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <Link
                        href={`/workforce/${cand.id}`}
                        className="text-xs text-hgv-teal font-semibold hover:underline flex items-center gap-1"
                      >
                        View Full Profile <ChevronRight className="w-3 h-3" />
                      </Link>

                      {cand.freeCapacityPct <= 0 || cand.allocationPct >= 1.0 ? (
                        <button
                          type="button"
                          disabled
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
                          title="Resource is already 100% allocated and cannot be assigned to additional projects"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          <span>100% Allocated (Full)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToProjectDraft(cand)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-hgv-navy hover:bg-hgv-navy/90 rounded-lg shadow-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5 text-hgv-teal" />
                          <span>Add to Project Draft</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No matching candidates found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try lowering the minimum proficiency level or unchecking bench-only filters.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ROLE REQUIREMENTS & AUTOMATED GAP ANALYSIS */}
      {activeTab === "gaps" && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Employees Evaluated
              </span>
              <p className="text-2xl font-bold text-hgv-navy mt-1">
                {gapData?.totalEmployeesAssessed ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Active workforce benchmarked</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Staff with Capability Gap
              </span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {gapData?.employeesWithGapsCount ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Below required role benchmark</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-hgv-teal">
                Role Requirement Profiles
              </span>
              <p className="text-2xl font-bold text-hgv-teal mt-1">
                {gapData?.roleProfiles?.length ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Defined engineering baselines</p>
            </div>
          </div>

          {/* Top Ranked Organizational Gaps */}
          {gapData?.rankedOrgGaps && gapData.rankedOrgGaps.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Organizational Priority Gaps (Training & Hiring Needs)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {gapData.rankedOrgGaps.slice(0, 6).map((g: any, i: number) => (
                  <div
                    key={g.skillId}
                    className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        #{i + 1} {g.skillName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {g.peopleWithGapCount} employee(s) have gap
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-red-600 block">
                        Gap: -{g.totalGapSum}
                      </span>
                      {g.mustHaveGapCount > 0 && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-red-200 text-red-900 font-bold">
                          MUST HAVE
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee-Level Gap Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy">
                  Workforce Gap Analysis (Required Level − Validated Level)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Automatic evaluation: Gap = MAX(0, Required − Current). Green = Met, Amber = Gap.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Role Benchmark</th>
                    <th className="py-2.5 px-4">Skill Gaps Detail</th>
                    <th className="py-2.5 px-4 text-center">Skills with Gap</th>
                    <th className="py-2.5 px-4 text-center">Total Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gapData?.employeeGaps?.map((emp: any) => {
                    const hasGap = emp.totalGap > 0;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/workforce/${emp.id}`} className="font-bold text-hgv-navy hover:underline">
                            {emp.name}
                          </Link>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {emp.employeeId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700 block">{emp.role}</span>
                          <span className="text-[10px] text-slate-400">
                            {emp.hasRoleProfile
                              ? `${emp.metRequirements}/${emp.totalRequirements} skills met`
                              : "No profile defined"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-lg">
                            {Object.entries(emp.skillGaps).map(([sId, g]: any) => (
                              <span
                                key={sId}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                                  g.gap === 0
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-amber-50 text-amber-900 border border-amber-300 font-bold"
                                }`}
                              >
                                {g.skillName}: {g.currentLevel}/{g.requiredLevel}
                                {g.gap > 0 && <span className="text-red-600">(-{g.gap})</span>}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              hasGap ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {emp.skillsWithGap}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-sm">
                          <span className={hasGap ? "text-red-600" : "text-emerald-600"}>
                            {emp.totalGap}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVE PROJECT ROSTERS & ALLOCATIONS (Requirements 3, 4, 5) */}
      {activeTab === "allocations" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-hgv-navy flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-hgv-sky" />
                Active Projects & Resource Allocations
              </h2>
              <p className="text-xs text-slate-500">
                Click any project below to open its full roster, view assigned resources & allocation percentages, or allocate available staff.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {permissions?.canEditWorkforce && (
                <button
                  type="button"
                  onClick={() => {
                    setCreateProjError(null);
                    setNewProjName("");
                    setNewProjDesc("");
                    setCreateProjModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-hgv-navy bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setDrawerError(null);
                  setIsStaffingDrawerOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-hgv-teal hover:bg-hgv-teal/90 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open Staffing Workbench</span>
              </button>
            </div>
          </div>

          {/* Grouped Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectsList.length > 0 ? (
              projectsList.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-hgv-teal/60 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-hgv-navy text-white font-bold flex items-center justify-center shrink-0 text-sm">
                          {proj.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/projects/${proj.id}`}
                            className="font-bold text-sm text-hgv-navy hover:text-hgv-teal hover:underline flex items-center gap-1.5"
                          >
                            <span>{proj.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-hgv-teal" />
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {proj.code && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {proj.code}
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              {proj.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-hgv-navy block">
                          {proj.confirmedFte.toFixed(2)} FTE
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {proj.confirmedCount} Confirmed{proj.draftCount > 0 ? ` • ${proj.draftCount} Draft` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Resources Preview Pills */}
                    {proj.allocations && proj.allocations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                        {proj.allocations.map((a: any) => (
                          <Link
                            key={a.id}
                            href={`/workforce/${a.employee?.id}`}
                            className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition ${
                              a.status === "CONFIRMED"
                                ? "bg-slate-50 text-slate-700 border-slate-200 hover:border-hgv-teal"
                                : "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400"
                            }`}
                          >
                            {a.employee?.employeeName} • {Math.round(a.allocationPct * 100)}%
                            {a.status === "DRAFT" ? " (Draft)" : ""}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
                        No resources allocated yet.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400">
                      Total Resources: {proj.totalResources}
                    </span>
                    <Link
                      href={`/projects/${proj.id}`}
                      className="text-xs font-bold text-hgv-teal hover:underline flex items-center gap-1"
                    >
                      View Resource Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-10 text-center bg-white rounded-xl border border-slate-200">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No projects recorded yet. Create one to start allocating resources.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW PROJECT MODAL (With Duplicate Project Name Validation - Requirement 3) */}
      {createProjModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-hgv-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-hgv-teal" />
                <h3 className="text-sm font-bold">Create New Project</h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateProjModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-6 space-y-4 text-xs">
              {createProjError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{createProjError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Project Name <span className="text-hgv-coral">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HGV 04, Hospitality Data Lake..."
                  value={newProjName}
                  onChange={(e) => {
                    setNewProjName(e.target.value);
                    setCreateProjError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-hgv-teal"
                />
                {newProjName.trim() &&
                  projectsList.some(
                    (p) => p.name.trim().toLowerCase() === newProjName.trim().toLowerCase()
                  ) && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Duplicate project name: A project with this name already exists.
                    </p>
                  )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client / Account</label>
                <input
                  type="text"
                  value={newProjClient}
                  onChange={(e) => setNewProjClient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Scope, goals, and key deliverables..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateProjModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    creatingProj ||
                    !newProjName.trim() ||
                    projectsList.some(
                      (p) => p.name.trim().toLowerCase() === newProjName.trim().toLowerCase()
                    )
                  }
                  className="px-4 py-1.5 font-bold text-white bg-hgv-teal hover:bg-hgv-teal/90 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {creatingProj ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OUT STAFFING WORKBENCH DRAWER */}
      {isStaffingDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-hgv-navy text-white">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-hgv-teal" />
                <h3 className="text-sm font-bold">Project Staffing Workbench</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffingDrawerOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {drawerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{drawerError}</span>
                </div>
              )}

              {/* Project Selection Mode: Existing vs New */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Target Project <span className="text-hgv-coral">*</span>
                  </label>
                  <div className="flex rounded-md bg-slate-100 p-0.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerProjectMode("existing");
                        setDrawerError(null);
                      }}
                      className={`px-2 py-0.5 rounded transition ${
                        drawerProjectMode === "existing"
                          ? "bg-white text-hgv-navy shadow-2xs font-bold"
                          : "text-slate-500"
                      }`}
                    >
                      Existing Project
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerProjectMode("new");
                        setDrawerError(null);
                      }}
                      className={`px-2 py-0.5 rounded transition ${
                        drawerProjectMode === "new"
                          ? "bg-white text-hgv-navy shadow-2xs font-bold"
                          : "text-slate-500"
                      }`}
                    >
                      + New Project
                    </button>
                  </div>
                </div>

                {drawerProjectMode === "existing" ? (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setDrawerError(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-hgv-teal"
                  >
                    <option value="">-- Select an existing project --</option>
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.confirmedCount} Confirmed)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Enter new unique project name..."
                      value={draftProjectName}
                      onChange={(e) => {
                        setDraftProjectName(e.target.value);
                        setDrawerError(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-hgv-teal"
                    />
                    {draftProjectName.trim() &&
                      projectsList.some(
                        (p) => p.name.trim().toLowerCase() === draftProjectName.trim().toLowerCase()
                      ) && (
                        <p className="text-[10px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Project already exists! Switch to "Existing Project" to add resources.
                        </p>
                      )}
                  </div>
                )}
              </div>

              {/* Candidate Shortlist */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Shortlisted Candidates ({draftCandidates.length})
                </label>

                {draftCandidates.length > 0 ? (
                  draftCandidates.map((c) => {
                    const totalProjectedPct = Math.round((c.currentAllocation + c.proposedAllocation) * 100);
                    const isOver = totalProjectedPct > 100;
                    const maxAllowed = Math.max(0, Math.round((1.0 - c.currentAllocation) * 100) / 100);

                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500">
                              {c.role} • Existing: {Math.round(c.currentAllocation * 100)}% • Max Free: {Math.round(maxAllowed * 100)}%
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftCandidate(c.id)}
                            className="text-slate-400 hover:text-red-500"
                            title="Remove candidate"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Proposed Allocation Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">Proposed Allocation:</span>
                            <span className="font-bold text-hgv-navy">
                              {Math.round(c.proposedAllocation * 100)}% ({c.proposedAllocation.toFixed(2)} FTE)
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max={Math.max(0.05, maxAllowed)}
                            step="0.05"
                            value={c.proposedAllocation}
                            onChange={(e) =>
                              handleUpdateDraftCandidate(c.id, "proposedAllocation", parseFloat(e.target.value))
                            }
                            className="w-full accent-hgv-teal"
                          />
                        </div>

                        {/* Over-allocation Guard */}
                        {isOver && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-[10px] text-red-700 flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>
                              Over-allocation blocked: Projected {totalProjectedPct}% exceeds 100% limit!
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                    No candidates drafted yet. Click "+ Add to Project Draft" from the Talent Matcher tab.
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            {(() => {
              const anyOver = draftCandidates.some(
                (c) => Math.round((c.currentAllocation + c.proposedAllocation) * 100) > 100
              );
              const dupNewProj =
                drawerProjectMode === "new" &&
                draftProjectName.trim() !== "" &&
                projectsList.some(
                  (p) => p.name.trim().toLowerCase() === draftProjectName.trim().toLowerCase()
                );

              return (
                <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={savingRoster || draftCandidates.length === 0 || anyOver || dupNewProj}
                      onClick={() => handleSaveRoster("DRAFT")}
                      className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition disabled:opacity-50"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      disabled={savingRoster || draftCandidates.length === 0 || anyOver || dupNewProj}
                      onClick={() => handleSaveRoster("CONFIRMED")}
                      className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition disabled:opacity-50"
                    >
                      Finalize & Commit
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
