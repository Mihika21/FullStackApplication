import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { roleCode } = await request.json();
    if (!roleCode) {
      return NextResponse.json({ error: "roleCode is required" }, { status: 400 });
    }

    const role = await prisma.role.findUnique({
      where: { code: roleCode },
      include: { users: true },
    });

    if (!role || role.users.length === 0) {
      return NextResponse.json({ error: `Role or user not found for ${roleCode}` }, { status: 404 });
    }

    const targetUser = role.users[0];

    cookies().set("hgv_user_email", targetUser.email, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    await logAuditEvent({
      actorEmail: targetUser.email,
      actorRole: role.code,
      action: "LOGIN",
      entityType: "USER",
      entityId: targetUser.id,
      description: `Persona switched to ${targetUser.displayName} (${role.name})`,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        displayName: targetUser.displayName,
        roleCode: role.code,
        roleName: role.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
