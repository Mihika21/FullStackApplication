"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Layers,
  Eye,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AuditTrailPage() {
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 25, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);

  // Detail Modal state
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const fetchAuditEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "25");
      if (search) params.append("search", search);
      if (action) params.append("action", action);
      if (entityType) params.append("entityType", entityType);

      const res = await fetch(`/api/v1/audit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setEvents(json.data || []);
        setPagination(json.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [page, action, entityType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditEvents();
  };

  if (!permissions?.canViewAudit) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumbs crumbs={[{ label: "Audit Trail" }]} />
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Restricted Audit Module</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Audit trail inspection is restricted to authorized roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs crumbs={[{ label: "Audit Trail" }]} />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-hgv-navy">System Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable logging of master data changes, compensation updates, pricing versions, and administrative actions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search descriptions, actors, entity IDs..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-hgv-navy text-white font-semibold hover:bg-hgv-navy-light transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-hgv-teal"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DEACTIVATE">DEACTIVATE</option>
            <option value="CONFIG_CHANGE">CONFIG_CHANGE</option>
            <option value="IMPORT">IMPORT</option>
            <option value="LOGIN">LOGIN</option>
          </select>

          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-hgv-teal"
          >
            <option value="">All Entities</option>
            <option value="WORKFORCE">WORKFORCE</option>
            <option value="COMPENSATION">COMPENSATION</option>
            <option value="BILLING_CONFIG">BILLING_CONFIG</option>
            <option value="USER">USER</option>
            <option value="IMPORT_BATCH">IMPORT_BATCH</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-hgv-teal" />
            Audit Log Entries ({pagination.total})
          </h2>
          <span className="text-xs text-slate-400">Page {pagination.page} of {pagination.totalPages}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit events...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No audit events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(evt.occurredAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-800">{evt.actorEmail}</p>
                      <p className="text-[10px] text-slate-400">{evt.actorRole}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          evt.action === "CREATE"
                            ? "bg-emerald-50 text-emerald-800"
                            : evt.action === "UPDATE"
                            ? "bg-sky-50 text-sky-800"
                            : evt.action === "DEACTIVATE"
                            ? "bg-red-50 text-hgv-coral"
                            : evt.action === "CONFIG_CHANGE"
                            ? "bg-purple-50 text-purple-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {evt.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {evt.entityType}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-md truncate" title={evt.description}>
                      {evt.description}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {(evt.beforeJson || evt.afterJson) && (
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="flex items-center gap-1 text-[11px] text-hgv-teal font-semibold hover:underline ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Diff</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500 text-[11px]">
              Showing {events.length} of {pagination.total} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-slate-700 font-semibold px-2">
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: View Diff */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-hgv-navy flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-hgv-teal" />
                  Audit State Payload Snapshot
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedEvent.description}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Before State
                </span>
                <pre className="p-3 bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto text-[11px] font-mono text-slate-700 max-h-72">
                  {selectedEvent.beforeJson
                    ? JSON.stringify(JSON.parse(selectedEvent.beforeJson), null, 2)
                    : "No prior state recorded"}
                </pre>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider block mb-1">
                  After State
                </span>
                <pre className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-200 overflow-x-auto text-[11px] font-mono text-emerald-900 max-h-72">
                  {selectedEvent.afterJson
                    ? JSON.stringify(JSON.parse(selectedEvent.afterJson), null, 2)
                    : "No after state recorded"}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
