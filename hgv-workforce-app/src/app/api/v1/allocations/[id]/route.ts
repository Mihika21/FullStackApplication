import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to update allocations" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { allocationPct, projectRole, status, startDate, endDate, notes } = body;

    const existing = await prisma.projectAllocation.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Allocation not found" }, { status: 404 });
    }

    const newPct =
      allocationPct !== undefined
        ? Math.max(0.05, Math.min(1.0, Number(allocationPct)))
        : existing.allocationPct;
    const newStatus = status || existing.status;

    // Strict 100% cap validation excluding the current record being modified
    const otherConfirmedAllocs = await prisma.projectAllocation.findMany({
      where: {
        employeeId: existing.employeeId,
        status: "CONFIRMED",
        id: { not: id },
      },
    });

    const otherConfirmedTotal = otherConfirmedAllocs.reduce(
      (sum, a) => sum + (a.allocationPct || 0),
      0
    );

    const projectedPctInt = Math.round((otherConfirmedTotal + newPct) * 100);
    if (projectedPctInt > 100) {
      const remainingPct = Math.max(0, 100 - Math.round(otherConfirmedTotal * 100));
      return NextResponse.json(
        {
          error: `Over-allocation prevented: ${existing.employee.employeeName} already has ${Math.round(otherConfirmedTotal * 100)}% confirmed allocation across other projects. Maximum allowed for this allocation is ${remainingPct}%.`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.projectAllocation.update({
      where: { id },
      data: {
        allocationPct: Math.round(newPct * 100) / 100,
        projectRole: projectRole !== undefined ? projectRole : existing.projectRole,
        status: newStatus,
        confirmedBy:
          newStatus === "CONFIRMED" && existing.status !== "CONFIRMED"
            ? user.displayName || user.email
            : existing.confirmedBy,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "ALLOCATION",
      entityId: id,
      description: `Updated allocation for ${existing.employee.employeeName} on '${existing.projectName}' (${Math.round(updated.allocationPct * 100)}%, ${updated.status})`,
      beforeJson: existing,
      afterJson: updated,
    });

    return NextResponse.json({ success: true, allocation: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete allocations" },
        { status: 403 }
      );
    }

    const { id } = params;
    const existing = await prisma.projectAllocation.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Allocation not found" }, { status: 404 });
    }

    await prisma.projectAllocation.delete({ where: { id } });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "ALLOCATION",
      entityId: id,
      description: `Removed ${existing.status} allocation (${Math.round(existing.allocationPct * 100)}%) for ${existing.employee.employeeName} on project '${existing.projectName}'`,
      beforeJson: existing,
    });

    return NextResponse.json({ success: true, message: "Allocation removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
