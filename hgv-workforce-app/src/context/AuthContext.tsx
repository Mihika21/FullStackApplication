"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { RoleCode } from "@/lib/auth";

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  roleCode: RoleCode;
  roleName: string;
  status: string;
}

interface RolePermissions {
  canViewWorkforce: boolean;
  canEditWorkforce: boolean;
  canEditCompensation: boolean;
  canUploadCsv: boolean;
  canViewBilling: boolean;
  canEditBillingConfig: boolean;
  canManageUsers: boolean;
  canViewAudit: boolean;
  canExportReports: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  permissions: RolePermissions | null;
  loading: boolean;
  switchRole: (roleCode: RoleCode) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [loading, setLoading] = useState(true);

  // Install tab-scoped fetch interceptor once on client mount
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).__hgv_fetch_intercepted) {
      (window as any).__hgv_fetch_intercepted = true;
      const originalFetch = window.fetch;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const tabRole = sessionStorage.getItem("hgv_active_role");
          if (tabRole) {
            init = init || {};
            const headers = new Headers(init.headers || {});
            if (!headers.has("x-hgv-role")) {
              headers.set("x-hgv-role", tabRole);
            }
            init.headers = headers;
          }
        } catch {
          // ignore error in non-browser context
        }
        return originalFetch(input, init);
      };
    }

    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const tabRole = typeof window !== "undefined" ? sessionStorage.getItem("hgv_active_role") : null;
      const headersInit: Record<string, string> = {};
      if (tabRole) {
        headersInit["x-hgv-role"] = tabRole;
      }

      const res = await fetch("/api/v1/me", {
        headers: headersInit,
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setPermissions(data.permissions);

        // Seed tab storage if currently empty
        if (typeof window !== "undefined" && !tabRole && data.user?.roleCode) {
          sessionStorage.setItem("hgv_active_role", data.user.roleCode);
        }
      }
    } catch (err) {
      console.error("Failed to load user:", err);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (roleCode: RoleCode) => {
    try {
      setLoading(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("hgv_active_role", roleCode);
      }

      const res = await fetch("/api/v1/auth/switch-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hgv-role": roleCode,
        },
        body: JSON.stringify({ roleCode }),
      });

      if (res.ok) {
        await fetchCurrentUser();
      }
    } catch (err) {
      console.error("Failed to switch role:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        switchRole,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
