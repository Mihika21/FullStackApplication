"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  MoreVertical,
  DollarSign,
  Edit,
  Eye,
} from "lucide-react";
import { SearchableDomainLeadSelect } from "@/components/ui/SearchableDomainLeadSelect";

export default function WorkforceListPage() {
  const router = useRouter();
  const { permissions } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [engagementType, setEngagementType] = useState("");
  const [domainLeadId, setDomainLeadId] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("");
  const [gccPresence, setGccPresence] = useState("");
  const [page, setPage] = useState(1);

  // Reference lists
  const [domainLeads, setDomainLeads] = useState<any[]>([]);

  useEffect(() => {
    async function loadRefs() {
      try {
        const res = await fetch("/api/v1/reference/domain-leads");
        if (res.ok) setDomainLeads(await res.json());
      } catch (e) {
        console.error(e);
      }
    }
    loadRefs();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (engagementType) params.append("engagementType", engagementType);
      if (domainLeadId) params.append("domainLeadId", domainLeadId);
      if (assignmentStatus) params.append("assignmentStatus", assignmentStatus);
      if (gccPresence) params.append("gccPresence", gccPresence);
      params.append("page", page.toString());
      params.append("limit", "50");

      const res = await fetch(`/api/v1/employees?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.data);
        setTotal(json.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, engagementType, domainLeadId, assignmentStatus, gccPresence, page]);

  const getEngagementBadge = (type: string) => {
    switch (type) {
      case "GCC":
        return "bg-hgv-navy/10 text-hgv-navy border-hgv-navy/20 font-bold";
      case "NOC":
        return "bg-hgv-teal/15 text-hgv-teal-dark border-hgv-teal/30 font-bold";
      case "Rebadge":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Colocation":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Non-GCC":
        return "bg-slate-100 text-slate-700 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs crumbs={[{ label: "Workforce" }]} />

      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Workforce Master Data</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain, validate, and track employee lifecycle and compensation records ({total} total records).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/api/v1/reports/master-data?format=excel"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </Link>

          {permissions?.canEditWorkforce && (
            <Link
              href="/workforce/new"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-xs font-semibold text-white transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-hgv-teal" />
              <span>Add Employee</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, ID, role..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
            />
          </div>

          {/* Engagement Type */}
          <select
            value={engagementType}
            onChange={(e) => {
              setEngagementType(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
          >
            <option value="">All Engagements</option>
            <option value="GCC">GCC (Salary + Loaded)</option>
            <option value="NOC">NOC (Operations)</option>
            <option value="Rebadge">Rebadge (Facility/Bundle)</option>
            <option value="Colocation">Colocation (Facility/Bundle)</option>
            <option value="Non-GCC">Non-GCC Fixed Bid (External)</option>
          </select>

          {/* Domain Lead */}
          <SearchableDomainLeadSelect
            domainLeads={domainLeads}
            value={domainLeadId}
            onChange={(id) => {
              setDomainLeadId(id);
              setPage(1);
            }}
            placeholder="All Domain Leads"
            allowClear={true}
            className="w-44"
          />

          {/* Status */}
          <select
            value={assignmentStatus}
            onChange={(e) => {
              setAssignmentStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
          >
            <option value="">All Statuses</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="Notice Period">Notice Period</option>
            <option value="On Leave">On Leave</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
            <option value="Inactive">Inactive (Historical Attrition)</option>
          </select>

          {/* GCC Presence */}
          <select
            value={gccPresence}
            onChange={(e) => {
              setGccPresence(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
          >
            <option value="">All GCC Presence</option>
            <option value="true">GCC Presence: Yes</option>
            <option value="false">GCC Presence: No</option>
          </select>
        </div>
      </div>

      {/* Workforce Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Engagement</th>
                <th className="py-3 px-4">Role & Department</th>
                <th className="py-3 px-4">Domain Lead</th>
                <th className="py-3 px-4">Shift Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">GCC Presence</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading workforce records...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No workforce records found matching the specified filters.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => router.push(`/workforce/${emp.id}`)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {emp.employeeId || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-hgv-navy group-hover:text-hgv-teal transition">
                      {emp.employeeName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] border ${getEngagementBadge(
                          emp.engagementType
                        )}`}
                      >
                        {emp.engagementType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{emp.hgvRole}</div>
                      <div className="text-[11px] text-slate-400">
                        {emp.hgvDepartment || emp.project || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {emp.domainLead?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.shiftType?.name || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          emp.assignmentStatus === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : emp.assignmentStatus === "Onboarding"
                            ? "bg-sky-50 text-sky-700 border-sky-200 font-bold"
                            : emp.assignmentStatus === "Probation"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : emp.assignmentStatus === "Notice Period"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : emp.assignmentStatus === "On Leave"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {emp.assignmentStatus === "Active" ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : (
                          <Clock className="w-2.5 h-2.5" />
                        )}
                        {emp.assignmentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          emp.gccPresence
                            ? "bg-hgv-teal/10 text-hgv-teal font-semibold"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {emp.gccPresence ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/workforce/${emp.id}/billing`}
                          title="View Compensation & Billing"
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </Link>
                        {permissions?.canEditWorkforce && (
                          <Link
                            href={`/workforce/${emp.id}/edit`}
                            title="Edit Record"
                            className="p-1 rounded text-slate-400 hover:text-hgv-navy hover:bg-slate-100 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/workforce/${emp.id}`}
                          title="View Details"
                          className="p-1 rounded text-slate-400 hover:text-hgv-teal hover:bg-slate-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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
