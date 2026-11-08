"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  Settings,
  DollarSign,
  TrendingUp,
  Building2,
  Clock,
  ShieldCheck,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  History,
  Lock,
  ArrowRight,
  Plus,
  Edit2,
  X,
  Calendar,
} from "lucide-react";

export default function BillingConfigurationPage() {
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shift Types State
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [shiftCode, setShiftCode] = useState("");
  const [shiftName, setShiftName] = useState("");
  const [shiftStartTime, setShiftStartTime] = useState("09:00");
  const [shiftEndTime, setShiftEndTime] = useState("18:00");
  const [shiftTimezone, setShiftTimezone] = useState("IST (UTC+5:30)");
  const [shiftDescription, setShiftDescription] = useState("");
  const [shiftDefaultRate, setShiftDefaultRate] = useState<number>(0);
  const [shiftActive, setShiftActive] = useState(true);
  const [savingShift, setSavingShift] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);

  // Form inputs
  const [fxRate, setFxRate] = useState<number>(90.0);
  const [varPayRate, setVarPayRate] = useState<number>(5.0);
  const [opsMargin, setOpsMargin] = useState<number>(30.0);
  const [facilityCost, setFacilityCost] = useState<number>(500.0);
  const [userBundleCost, setUserBundleCost] = useState<number>(0.0);
  const [generalShiftRate, setGeneralShiftRate] = useState<number>(0.0);
  const [usShiftRate, setUsShiftRate] = useState<number>(200.0);
  const [ukShiftRate, setUkShiftRate] = useState<number>(150.0);
  const [nocShiftRate, setNocShiftRate] = useState<number>(250.0);

  const fetchShiftTypes = async () => {
    try {
      const res = await fetch("/api/v1/shift-types");
      if (res.ok) {
        const data = await res.json();
        setShiftTypes(data);
      }
    } catch (err) {
      console.error("Failed to load shift types:", err);
    }
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/billing-configuration");
      if (res.ok) {
        const json = await res.json();
        setCurrentConfig(json.current);
        setHistory(json.history || []);

        if (json.current) {
          setFxRate(json.current.fxRateInrUsd);
          setVarPayRate(json.current.variablePayRatePercent);
          setOpsMargin(json.current.operationalMarginPercent);
          setFacilityCost(json.current.facilityCostUsdMonthly);
          setUserBundleCost(json.current.userBundleCostUsdMonthly || 0);
          setGeneralShiftRate(json.current.shiftAllowanceGeneralUsd || 0);
          setUsShiftRate(json.current.shiftAllowanceUsShiftUsd || 200);
          setUkShiftRate(json.current.shiftAllowanceUkShiftUsd || 150);
          setNocShiftRate(json.current.shiftAllowance24x7NocUsd || 250);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchShiftTypes();
  }, []);

  const openAddShiftModal = () => {
    setEditingShift(null);
    setShiftCode("");
    setShiftName("");
    setShiftStartTime("09:00");
    setShiftEndTime("18:00");
    setShiftTimezone("IST (UTC+5:30)");
    setShiftDescription("");
    setShiftDefaultRate(0);
    setShiftActive(true);
    setShiftError(null);
    setShiftModalOpen(true);
  };

  const openEditShiftModal = (st: any) => {
    setEditingShift(st);
    setShiftCode(st.code);
    setShiftName(st.name);
    setShiftStartTime(st.startTime || "09:00");
    setShiftEndTime(st.endTime || "18:00");
    setShiftTimezone(st.timezone || "IST (UTC+5:30)");
    setShiftDescription(st.description || "");
    setShiftDefaultRate(st.defaultRate || 0);
    setShiftActive(st.active);
    setShiftError(null);
    setShiftModalOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingShift(true);
      setShiftError(null);

      const url = editingShift ? `/api/v1/shift-types/${editingShift.id}` : "/api/v1/shift-types";
      const method = editingShift ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: shiftCode,
          name: shiftName,
          startTime: shiftStartTime,
          endTime: shiftEndTime,
          timezone: shiftTimezone,
          description: shiftDescription,
          defaultRate: shiftDefaultRate,
          active: shiftActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save shift type");
      }

      setShiftModalOpen(false);
      setSuccessMessage(`Shift Type '${shiftName}' updated successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchShiftTypes();
    } catch (err: any) {
      setShiftError(err.message || "Failed to save shift type.");
    } finally {
      setSavingShift(false);
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmModalOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await fetch("/api/v1/billing-configuration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fxRateInrUsd: fxRate,
          variablePayRatePercent: varPayRate,
          operationalMarginPercent: opsMargin,
          facilityCostUsdMonthly: facilityCost,
          userBundleCostUsdMonthly: userBundleCost,
          shiftAllowanceGeneralUsd: generalShiftRate,
          shiftAllowanceUsShiftUsd: usShiftRate,
          shiftAllowanceUkShiftUsd: ukShiftRate,
          shiftAllowance24x7NocUsd: nocShiftRate,
        }),
      });

      if (res.ok) {
        setConfirmModalOpen(false);
        setSuccessMessage("Billing Configuration updated successfully. New version generated and audited.");
        await fetchConfig();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const json = await res.json();
        setErrorMessage(json.error || "Failed to update billing configuration.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerRecalculate = async () => {
    try {
      setRecalculating(true);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const res = await fetch("/api/v1/billing/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingMonth: currentMonth }),
      });

      if (res.ok) {
        const json = await res.json();
        setSuccessMessage(
          `Batch billing successfully re-evaluated for ${json.totalEmployees} employees against version ${currentConfig?.versionNumber}.`
        );
        setTimeout(() => setSuccessMessage(null), 6000);
      }
    } catch (err: any) {
      setErrorMessage("Failed to recalculate billing.");
    } finally {
      setRecalculating(false);
    }
  };

  // RBAC Enforcement Guard
  if (!permissions?.canEditBillingConfig) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Breadcrumbs crumbs={[{ label: "Billing Configuration" }]} />
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Restricted Administration Module</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Billing Configuration governance is strictly restricted to the <strong>HR Manager</strong> persona.
            Your current active role (<span className="text-hgv-navy font-semibold">{user?.roleName}</span>) does
            not hold configuration edit rights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs crumbs={[{ label: "Billing Configuration" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hgv-navy">Billing & Pricing Configuration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global FX rates, margin multipliers, facility overheads, and shift allowance baselines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerRecalculate}
            disabled={recalculating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
            <span>{recalculating ? "Recalculating..." : "Recalculate All Active"}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-hgv-coral text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-hgv-coral" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Version Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-hgv-navy text-white flex items-center justify-center font-bold text-sm shadow-xs">
            v{currentConfig?.versionNumber || 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">Current Production Configuration</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Effective Since:{" "}
              <strong className="text-slate-600">
                {currentConfig?.effectiveFrom
                  ? new Date(currentConfig.effectiveFrom).toLocaleDateString()
                  : "Genesis"}
              </strong>{" "}
              • Created By: <strong className="text-slate-600">{currentConfig?.createdBy || "System"}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSaveSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Core Financial Parameters */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-hgv-teal" />
              Currency & Margin Multipliers
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Foreign Exchange Rate (INR → 1.00 USD) <span className="text-hgv-coral">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={fxRate}
                  onChange={(e) => setFxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Used to convert Indian Rupee Fixed CTC and Variable Pay to USD.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Default Variable Pay Rate (%) <span className="text-hgv-coral">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={varPayRate}
                  onChange={(e) => setVarPayRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Platform standard applied to employees under FLAT_PERCENT mode.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Operational Margin Rate (%) <span className="text-hgv-coral">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={opsMargin}
                  onChange={(e) => setOpsMargin(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Calculated on total Salary Cost (Fixed Salary USD + Variable Pay USD).
              </p>
            </div>
          </div>

          {/* Card 2: Facility & IT Overheads */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-hgv-teal" />
              Facilities & Infrastructure Overheads
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Monthly Facility Cost (USD / head) <span className="text-hgv-coral">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">$</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={facilityCost}
                  onChange={(e) => setFacilityCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Assigned monthly for GCC, NOC, Rebadge, and Colocation models.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Monthly User Bundle Cost (USD / head)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">$</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={userBundleCost}
                  onChange={(e) => setUserBundleCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Standard workstation and software bundle per seat.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Shift Allowance Default Baselines & Customizable Shift Schedules */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-hgv-teal" />
                Shift Types, Timings & Schedule Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure shift hours, operational timezones, descriptions, and default allowance rates.
              </p>
            </div>
            {permissions?.canEditBillingConfig && (
              <button
                type="button"
                onClick={openAddShiftModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-hgv-teal hover:bg-hgv-teal/90 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Shift Type
              </button>
            )}
          </div>

          {/* Shift Types Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Shift Code & Name</th>
                  <th className="py-2.5 px-3">Working Hours</th>
                  <th className="py-2.5 px-3">Timezone</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Default Rate</th>
                  <th className="py-2.5 px-3 text-center">Assigned</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  {permissions?.canEditBillingConfig && (
                    <th className="py-2.5 px-3 text-right">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shiftTypes.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800">{st.name}</div>
                      <span className="font-mono text-[10px] text-hgv-teal font-semibold">{st.code}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {st.startTime} - {st.endTime}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{st.timezone}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                      {st.description || "—"}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      ${st.defaultRate}/mo
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {st.assignedEmployeeCount} active
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {st.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    {permissions?.canEditBillingConfig && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditShiftModal(st)}
                          className="inline-flex items-center gap-1 text-[11px] text-hgv-teal hover:underline font-semibold cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Configuration Version Snapshot Baselines */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Configuration Version Snapshot Baselines (USD / month)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">General Shift</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={generalShiftRate}
                    onChange={(e) => setGeneralShiftRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">US Night Shift</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={usShiftRate}
                    onChange={(e) => setUsShiftRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">UK Evening Shift</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={ukShiftRate}
                    onChange={(e) => setUkShiftRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">24x7 NOC Shift</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={nocShiftRate}
                    onChange={(e) => setNocShiftRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-semibold shadow-xs transition"
          >
            Save as Version {((currentConfig?.versionNumber || 0) + 1)}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Confirm Configuration Version Update
                </h3>
                <p className="text-[11px] text-slate-500">
                  This will generate Version {((currentConfig?.versionNumber || 0) + 1)} and write an immutable audit log.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1 font-mono">
              <p>FX Rate: ₹{fxRate} / $1</p>
              <p>Ops Margin: {opsMargin}%</p>
              <p>Variable Pay Default: {varPayRate}%</p>
              <p>Facility Cost: ${facilityCost} /mo</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                {saving ? "Publishing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-hgv-teal" />
          Configuration Version History & Audit
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Version</th>
                <th className="py-2.5 px-3">FX Rate</th>
                <th className="py-2.5 px-3">Margin %</th>
                <th className="py-2.5 px-3">Facility</th>
                <th className="py-2.5 px-3">Effective Period</th>
                <th className="py-2.5 px-3">Published By</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((ver) => (
                <tr key={ver.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-bold text-slate-800">v{ver.versionNumber}</td>
                  <td className="py-2.5 px-3 font-mono">₹{ver.fxRateInrUsd}</td>
                  <td className="py-2.5 px-3">{ver.operationalMarginPercent}%</td>
                  <td className="py-2.5 px-3 font-mono">${ver.facilityCostUsdMonthly}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {new Date(ver.effectiveFrom).toLocaleDateString()}{" "}
                    {ver.effectiveTo ? `→ ${new Date(ver.effectiveTo).toLocaleDateString()}` : "→ Present"}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{ver.createdBy || "System"}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ver.isCurrent
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {ver.isCurrent ? "ACTIVE" : "ARCHIVED"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift Type Add/Edit Modal */}
      {shiftModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-hgv-teal/15 text-hgv-teal flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingShift ? `Configure Shift: ${editingShift.code}` : "Create New Shift Type"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define operational window, hours, timezone, and baseline allowance rate.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {shiftError && (
              <div className="p-3 bg-red-50 border border-red-200 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{shiftError}</span>
              </div>
            )}

            <form onSubmit={handleSaveShift} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Shift Code <span className="text-hgv-coral">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!!editingShift}
                    value={shiftCode}
                    onChange={(e) => setShiftCode(e.target.value.toUpperCase())}
                    placeholder="e.g. APAC_SHIFT"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Shift Name <span className="text-hgv-coral">*</span>
                  </label>
                  <input
                    type="text"
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    placeholder="e.g. APAC Early Morning"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    placeholder="18:00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={shiftTimezone}
                    onChange={(e) => setShiftTimezone(e.target.value)}
                    placeholder="IST (UTC+5:30)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Default Monthly Rate (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={shiftDefaultRate}
                      onChange={(e) => setShiftDefaultRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                    />
                  </div>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={shiftActive}
                      onChange={(e) => setShiftActive(e.target.checked)}
                      className="rounded text-hgv-teal focus:ring-hgv-teal w-4 h-4"
                    />
                    <span>Active in Workforce Operations</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Shift Description & Scope
                </label>
                <textarea
                  rows={2}
                  value={shiftDescription}
                  onChange={(e) => setShiftDescription(e.target.value)}
                  placeholder="Operational scope, tier coverage, and hand-off details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShiftModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingShift}
                  className="px-4 py-2 rounded-lg bg-hgv-teal hover:bg-hgv-teal/90 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingShift ? "Saving Shift Type..." : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {editingShift ? "Update Shift Configuration" : "Create Shift Type"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

