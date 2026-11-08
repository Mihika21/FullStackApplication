"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  FileSpreadsheet,
  DollarSign,
  Users,
  ArrowRight,
  Download,
  Calendar,
  Layers,
  PieChart,
  ShieldCheck,
} from "lucide-react";

export default function ReportsHubPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const reports = [
    {
      id: "billing",
      title: "Monthly Billing Summary",
      description:
        "Deterministic monthly cost rollups for all engagement models, including salary cost, operational margin, facility, and validated shift allowances.",
      icon: DollarSign,
      iconBg: "bg-emerald-600 text-white",
      href: "/reports/billing",
      quickExportXlsx: `/api/v1/reports/billing?billingMonth=${currentMonth}&format=excel`,
      quickExportPdf: `/api/v1/reports/billing?billingMonth=${currentMonth}&format=pdf`,
      highlights: [
        "Aggregate summaries by Domain Lead and Engagement Model",
        "Employee-level component calculations",
        "Precedence tracking for PMO shift allowances",
      ],
    },
    {
      id: "master-data",
      title: "Master Data Export",
      description:
        "Complete enterprise employee master data dump with organization assignments, personal contact details, and current compensation parameters.",
      icon: Users,
      iconBg: "bg-hgv-navy text-white",
      href: "/reports/master-data",
      quickExportXlsx: `/api/v1/reports/master-data?format=excel`,
      highlights: [
        "Comprehensive workforce attributes across all 5 engagement types",
        "Configurable filters by Domain Lead, Engagement, and Status",
        "Role-based masking of sensitive government identifiers",
      ],
    },
    {
      id: "headcount",
      title: "Headcount & Distribution Summary",
      description:
        "Strategic workforce metrics across engagement models, domain leadership, gender diversity, and physical GCC presence.",
      icon: PieChart,
      iconBg: "bg-indigo-600 text-white",
      href: "/reports/headcount",
      quickExportXlsx: `/api/v1/reports/headcount?format=excel`,
      highlights: [
        "Headcount distribution by Engagement Type",
        "Domain leadership allocation",
        "GCC dedicated presence ratios",
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Breadcrumbs crumbs={[{ label: "Reports" }]} />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-hgv-navy">Reports & Analytics Hub</h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate, preview, and export finance-ready workforce master data, headcount distributions, and monthly billing figures.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((rpt) => {
          const Icon = rpt.icon;
          return (
            <div
              key={rpt.id}
              className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between hover:border-hgv-teal/50 transition"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-xs ${rpt.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900">{rpt.title}</h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{rpt.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  {rpt.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-hgv-teal font-bold">•</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  href={rpt.href}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-hgv-navy hover:bg-hgv-navy-light text-white text-xs font-semibold shadow-xs transition"
                >
                  <span>Open Report & Filters</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center justify-center gap-3 pt-1">
                  <a
                    href={rpt.quickExportXlsx}
                    download
                    className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-emerald-700 font-semibold transition"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>Quick Excel</span>
                  </a>
                  {rpt.quickExportPdf && (
                    <a
                      href={rpt.quickExportPdf}
                      download
                      className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-red-700 font-semibold transition"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>Quick PDF</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
