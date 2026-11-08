import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to deactivate employees" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { attritionReason, attritionDate, notes } = body;

    if (!attritionReason?.trim()) {
      return NextResponse.json(
        { error: "Attrition reason is required for deactivation" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: {
          assignmentStatus: "Inactive",
          hgvEndDate: attritionDate ? new Date(attritionDate) : new Date(),
        },
      });

      await tx.employeeAttrition.create({
        data: {
          employeeId: id,
          attritionReason: attritionReason.trim(),
          attritionDate: attritionDate ? new Date(attritionDate) : new Date(),
          notes: notes?.trim() || null,
        },
      });

      return updated;
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "DEACTIVATE",
      entityType: "EMPLOYEE",
      entityId: id,
      description: `Deactivated employee ${employee.employeeName} (Reason: ${attritionReason.trim()})`,
      beforeJson: { assignmentStatus: employee.assignmentStatus },
      afterJson: { assignmentStatus: "Inactive", attritionReason },
    });

    return NextResponse.json({ success: true, employee: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
