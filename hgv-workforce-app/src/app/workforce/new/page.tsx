"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  UserPlus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  X,
} from "lucide-react";
import { SearchableDomainLeadSelect } from "@/components/ui/SearchableDomainLeadSelect";

export default function NewEmployeePage() {
  const router = useRouter();
  const { permissions } = useAuth();

  // Form State
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
  const [businessUnit, setBusinessUnit] = useState("Hospitality Tech");
  const [practice, setPractice] = useState("");
  const [gradeLevel, setGradeLevel] = useState("L3");
  const [project, setProject] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [hgvStartDate, setHgvStartDate] = useState("2026-08-01");
  const [shiftTypeId, setShiftTypeId] = useState("");

  // Compensation
  const [fixedCtcInrAnnual, setFixedCtcInrAnnual] = useState("2400000");
  const [variablePayMode, setVariablePayMode] = useState("FLAT_PERCENT");
  const [variablePayPercent, setVariablePayPercent] = useState("5.0");
  const [variablePayCustomInrMonthly, setVariablePayCustomInrMonthly] = useState("");
  const [joiningBonusInr, setJoiningBonusInr] = useState("0");

  // Contact / Address
  const [personalEmail, setPersonalEmail] = useState("");
  const [hgvEmail, setHgvEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [baseLocation, setBaseLocation] = useState("Hyderabad");

  // Reference options
  const [domainLeads, setDomainLeads] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);

  // Add New modal state
  const [modalType, setModalType] = useState<"lead" | "source" | null>(null);
  const [newRefName, setNewRefName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllRefs() {
      try {
        const res = await fetch("/api/v1/reference/all");
        if (res.ok) {
          const json = await res.json();
          setDomainLeads(json.domainLeads);
          setSources(json.sources);
          setShiftTypes(json.shiftTypes);
          if (json.domainLeads.length > 0) setDomainLeadId(json.domainLeads[0].id);
          if (json.sources.length > 0) setSourceId(json.sources[0].id);
          if (json.shiftTypes.length > 0) setShiftTypeId(json.shiftTypes[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAllRefs();
  }, []);

  const handleAddNewRef = async () => {
    if (!newRefName.trim() || !modalType) return;
    try {
      const endpoint = modalType === "lead" ? "domain-leads" : "sources";
      const res = await fetch(`/api/v1/reference/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRefName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        if (modalType === "lead") {
          setDomainLeads([...domainLeads, data]);
          setDomainLeadId(data.id);
        } else {
          setSources([...sources, data]);
          setSourceId(data.id);
        }
        setNewRefName("");
        setModalType(null);
      } else {
        alert(data.error || "Failed to add reference item");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
        businessUnit: businessUnit || null,
        practice: practice || null,
        gradeLevel: gradeLevel || null,
        project: project || null,
        sourceId,
        hgvStartDate: hgvStartDate || null,
        shiftTypeId: shiftTypeId || null,
        fixedCtcInrAnnual: fixedCtcInrAnnual ? parseFloat(fixedCtcInrAnnual) : 0,
        variablePayMode,
        variablePayPercent: variablePayPercent ? parseFloat(variablePayPercent) : null,
        variablePayCustomInrMonthly: variablePayCustomInrMonthly ? parseFloat(variablePayCustomInrMonthly) : null,
        joiningBonusInr: joiningBonusInr ? parseFloat(joiningBonusInr) : 0,
        personalEmail,
        hgvEmail,
        mobile,
        baseLocation,
      };

      const res = await fetch("/api/v1/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create employee");
      }

      router.push(`/workforce/${json.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (permissions && !permissions.canEditWorkforce) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-hgv-coral mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Access Denied</h2>
        <p className="text-xs text-slate-500 mt-1">
          Your role ({permissions.canEditWorkforce ? "" : "GCC Lead"}) is authorized for read-only access.
        </p>
        <Link href="/workforce" className="mt-4 inline-block text-xs text-hgv-teal font-semibold hover:underline">
          Return to Workforce
        </Link>
      </div>
    );
  }

  // Dynamic mandatory flags based on engagementType
  const isGccOrNoc = engagementType === "GCC" || engagementType === "NOC";
  const isRebadgeColo = engagementType === "Rebadge" || engagementType === "Colocation";
  const isNonGcc = engagementType === "Non-GCC";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        crumbs={[
          { label: "Workforce", href: "/workforce" },
          { label: "Add Employee" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Add Workforce Record</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture employee identity, organization, sourcing, and compensation with dynamic engagement rules.
          </p>
        </div>
        <Link
          href="/workforce"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Cancel
        </Link>
      </div>

      {/* Dynamic Rule Alert Banner */}
      <div className="bg-hgv-sky/20 border border-hgv-sky rounded-xl p-3.5 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-hgv-navy shrink-0 mt-0.5" />
        <div className="text-slate-700">
          <span className="font-semibold text-hgv-navy">Dynamic Mandatory Rules for {engagementType}:</span>{" "}
          {isGccOrNoc && (
            <span>
              Requires <strong>Employee ID</strong>, <strong>HGV Start Date</strong>, <strong>Department</strong>,{" "}
              <strong>Employment Category</strong>, <strong>Fixed CTC</strong>, and <strong>Shift Type</strong>.
            </span>
          )}
          {isRebadgeColo && (
            <span>
              Requires <strong>HGV Start Date</strong>, <strong>Department</strong>, and <strong>Shift Type</strong>.
              Employee ID and CTC are optional (Facility & User Bundle billing applied).
            </span>
          )}
          {isNonGcc && (
            <span>
              Requires <strong>Employee ID</strong>, <strong>Employment Category</strong>, and <strong>Project</strong>.
              (Billing calculated outside platform).
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identity & Employment */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2">
            1. Identity & Employment
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
                placeholder="e.g. Nimmi K Cherian"
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
                <option value="GCC">GCC (Salary + Loaded Billing)</option>
                <option value="NOC">NOC (Operations)</option>
                <option value="Rebadge">Rebadge (Facility/Bundle Billing)</option>
                <option value="Colocation">Colocation (Facility/Bundle Billing)</option>
                <option value="Non-GCC">Non-GCC Fixed Bid (External Billing)</option>
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
                placeholder="e.g. IN01806551"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Oracle Person Number
              </label>
              <input
                type="text"
                value={oraclePersonNumber}
                onChange={(e) => setOraclePersonNumber(e.target.value)}
                placeholder="e.g. 2130101"
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
                Employment Category {(isGccOrNoc || isNonGcc) && <span className="text-hgv-coral">*</span>}
              </label>
              <select
                value={employmentCategory}
                onChange={(e) => setEmploymentCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              >
                <option value="Full Time">Full Time</option>
                <option value="Individual Consultant">Individual Consultant</option>
                <option value="C2C Consultant">C2C Consultant</option>
                <option value="Rebadge">Rebadge</option>
                <option value="Colocation">Colocation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GCC Presence <span className="text-hgv-coral">*</span>
              </label>
              <select
                value={gccPresence ? "true" : "false"}
                onChange={(e) => setGccPresence(e.target.value === "true")}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              >
                <option value="true">Yes (Direct GCC Presence)</option>
                <option value="false">No (External / Non-GCC)</option>
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

        {/* Section 2: Organization & Sourcing */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2">
            2. Organization & Sourcing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HGV Role / Designation <span className="text-hgv-coral">*</span>
              </label>
              <input
                type="text"
                required
                value={hgvRole}
                onChange={(e) => setHgvRole(e.target.value)}
                placeholder="e.g. ETL/SQL QA"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HGV Department {(isGccOrNoc || isRebadgeColo) && <span className="text-hgv-coral">*</span>}
              </label>
              <input
                type="text"
                required={isGccOrNoc || isRebadgeColo}
                value={hgvDepartment}
                onChange={(e) => setHgvDepartment(e.target.value)}
                placeholder="e.g. Quality Assurance"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            {/* Controlled Domain Lead with Add New */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Domain Lead <span className="text-hgv-coral">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setModalType("lead")}
                  className="text-[10px] text-hgv-teal font-semibold hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" /> Add New
                </button>
              </div>
              <SearchableDomainLeadSelect
                domainLeads={domainLeads}
                value={domainLeadId}
                onChange={(id) => setDomainLeadId(id)}
                onAddNew={() => setModalType("lead")}
                required
              />
            </div>

            {/* Controlled Source with Add New */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Source <span className="text-hgv-coral">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setModalType("source")}
                  className="text-[10px] text-hgv-teal font-semibold hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" /> Add New
                </button>
              </div>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reporting Manager
              </label>
              <input
                type="text"
                value={reportingManager}
                onChange={(e) => setReportingManager(e.target.value)}
                placeholder="e.g. Sue Pawa"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
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
                    {st.name} (Default ${st.defaultRate}/mo)
                  </option>
                ))}
              </select>
            </div>

            {/* Project (Required for Non-GCC) */}
            {isNonGcc && (
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Name <span className="text-hgv-coral">* (Mandatory for Non-GCC)</span>
                </label>
                <input
                  type="text"
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. HGV Core PCI DSS Remediation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Compensation (Only for GCC / NOC) */}
        {isGccOrNoc && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>3. Compensation Details (GCC / NOC)</span>
              <span className="text-[10px] text-emerald-600 font-normal">
                Monthly fixed salary derived as Annual ÷ 12
              </span>
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
                  placeholder="2400000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Monthly: ₹{Math.round((parseFloat(fixedCtcInrAnnual) || 0) / 12).toLocaleString("en-IN")}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Variable Pay Mode <span className="text-hgv-coral">*</span>
                </label>
                <select
                  value={variablePayMode}
                  onChange={(e) => setVariablePayMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                >
                  <option value="NONE">None (0%)</option>
                  <option value="FLAT_PERCENT">Flat % (Applied to monthly fixed)</option>
                  <option value="CUSTOM_AMOUNT">Custom Monthly Amount</option>
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
                    placeholder="5.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Applied to monthly fixed salary</p>
                </div>
              )}

              {variablePayMode === "CUSTOM_AMOUNT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Custom Amount (INR)
                  </label>
                  <input
                    type="number"
                    value={variablePayCustomInrMonthly}
                    onChange={(e) => setVariablePayCustomInrMonthly(e.target.value)}
                    placeholder="25000"
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
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Amortized 1/3 per month in Months 1, 2, and 3
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Contact & Location */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2">
            4. Contact & Location
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Personal Email
              </label>
              <input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HGV Email
              </label>
              <input
                type="email"
                value={hgvEmail}
                onChange={(e) => setHgvEmail(e.target.value)}
                placeholder="name@hgv.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Location
              </label>
              <input
                type="text"
                value={baseLocation}
                onChange={(e) => setBaseLocation(e.target.value)}
                placeholder="Hyderabad"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/workforce"
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-hgv-teal" />
            <span>{loading ? "Creating..." : "Save Employee Record"}</span>
          </button>
        </div>
      </form>

      {/* Add New Reference Value Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-hgv-navy uppercase tracking-wider">
                Add New {modalType === "lead" ? "Domain Lead" : "Source"}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Name / Label
              </label>
              <input
                type="text"
                value={newRefName}
                onChange={(e) => setNewRefName(e.target.value)}
                placeholder={`Enter new ${modalType === "lead" ? "lead name" : "source name"}`}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewRef}
                className="px-4 py-1.5 text-xs font-bold text-white bg-hgv-teal hover:bg-hgv-teal-dark rounded-lg shadow-xs"
              >
                Add & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
