import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const shiftTypes = await prisma.shiftType.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    const formatted = shiftTypes.map((st) => ({
      id: st.id,
      code: st.code,
      name: st.name,
      startTime: st.startTime || "09:00",
      endTime: st.endTime || "18:00",
      timezone: st.timezone || "IST (UTC+5:30)",
      description: st.description || "",
      defaultRate: st.defaultRate || 0,
      active: st.active,
      assignedEmployeeCount: st._count.employees,
      createdAt: st.createdAt,
      updatedAt: st.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditBillingConfig) {
      return NextResponse.json(
        { error: "Forbidden: Only HR Managers can create or configure Shift Types" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, name, startTime, endTime, timezone, description, defaultRate } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Both Shift Code and Shift Name are required." },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "_");

    const existing = await prisma.shiftType.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Shift type code '${normalizedCode}' already exists.` },
        { status: 400 }
      );
    }

    const newShift = await prisma.shiftType.create({
      data: {
        code: normalizedCode,
        name: name.trim(),
        startTime: startTime?.trim() || "09:00",
        endTime: endTime?.trim() || "18:00",
        timezone: timezone?.trim() || "IST (UTC+5:30)",
        description: description?.trim() || null,
        defaultRate: typeof defaultRate === "number" ? defaultRate : parseFloat(defaultRate) || 0,
        active: true,
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "CREATE",
      entityType: "SHIFT_TYPE",
      entityId: newShift.id,
      description: `Created new Shift Type '${newShift.code}' (${newShift.name}) with hours ${newShift.startTime}-${newShift.endTime} and default rate $${newShift.defaultRate}/mo`,
    });

    return NextResponse.json({
      success: true,
      shiftType: newShift,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
