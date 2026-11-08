"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Info,
} from "lucide-react";
import { SearchableDomainLeadSelect } from "@/components/ui/SearchableDomainLeadSelect";

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { permissions } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [oraclePersonNumber, setOraclePersonNumber] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("Active");
  const [gender, setGender] = useState("Female");
  const [engagementType, setEngagementType] = useState("GCC");
  const [employmentCategory, setEmploymentCategory] = useState("Full Time");
  const [gccPresence, setGccPresence] = useState(true);
  const [hgvRole, setHgvRole] = useState("");
  const [hgvDepartment, setHgvDepartment] = useState("");
  const [domainLeadId, setDomainLeadId] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [project, setProject] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [hgvStartDate, setHgvStartDate] = useState("");
  const [shiftTypeId, setShiftTypeId] = useState("");

  // Compensation
  const [fixedCtcInrAnnual, setFixedCtcInrAnnual] = useState("");
  const [variablePayMode, setVariablePayMode] = useState("FLAT_PERCENT");
  const [variablePayPercent, setVariablePayPercent] = useState("5.0");
  const [variablePayCustomInrMonthly, setVariablePayCustomInrMonthly] = useState("");
  const [joiningBonusInr, setJoiningBonusInr] = useState("0");

  // References
  const [domainLeads, setDomainLeads] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [refRes, empRes] = await Promise.all([
          fetch("/api/v1/reference/all"),
          fetch(`/api/v1/employees/${params.id}`),
        ]);

        if (refRes.ok) {
          const refs = await refRes.json();
          setDomainLeads(refs.domainLeads);
          setSources(refs.sources);
          setShiftTypes(refs.shiftTypes);
        }

        if (empRes.ok) {
          const emp = await empRes.json();
          setEmployeeName(emp.employeeName);
          setEmployeeId(emp.employeeId || "");
          setOraclePersonNumber(emp.oraclePersonNumber || "");
          setAssignmentStatus(emp.assignmentStatus);
          setGender(emp.gender);
          setEngagementType(emp.engagementType);
          setEmploymentCategory(emp.employmentCategory || "Full Time");
          setGccPresence(Boolean(emp.gccPresence));
          setHgvRole(emp.hgvRole);
          setHgvDepartment(emp.hgvDepartment || "");
          setDomainLeadId(emp.domainLeadId);
          setReportingManager(emp.reportingManager || "");
          setProject(emp.project || "");
          setSourceId(emp.sourceId);
          setShiftTypeId(emp.shiftTypeId || "");
          if (emp.hgvStartDate) {
            setHgvStartDate(new Date(emp.hgvStartDate).toISOString().slice(0, 10));
          }

          const comp = emp.compensations?.[0];
          if (comp) {
            setFixedCtcInrAnnual(comp.fixedCtcInrAnnual.toString());
            setVariablePayMode(comp.variablePayMode || "NONE");
            setVariablePayPercent(comp.variablePayPercent?.toString() || "5.0");
            setVariablePayCustomInrMonthly(comp.variablePayCustomInrMonthly?.toString() || "");
            setJoiningBonusInr(comp.joiningBonusInr?.toString() || "0");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        employeeName,
        employeeId: employeeId || null,
        oraclePersonNumber: oraclePersonNumber || null,
        assignmentStatus,
        gender,
        engagementType,
        employmentCategory,
        gccPresence,
        hgvRole,
        hgvDepartment: hgvDepartment || null,
        domainLeadId,
        reportingManager: reportingManager || null,
        project: project || null,
        sourceId,
        hgvStartDate: hgvStartDate || null,
        shiftTypeId: shiftTypeId || null,
        fixedCtcInrAnnual: fixedCtcInrAnnual ? parseFloat(fixedCtcInrAnnual) : 0,
        variablePayMode,
        variablePayPercent: variablePayPercent ? parseFloat(variablePayPercent) : null,
        variablePayCustomInrMonthly: variablePayCustomInrMonthly ? parseFloat(variablePayCustomInrMonthly) : null,
        joiningBonusInr: joiningBonusInr ? parseFloat(joiningBonusInr) : 0,
      };

      const res = await fetch(`/api/v1/employees/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update employee");
      }

      router.push(`/workforce/${params.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isGccOrNoc = engagementType === "GCC" || engagementType === "NOC";
  const isRebadgeColo = engagementType === "Rebadge" || engagementType === "Colocation";
  const isNonGcc = engagementType === "Non-GCC";

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading record details...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        crumbs={[
          { label: "Workforce", href: "/workforce" },
          { label: employeeName, href: `/workforce/${params.id}` },
          { label: "Edit Record" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Edit Workforce Record</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify identity, employment, and compensation attributes with audit tracing.
          </p>
        </div>
        <Link
          href={`/workforce/${params.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Profile
        </Link>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Employment */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2">
            Identity & Employment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee Name <span className="text-hgv-coral">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Engagement Type <span className="text-hgv-coral">*</span>
              </label>
              <select
                value={engagementType}
                onChange={(e) => setEngagementType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              >
                <option value="GCC">GCC</option>
                <option value="NOC">NOC</option>
                <option value="Rebadge">Rebadge</option>
                <option value="Colocation">Colocation</option>
                <option value="Non-GCC">Non-GCC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee ID {(isGccOrNoc || isNonGcc) && <span className="text-hgv-coral">*</span>}
              </label>
              <input
                type="text"
                required={isGccOrNoc || isNonGcc}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignment Status <span className="text-hgv-coral">*</span>
              </label>
              <select
                value={assignmentStatus}
                onChange={(e) => setAssignmentStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              >
                <option value="Onboarding">Onboarding</option>
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="Notice Period">Notice Period</option>
                <option value="On Leave">On Leave</option>
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-hgv-coral">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HGV Start Date {(isGccOrNoc || isRebadgeColo) && <span className="text-hgv-coral">*</span>}
              </label>
              <input
                type="date"
                required={isGccOrNoc || isRebadgeColo}
                value={hgvStartDate}
                onChange={(e) => setHgvStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2">
            Organization & Assignment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HGV Role <span className="text-hgv-coral">*</span>
              </label>
              <input
                type="text"
                required
                value={hgvRole}
                onChange={(e) => setHgvRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department {(isGccOrNoc || isRebadgeColo) && <span className="text-hgv-coral">*</span>}
              </label>
              <input
                type="text"
                required={isGccOrNoc || isRebadgeColo}
                value={hgvDepartment}
                onChange={(e) => setHgvDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Domain Lead <span className="text-hgv-coral">*</span>
              </label>
              <SearchableDomainLeadSelect
                domainLeads={domainLeads}
                value={domainLeadId}
                onChange={(id) => setDomainLeadId(id)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shift Type {(isGccOrNoc || isRebadgeColo) && <span className="text-hgv-coral">*</span>}
              </label>
              <select
                value={shiftTypeId}
                onChange={(e) => setShiftTypeId(e.target.value)}
                required={isGccOrNoc || isRebadgeColo}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              >
                <option value="">Select Shift Type</option>
                {shiftTypes.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {isNonGcc && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project <span className="text-hgv-coral">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                />
              </div>
            )}
          </div>
        </div>

        {/* Compensation (if GCC / NOC and authorized) */}
        {isGccOrNoc && permissions?.canEditCompensation && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2">
              Compensation Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Annual Fixed CTC (INR) <span className="text-hgv-coral">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={fixedCtcInrAnnual}
                  onChange={(e) => setFixedCtcInrAnnual(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Variable Pay Mode
                </label>
                <select
                  value={variablePayMode}
                  onChange={(e) => setVariablePayMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                >
                  <option value="NONE">None (0%)</option>
                  <option value="FLAT_PERCENT">Flat %</option>
                  <option value="CUSTOM_AMOUNT">Custom Amount</option>
                </select>
              </div>

              {variablePayMode === "FLAT_PERCENT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Variable Pay %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={variablePayPercent}
                    onChange={(e) => setVariablePayPercent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Joining Bonus (INR)
                </label>
                <input
                  type="number"
                  value={joiningBonusInr}
                  onChange={(e) => setJoiningBonusInr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/workforce/${params.id}`}
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-hgv-teal" />
            <span>{saving ? "Saving Changes..." : "Save Record"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
