import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canManageUsers) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to manage users" },
        { status: 403 }
      );
    }

    const users = await prisma.appUser.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canManageUsers) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to create users" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, displayName, roleId } = body;

    if (!email?.trim() || !displayName?.trim() || !roleId) {
      return NextResponse.json(
        { error: "Email, Display Name, and Role are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.appUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `User with email "${email}" already exists` },
        { status: 409 }
      );
    }

    const newUser = await prisma.appUser.create({
      data: {
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        roleId,
        passwordHash: "default_hash",
        status: "ACTIVE",
      },
      include: { role: true },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "CREATE",
      entityType: "USER",
      entityId: newUser.id,
      description: `Created user ${newUser.displayName} (${newUser.email}) with role ${newUser.role.name}`,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
