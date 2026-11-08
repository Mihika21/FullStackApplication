"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Building2,
  DollarSign,
  FileText,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Edit,
  UserX,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Plus,
  UploadCloud,
} from "lucide-react";
import { DocumentUploadModal } from "@/components/workforce/DocumentUploadModal";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { permissions } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Deactivate modal state
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [attritionReason, setAttritionReason] = useState("Better Opportunity");
  const [attritionDate, setAttritionDate] = useState(new Date().toISOString().slice(0, 10));
  const [attritionNotes, setAttritionNotes] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/employees/${params.id}`);
      if (res.ok) {
        setEmployee(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);


  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDeactivating(true);
      const res = await fetch(`/api/v1/employees/${params.id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attritionReason,
          attritionDate,
          notes: attritionNotes,
        }),
      });

      if (res.ok) {
        setDeactivateModalOpen(false);
        // Refresh employee data
        const refresh = await fetch(`/api/v1/employees/${params.id}`);
        if (refresh.ok) setEmployee(await refresh.json());
      } else {
        const json = await res.json();
        alert(json.error || "Failed to deactivate employee");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl col-span-2"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Employee Record Not Found</h2>
        <Link href="/workforce" className="mt-3 inline-block text-xs text-hgv-teal font-semibold hover:underline">
          Return to Workforce List
        </Link>
      </div>
    );
  }

  const latestComp = employee.compensations?.[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs
        crumbs={[
          { label: "Workforce", href: "/workforce" },
          { label: employee.employeeName },
        ]}
      />

      {/* Header Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-hgv-navy text-white text-xl font-bold flex items-center justify-center shrink-0 shadow-sm">
              {employee.employeeName.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-hgv-navy">{employee.employeeName}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-hgv-navy/10 text-hgv-navy border border-hgv-navy/20">
                  {employee.engagementType}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    employee.assignmentStatus === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : employee.assignmentStatus === "Onboarding"
                      ? "bg-sky-50 text-sky-700 border-sky-200 font-bold"
                      : employee.assignmentStatus === "Probation"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : employee.assignmentStatus === "Notice Period"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : employee.assignmentStatus === "On Leave"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {employee.assignmentStatus === "Active" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {employee.assignmentStatus}
                </span>
                {employee.gccPresence && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-hgv-teal/15 text-hgv-teal-dark font-semibold">
                    GCC Dedicated
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 font-medium mt-1">
                {employee.hgvRole} • {employee.hgvDepartment || employee.project || "General Operations"}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1.5">
                <span>Employee ID: <strong className="text-slate-700">{employee.employeeId || "—"}</strong></span>
                <span>Oracle #: <strong className="text-slate-700">{employee.oraclePersonNumber || "—"}</strong></span>
                <span>Domain Lead: <strong className="text-slate-700">{employee.domainLead?.name || "—"}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/workforce/${employee.id}/billing`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Billing & Cost</span>
            </Link>

            {permissions?.canEditWorkforce && (
              <Link
                href={`/workforce/${employee.id}/edit`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </Link>
            )}

            {permissions?.canEditWorkforce && employee.assignmentStatus === "Active" && (
              <button
                type="button"
                onClick={() => setDeactivateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-hgv-coral hover:bg-red-50 text-xs font-semibold transition"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Deactivate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 2 columns for deep employee master data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Employment & Organization */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-4">
              Employment & Organization Assignment
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Engagement Type</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{employee.engagementType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Employment Category</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{employee.employmentCategory || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Gender</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{employee.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">HGV Department</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{employee.hgvDepartment || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Domain Lead</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{employee.domainLead?.name || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Reporting Manager</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{employee.reportingManager || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Source</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{employee.source?.name || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Shift Type</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{employee.shiftType?.name || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">HGV Start Date</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {employee.hgvStartDate ? new Date(employee.hgvStartDate).toLocaleDateString() : "—"}
                </span>
              </div>
              {employee.project && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Project Name (Non-GCC)</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{employee.project}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Compensation Snapshot */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy">
                Compensation Details (Active Record)
              </h2>
              <Link
                href={`/workforce/${employee.id}/billing`}
                className="text-[11px] text-hgv-teal font-semibold hover:underline flex items-center gap-1"
              >
                Detailed Billing Engine Breakdown <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {employee.engagementType === "Non-GCC" ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500">
                Non-GCC Fixed Bid population: <strong>Billing calculated outside platform</strong>.
              </div>
            ) : employee.engagementType === "Rebadge" || employee.engagementType === "Colocation" ? (
              <div className="p-4 rounded-lg bg-sky-50 border border-sky-100 text-xs text-sky-800">
                {employee.engagementType} model: Billed under Facility Cost & User Bundle Cost. No employee salary calculation.
              </div>
            ) : latestComp ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Annual Fixed CTC</span>
                  <span className="font-bold text-hgv-navy text-sm mt-0.5 block">
                    ₹{latestComp.fixedCtcInrAnnual?.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Monthly Fixed Salary</span>
                  <span className="font-bold text-hgv-navy text-sm mt-0.5 block">
                    ₹{Math.round(latestComp.fixedCtcInrAnnual / 12).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Variable Pay Mode</span>
                  <span className="font-bold text-slate-700 text-sm mt-0.5 block">
                    {latestComp.variablePayMode === "FLAT_PERCENT"
                      ? `${latestComp.variablePayPercent || 5}% Flat`
                      : latestComp.variablePayMode === "CUSTOM_AMOUNT"
                      ? `₹${latestComp.variablePayCustomInrMonthly?.toLocaleString("en-IN")}`
                      : "None"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Joining Bonus</span>
                  <span className="font-bold text-slate-700 text-sm mt-0.5 block">
                    ₹{latestComp.joiningBonusInr?.toLocaleString("en-IN") || 0}
                  </span>
                  <span className="text-[9px] text-slate-400">Amortized over 3 months</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active compensation record found.</p>
            )}
          </div>

          {/* Section: Historical Attrition (if inactive) */}
          {employee.attritions && employee.attritions.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 mb-3">
                Lifecycle & Attrition History
              </h2>
              <div className="space-y-3">
                {employee.attritions.map((att: any) => (
                  <div key={att.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>Reason: {att.attritionReason}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Date: {new Date(att.attritionDate).toLocaleDateString()}
                      </span>
                    </div>
                    {att.notes && <p className="text-[11px] text-slate-500 mt-1">{att.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contact & Compliance */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2">
              Contact & Address
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{employee.contact?.hgvEmail || employee.contact?.personalEmail || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{employee.contact?.mobile || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{employee.address?.baseLocation || "Hyderabad, India"}</span>
              </div>
            </div>
          </div>

          {/* Compliance & Sensitive Documents (Masked) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy">
                  Compliance & Documents
                </h2>
                <span className="text-[10px] text-slate-400">PII Masked</span>
              </div>
              {permissions?.canEditWorkforce && (
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-hgv-teal hover:bg-hgv-teal/90 rounded-md shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Upload Document
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">BGV Verification</span>
                <span className="font-semibold text-emerald-600">{employee.bgvStatus || "Passed"}</span>
              </div>

              {employee.documents && employee.documents.length > 0 ? (
                employee.documents.map((doc: any) => (
                  <div key={doc.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-semibold text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-hgv-teal shrink-0" />
                        {doc.documentType}
                      </span>
                      <span className="font-mono text-slate-700 font-semibold text-xs">{doc.documentNumber}</span>
                    </div>
                    {(doc.fileName || doc.fileSize || doc.createdAt) && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="truncate max-w-[140px] text-slate-500">{doc.fileName || "Stored file"}</span>
                        <span>{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB • ` : ""}{new Date(doc.createdAt || doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 py-1">No additional compliance documents uploaded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Attrition Modal */}
      {deactivateModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-hgv-navy">Deactivate Employee Record</h3>
              <button
                type="button"
                onClick={() => setDeactivateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              This marks <strong>{employee.employeeName}</strong> as Inactive in the workforce master dataset.
              The record will be preserved for historical reporting and financial continuity.
            </p>

            <form onSubmit={handleDeactivate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attrition Reason <span className="text-hgv-coral">*</span>
                </label>
                <select
                  value={attritionReason}
                  onChange={(e) => setAttritionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                >
                  <option value="Better Opportunity">Better Opportunity / Resignation</option>
                  <option value="Relocation abroad">Relocation abroad / Family</option>
                  <option value="Higher Education">Higher Education</option>
                  <option value="Contract Ended">Contract Ended / Project Completion</option>
                  <option value="Performance / Separation">Mutual Separation</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attrition Date <span className="text-hgv-coral">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={attritionDate}
                  onChange={(e) => setAttritionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exit Handover Notes
                </label>
                <textarea
                  rows={2}
                  value={attritionNotes}
                  onChange={(e) => setAttritionNotes(e.target.value)}
                  placeholder="Exit interview completed, assets returned..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeactivateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deactivating}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-hgv-coral hover:bg-hgv-coral-dark rounded-lg shadow-xs disabled:opacity-50"
                >
                  {deactivating ? "Deactivating..." : "Confirm Deactivation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal with Live Preview & Confirmation */}
      {employee && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          employeeId={employee.id}
          employeeName={employee.employeeName}
          onSuccess={fetchEmployee}
        />
      )}
    </div>
  );
}

