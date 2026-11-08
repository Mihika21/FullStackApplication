"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  DollarSign,
  Calendar,
  Layers,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Edit,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Briefcase,
} from "lucide-react";

export default function EmployeeBillingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { permissions } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // e.g. "2026-08"
  );
  const [recalculating, setRecalculating] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState(false);

  const fetchBillingData = async (month: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/employees/${params.id}/billing?month=${month}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData(selectedMonth);
  }, [params.id, selectedMonth]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      setRecalcSuccess(false);
      const res = await fetch(`/api/v1/billing/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingMonth: selectedMonth }),
      });
      if (res.ok) {
        setRecalcSuccess(true);
        await fetchBillingData(selectedMonth);
        setTimeout(() => setRecalcSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
          <div className="h-28 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const { calculation, employee, billingConfig } = data || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs
        crumbs={[
          { label: "Workforce", href: "/workforce" },
          { label: employee?.employeeName || "Employee", href: `/workforce/${params.id}` },
          { label: "Compensation & Billing" },
        ]}
      />

      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-hgv-navy">{employee?.employeeName}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-hgv-navy/10 text-hgv-navy border border-hgv-navy/20">
                  {employee?.engagementType}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    calculation?.billingStatus === "CALCULATED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {calculation?.billingStatus === "CALCULATED" ? "BILLABLE" : calculation?.billingStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {employee?.hgvRole} • {employee?.hgvDepartment || "General Operations"} • ID:{" "}
                <span className="text-slate-700 font-semibold">{employee?.employeeId || "—"}</span>
              </p>
            </div>
          </div>

          {/* Month selector & Recalculate */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="billing-month" className="text-slate-500 font-medium">Month:</label>
              <input
                id="billing-month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            {permissions?.canEditWorkforce && (
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
                <span>{recalculating ? "Recalculating..." : "Recalculate"}</span>
              </button>
            )}

            <Link
              href={`/workforce/${params.id}`}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Profile</span>
            </Link>
          </div>
        </div>

        {recalcSuccess && (
          <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Billing calculation successfully refreshed for {selectedMonth}!</span>
          </div>
        )}
      </div>

      {/* Applied Configuration Version Banner */}
      <div className="bg-hgv-sky/20 border border-hgv-sky-dark/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-hgv-navy shrink-0" />
          <span>
            Computed using <strong>Billing Configuration v{calculation?.configurationVersion}</strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
          <span>FX Rate: <strong>₹{calculation?.fxRateInrUsd} / $1</strong></span>
          <span>Ops Margin: <strong>{billingConfig?.operationalMarginPercent}%</strong></span>
          <span>Facility: <strong>${billingConfig?.facilityCostUsdMonthly}/mo</strong></span>
          <span>User Bundle: <strong>${billingConfig?.userBundleCostUsdMonthly}/mo</strong></span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Monthly Fully Loaded Cost
          </p>
          <p className="text-2xl font-bold text-hgv-navy mt-1">
            ${calculation?.fullyLoadedCostUsd?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Salary + Margin + Facility + Allowances</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Annual Fully Loaded Cost
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            ${calculation?.annualFullyLoadedCostUsd?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Annualized based on current month</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Salary Cost (USD)
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            ${calculation?.salaryCostUsd?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Fixed USD + Variable Pay USD</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Operational Margin (USD)
          </p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">
            ${calculation?.operationalMarginAmountUsd?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">{billingConfig?.operationalMarginPercent}% of Salary Cost</p>
        </div>
      </div>

      {/* Component Details Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Compensation & Fixed Costs */}
        <div className="space-y-6">
          {/* Base Salary Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-hgv-teal" />
              Fixed Base Compensation
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Annual Fixed CTC (INR)</span>
                <span className="font-semibold text-slate-800">
                  ₹{calculation?.fixedCtcInrAnnual?.toLocaleString("en-IN") || "0"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Monthly Fixed Salary (INR = Annual / 12)</span>
                <span className="font-semibold text-slate-800">
                  ₹{calculation?.monthlyFixedSalaryInr?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">FX Rate Applied (INR → USD)</span>
                <span className="font-semibold text-slate-800">
                  ₹{calculation?.fxRateInrUsd} = $1.00 USD
                </span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 font-bold">
                <span className="text-slate-700">Monthly Fixed Salary (USD)</span>
                <span className="text-emerald-700">
                  ${((calculation?.monthlyFixedSalaryInr || 0) / (calculation?.fxRateInrUsd || 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Variable Pay Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-hgv-teal" />
              Variable Pay Component
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Variable Pay Mode</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {calculation?.variablePayMode}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Monthly Variable Pay (INR)</span>
                <span className="font-semibold text-slate-800">
                  ₹{calculation?.variablePayAmountInr?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 font-bold">
                <span className="text-slate-700">Monthly Variable Pay (USD)</span>
                <span className="text-emerald-700">
                  ${calculation?.variablePayAmountUsd?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Operational, Facility & Shift Allowances */}
        <div className="space-y-6">
          {/* Shift Allowance Component with Precedence Indicator */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-hgv-teal" />
                Shift Allowance Component
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  calculation?.shiftAllowanceSource === "PMO_OVERRIDE"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {calculation?.shiftAllowanceSource === "PMO_OVERRIDE"
                  ? "★ PMO Validated Override"
                  : "Shift Type Default"}
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Shift Type Code</span>
                <span className="font-semibold text-slate-800">{employee?.shiftType?.name || "General"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Allowance Source Applied</span>
                <span className="font-semibold text-slate-800">
                  {calculation?.shiftAllowanceSource === "PMO_OVERRIDE"
                    ? "Monthly PMO Ingestion Override"
                    : "Platform Shift Default"}
                </span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 font-bold">
                <span className="text-slate-700">Shift Allowance (USD)</span>
                <span className="text-emerald-700">
                  ${calculation?.shiftAllowanceUsd?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Joining Bonus Component */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-hgv-teal" />
              Joining Bonus Amortization
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">HGV Start Date</span>
                <span className="font-semibold text-slate-800">
                  {employee?.hgvStartDate ? new Date(employee.hgvStartDate).toLocaleDateString() : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Joining Month Index</span>
                <span className="font-semibold text-slate-800">
                  {calculation?.joiningBonusMonthIndex !== null
                    ? `Month ${calculation?.joiningBonusMonthIndex} of employment`
                    : "Not Applicable"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Amortization Rule</span>
                <span className="text-slate-600 text-[11px]">
                  Months 1-3: 1/3 each; Month 4+: $0
                </span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 font-bold">
                <span className="text-slate-700">Joining Bonus Component (USD)</span>
                <span className="text-emerald-700">
                  ${calculation?.joiningBonusComponentUsd?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Facility & User Bundle */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-hgv-teal" />
              Infrastructure & Overhead
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Facility Cost (USD/mo)</span>
                <span className="font-semibold text-slate-800">
                  ${calculation?.facilityCostUsd?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">User Bundle Cost (USD/mo)</span>
                <span className="font-semibold text-slate-800">
                  ${calculation?.userBundleCostUsd?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 pt-1.5 font-bold">
                <span className="text-slate-700">Total Operational Overhead</span>
                <span className="text-emerald-700">
                  ${((calculation?.facilityCostUsd || 0) + (calculation?.userBundleCostUsd || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Breakdown Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-hgv-navy border-b border-slate-100 pb-2 mb-4">
          Complete Calculation Component Audit Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Component Type</th>
                <th className="py-2.5 px-3">Source Type</th>
                <th className="py-2.5 px-3">Rate / Factor</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculation?.components?.map((c: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{c.componentType}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {c.sourceType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{c.rateValue ? `${c.rateValue}` : "—"}</td>
                  <td className="py-2.5 px-3 text-slate-600">{c.description}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                    ${c.amountUsd?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-slate-200">
                <td colSpan={4} className="py-3 px-3 text-right uppercase text-[10px] tracking-wider">
                  Total Monthly Fully Loaded Cost:
                </td>
                <td className="py-3 px-3 text-right text-sm text-hgv-navy">
                  ${calculation?.fullyLoadedCostUsd?.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
