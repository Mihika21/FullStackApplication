import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canManageUsers) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to manage users" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { roleId, status, displayName } = body;

    const existingUser = await prisma.appUser.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.appUser.update({
      where: { id },
      data: {
        roleId: roleId || existingUser.roleId,
        status: status || existingUser.status,
        displayName: displayName?.trim() || existingUser.displayName,
      },
      include: { role: true },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "USER",
      entityId: id,
      description: `Updated user ${updated.displayName} (Status: ${updated.status}, Role: ${updated.role.name})`,
      beforeJson: { role: existingUser.role.name, status: existingUser.status },
      afterJson: { role: updated.role.name, status: updated.status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
