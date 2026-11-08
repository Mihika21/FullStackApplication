"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  Search,
  User,
  Building2,
  ArrowRight,
  AlertCircle,
  Briefcase,
  Layers,
} from "lucide-react";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ employees: any[]; domainLeads: any[] }>({
    employees: [],
    domainLeads: [],
  });

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults({ employees: [], domainLeads: [] });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      performSearch(query);
    }
  };

  const totalResults = (results.employees?.length || 0) + (results.domainLeads?.length || 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs crumbs={[{ label: "Global Search" }]} />

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by employee name, employee ID, Oracle number, role, department, or domain lead..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-28 py-3.5 text-sm text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-hgv-teal/40 focus:border-hgv-teal transition"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-hgv-navy text-white text-xs font-semibold hover:bg-hgv-navy-light transition"
        >
          Search
        </button>
      </form>

      {/* Results Header */}
      {query && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            {loading ? "Searching platform index..." : `Found ${totalResults} matching results for "${query}"`}
          </span>
        </div>
      )}

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 bg-white rounded-xl border border-slate-200"></div>
          <div className="h-16 bg-white rounded-xl border border-slate-200"></div>
          <div className="h-16 bg-white rounded-xl border border-slate-200"></div>
        </div>
      )}

      {!loading && query && totalResults === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-800">No matching records found</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try checking for spelling, employee ID numbers, or broaden your search criteria.
          </p>
        </div>
      )}

      {/* Employees Group */}
      {!loading && results.employees && results.employees.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy px-1">
            Workforce Members ({results.employees.length})
          </h2>
          <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100 shadow-2xs overflow-hidden">
            {results.employees.map((emp: any) => (
              <Link
                key={emp.id}
                href={`/workforce/${emp.id}`}
                className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4 block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-hgv-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {emp.employeeName.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{emp.employeeName}</p>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {emp.engagementType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {emp.assignmentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {emp.hgvRole} • {emp.hgvDepartment || emp.project || "Operations"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ID: {emp.employeeId || "—"} • Oracle: {emp.oraclePersonNumber || "—"} • Lead:{" "}
                      {emp.domainLead?.name || "—"}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Domain Leads Group */}
      {!loading && results.domainLeads && results.domainLeads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy px-1">
            Domain Leads ({results.domainLeads.length})
          </h2>
          <div className="bg-white rounded-xl border border-slate-200/80 divide-y divide-slate-100 shadow-2xs overflow-hidden">
            {results.domainLeads.map((dl: any) => (
              <Link
                key={dl.id}
                href={`/workforce?domainLeadId=${dl.id}`}
                className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4 block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-hgv-teal text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{dl.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Domain Lead / Practice Portfolio</p>
                  </div>
                </div>

                <span className="text-xs text-hgv-teal font-semibold flex items-center gap-1">
                  View Team Roster <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GlobalSearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
