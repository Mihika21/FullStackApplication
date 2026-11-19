"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  FileSpreadsheet,
  Settings,
  UserCheck,
  ShieldCheck,
  Briefcase,
  Award,
  GraduationCap,
  BookOpen,
  Flame,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { permissions, loading } = useAuth();

  const coreNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Workforce",
      href: "/workforce",
      icon: Users,
      show: true,
    },
    {
      name: "Skill Matrix",
      href: "/skills",
      icon: Award,
      show: true,
    },
    {
      name: "Bulk Upload",
      href: "/bulk-upload",
      icon: UploadCloud,
      show: permissions?.canUploadCsv ?? false,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: FileSpreadsheet,
      show: true,
    },
  ];

  const lmsNavItems = [
    {
      name: "Learner Portal",
      href: "/lms",
      icon: GraduationCap,
      show: true,
    },
    {
      name: "Manager Heatmap",
      href: "/lms/manager",
      icon: Flame,
      show: true,
    },
    {
      name: "Course Catalog & CMS",
      href: "/lms/courses",
      icon: BookOpen,
      show: true,
    },
    {
      name: "Compliance Scorecard",
      href: "/lms/analytics",
      icon: BarChart3,
      show: true,
    },
    {
      name: "Verify Certificate",
      href: "/lms/verify",
      icon: CheckCircle2,
      show: true,
    },
  ];

  const adminNavItems = [
    {
      name: "Billing Configuration",
      href: "/billing-configuration",
      icon: Settings,
      show: permissions?.canEditBillingConfig ?? false,
    },
    {
      name: "User Administration",
      href: "/users",
      icon: UserCheck,
      show: permissions?.canManageUsers ?? false,
    },
    {
      name: "Audit Trail",
      href: "/audit",
      icon: ShieldCheck,
      show: permissions?.canViewAudit ?? false,
    },
  ];

  const renderNavGroup = (title: string, items: typeof coreNavItems) => {
    const visible = items.filter((item) => item.show);
    if (visible.length === 0) return null;

    return (
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 mb-1">
          {title}
        </p>
        {visible.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/lms" && pathname.startsWith(item.href)) ||
            (item.href === "/lms" && (pathname === "/lms" || pathname.startsWith("/lms/learn")));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-white/15 text-white shadow-xs font-semibold border-l-4 border-hgv-teal pl-2"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors shrink-0 ${
                  isActive ? "text-hgv-teal" : "text-slate-400 group-hover:text-white"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-hgv-navy text-white flex flex-col shrink-0 h-screen sticky top-0 shadow-lg select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
        <div className="w-9 h-9 rounded-lg bg-hgv-teal flex items-center justify-center font-bold text-white text-lg tracking-wider shadow">
          HGV
        </div>
        <div>
          <h1 className="font-semibold text-sm tracking-wide text-white leading-tight">
            GCC Workforce
          </h1>
          <p className="text-[11px] text-hgv-sky/80 font-medium">Master Data & ELMS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {renderNavGroup("Core Workforce", coreNavItems)}
        {renderNavGroup("Learning & Compliance (ELMS)", lmsNavItems)}
        {renderNavGroup("Governance & Administration", adminNavItems)}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/10 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-slate-300">Phase 1 Platform</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-hgv-teal/20 text-hgv-teal">
            v1.0
          </span>
        </div>
        <p className="text-[11px] text-slate-500">Deterministic Billing Engine</p>
      </div>
    </aside>
  );
}
