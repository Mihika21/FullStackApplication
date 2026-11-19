import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const employeeSkills = await prisma.employeeSkill.findMany({
      where: { employeeId: id },
      include: {
        skill: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { skill: { category: { sortOrder: "asc" } } },
        { validatedRating: "desc" },
        { skill: { name: "asc" } },
      ],
    });

    return NextResponse.json(employeeSkills);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to manage employee skills" },
        { status: 403 }
      );
    }

    const { id: employeeId } = params;
    const body = await request.json();
    const {
      skillId,
      selfRating = 0,
      validatedRating = 0,
      yearsOfExperience = 0,
      lastUsed,
      evidence,
      overrideComment,
      ratingSource = "MANAGER",
    } = body;

    if (!skillId) {
      return NextResponse.json({ error: "Skill ID is required" }, { status: 400 });
    }

    const sRating = Math.max(0, Math.min(5, Number(selfRating) || 0));
    const vRating = Math.max(0, Math.min(5, Number(validatedRating) || 0));

    // BRD Section 5.3.2 Rule: "Lead approves, or overrides the rating with a mandatory comment when the validated rating differs by two levels or more."
    if (Math.abs(vRating - sRating) >= 2 && sRating > 0 && (!overrideComment || !overrideComment.trim())) {
      return NextResponse.json(
        {
          error:
            "A mandatory comment is required when the validated rating differs by 2 or more levels from the self-rating.",
        },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, employeeName: true, employeeId: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true, name: true },
    });

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    const existingRating = await prisma.employeeSkill.findUnique({
      where: {
        employeeId_skillId: {
          employeeId,
          skillId,
        },
      },
    });

    const savedRating = await prisma.employeeSkill.upsert({
      where: {
        employeeId_skillId: {
          employeeId,
          skillId,
        },
      },
      update: {
        selfRating: sRating,
        validatedRating: vRating,
        yearsOfExperience: typeof yearsOfExperience === "number" ? yearsOfExperience : parseFloat(yearsOfExperience) || 0,
        lastUsed: lastUsed ? new Date(lastUsed) : null,
        evidence: evidence?.trim() || null,
        ratingSource,
        validatedBy: user.displayName || user.email,
        validatedAt: new Date(),
        overrideComment: overrideComment?.trim() || null,
      },
      create: {
        employeeId,
        skillId,
        selfRating: sRating,
        validatedRating: vRating,
        yearsOfExperience: typeof yearsOfExperience === "number" ? yearsOfExperience : parseFloat(yearsOfExperience) || 0,
        lastUsed: lastUsed ? new Date(lastUsed) : null,
        evidence: evidence?.trim() || null,
        ratingSource,
        validatedBy: user.displayName || user.email,
        validatedAt: new Date(),
        overrideComment: overrideComment?.trim() || null,
      },
      include: {
        skill: {
          include: { category: true },
        },
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: existingRating ? "UPDATE" : "CREATE",
      entityType: "EMPLOYEE_SKILL",
      entityId: savedRating.id,
      description: `${existingRating ? "Updated" : "Added"} skill '${skill.name}' (Validated: L${vRating}, Self: L${sRating}) for ${employee.employeeName}`,
      beforeJson: existingRating,
      afterJson: savedRating,
    });

    return NextResponse.json({ success: true, employeeSkill: savedRating });
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
        { error: "Forbidden: You do not have permission to delete employee skills" },
        { status: 403 }
      );
    }

    const { id: employeeId } = params;
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get("skillId");

    if (!skillId) {
      return NextResponse.json({ error: "Skill ID is required" }, { status: 400 });
    }

    const existing = await prisma.employeeSkill.findUnique({
      where: {
        employeeId_skillId: {
          employeeId,
          skillId,
        },
      },
      include: {
        skill: true,
        employee: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Skill rating not found" }, { status: 404 });
    }

    await prisma.employeeSkill.delete({
      where: {
        employeeId_skillId: {
          employeeId,
          skillId,
        },
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "EMPLOYEE_SKILL",
      entityId: existing.id,
      description: `Removed skill '${existing.skill.name}' from ${existing.employee.employeeName}`,
      beforeJson: existing,
    });

    return NextResponse.json({ success: true, message: "Skill removed successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
