import { prisma } from "./prisma";
import { cookies, headers } from "next/headers";

export type RoleCode = "HR_MANAGER" | "HR_TEAM_MEMBER" | "GCC_LEAD";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  roleCode: RoleCode;
  roleName: string;
  status: string;
}

export function getRolePermissions(roleCode: RoleCode) {
  return {
    canViewWorkforce: true,
    canEditWorkforce: roleCode === "HR_MANAGER" || roleCode === "HR_TEAM_MEMBER",
    canEditCompensation: roleCode === "HR_MANAGER" || roleCode === "HR_TEAM_MEMBER",
    canUploadCsv: roleCode === "HR_MANAGER" || roleCode === "HR_TEAM_MEMBER",
    canViewBilling: true,
    canEditBillingConfig: roleCode === "HR_MANAGER",
    canManageUsers: roleCode === "HR_MANAGER",
    canViewAudit: roleCode === "HR_MANAGER",
    canExportReports: true,
  };
}

export async function getCurrentUser(): Promise<CurrentUser> {
  let targetUser = null;

  try {
    const reqHeaders = headers();
    const roleHeader = reqHeaders.get("x-hgv-role");
    const emailHeader = reqHeaders.get("x-hgv-email");

    // 1. Prioritize tab-isolated role header if supplied
    if (roleHeader) {
      targetUser = await prisma.appUser.findFirst({
        where: { role: { code: roleHeader } },
        include: { role: true },
      });
    }

    // 2. Check tab-isolated email header
    if (!targetUser && emailHeader) {
      targetUser = await prisma.appUser.findUnique({
        where: { email: emailHeader },
        include: { role: true },
      });
    }
  } catch {
    // In build-time or static context where headers() might be empty
  }

  // 3. Fall back to cookie
  if (!targetUser) {
    try {
      const cookieStore = cookies();
      const emailCookie = cookieStore.get("hgv_user_email")?.value;
      if (emailCookie) {
        targetUser = await prisma.appUser.findUnique({
          where: { email: emailCookie },
          include: { role: true },
        });
      }
    } catch {
      // In static context
    }
  }

  // 4. Default fallback to Sarah Jenkins (HR_MANAGER)
  if (!targetUser) {
    targetUser = await prisma.appUser.findFirst({
      where: { email: "sarah.jenkins@hgv.com" },
      include: { role: true },
    });
  }

  // 5. Final fallback to any user
  if (!targetUser) {
    targetUser = await prisma.appUser.findFirst({
      include: { role: true },
    });
  }

  if (!targetUser) {
    throw new Error("No users found in database. Please run prisma/seed.js");
  }

  return {
    id: targetUser.id,
    email: targetUser.email,
    displayName: targetUser.displayName,
    roleCode: targetUser.role.code as RoleCode,
    roleName: targetUser.role.name,
    status: targetUser.status,
  };
}

