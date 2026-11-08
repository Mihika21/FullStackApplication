"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export function TopNavbar() {
  const router = useRouter();
  const { user, switchRole, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleRoleSelect = async (roleCode: "HR_MANAGER" | "HR_TEAM_MEMBER" | "GCC_LEAD") => {
    setRoleMenuOpen(false);
    await switchRole(roleCode);
    router.refresh();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search employees, roles, departments..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40 focus:border-hgv-teal transition"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Interactive Role Switcher */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
          >
            <Shield className="w-3.5 h-3.5 text-hgv-teal" />
            <span className="text-slate-500 font-normal">Active Role:</span>
            <span className="font-semibold text-hgv-navy">{user?.roleName || "Loading..."}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">Switch Active Persona</p>
                <p className="text-[11px] text-slate-500">Test platform capabilities across all 3 roles</p>
              </div>

              <button
                onClick={() => handleRoleSelect("HR_MANAGER")}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition ${
                  user?.roleCode === "HR_MANAGER" ? "bg-hgv-sky/20" : ""
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-hgv-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  SJ
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800">Sarah Jenkins</span>
                    <span className="px-1.5 py-0.2 bg-hgv-navy text-white text-[9px] font-semibold rounded">
                      HR Manager
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Full access: master data, config, admin, audit</p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect("HR_TEAM_MEMBER")}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition ${
                  user?.roleCode === "HR_TEAM_MEMBER" ? "bg-hgv-sky/20" : ""
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-hgv-teal text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  AR
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800">Alex Rivera</span>
                    <span className="px-1.5 py-0.2 bg-hgv-teal text-white text-[9px] font-semibold rounded">
                      Team Member
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Master data, compensation, CSV uploads, reports</p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect("GCC_LEAD")}
                className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition ${
                  user?.roleCode === "GCC_LEAD" ? "bg-hgv-sky/20" : ""
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  JC
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800">Jeff Chu</span>
                    <span className="px-1.5 py-0.2 bg-amber-600 text-white text-[9px] font-semibold rounded">
                      GCC Lead
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Read-only master data, billing figures, exports</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-hgv-navy hover:bg-slate-100 transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-hgv-coral ring-2 ring-white"></span>
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Operational Notifications</span>
                <span className="text-[10px] text-hgv-teal font-medium cursor-pointer">Mark all as read</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="px-4 py-2.5 hover:bg-slate-50 transition flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-700 font-medium leading-tight">Master data synchronized</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Initial reference values & sample workforce loaded</p>
                  </div>
                </div>
                <div className="px-4 py-2.5 hover:bg-slate-50 transition flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-700 font-medium leading-tight">PMO Shift Override applied</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Radha Subramanian (2026-08) set to $240.00 USD</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-hgv-navy text-white text-xs font-bold flex items-center justify-center">
              {user?.displayName ? user.displayName.split(" ").map((n) => n[0]).join("") : "U"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.displayName}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{user?.email}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                <p className="text-xs font-semibold text-slate-800">{user?.displayName}</p>
                <p className="text-[10px] text-slate-400">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  router.push("/account");
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                My Account
              </button>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  router.push("/login");
                }}
                className="w-full text-left px-4 py-2 text-xs text-hgv-coral hover:bg-red-50 flex items-center gap-2 transition border-t border-slate-100"
              >
                <LogOut className="w-3.5 h-3.5 text-hgv-coral" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
