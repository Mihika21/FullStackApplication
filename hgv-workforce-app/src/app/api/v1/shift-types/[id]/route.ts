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

    if (!permissions.canEditBillingConfig) {
      return NextResponse.json(
        { error: "Forbidden: Only HR Managers can modify Shift Types" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, startTime, endTime, timezone, description, defaultRate, active } = body;

    const existing = await prisma.shiftType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Shift type not found" }, { status: 404 });
    }

    const updated = await prisma.shiftType.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(startTime !== undefined && { startTime: startTime.trim() }),
        ...(endTime !== undefined && { endTime: endTime.trim() }),
        ...(timezone !== undefined && { timezone: timezone.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(defaultRate !== undefined && {
          defaultRate: typeof defaultRate === "number" ? defaultRate : parseFloat(defaultRate) || 0,
        }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "SHIFT_TYPE",
      entityId: updated.id,
      description: `Updated Shift Type '${updated.code}' (${updated.name}): Hours=${updated.startTime}-${updated.endTime}, DefaultRate=$${updated.defaultRate}/mo, Active=${updated.active}`,
    });

    return NextResponse.json({
      success: true,
      shiftType: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
