import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get("projectName");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: any = {};
    if (projectName) where.projectName = projectName;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const allocations = await prisma.projectAllocation.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            employeeName: true,
            hgvRole: true,
            hgvDepartment: true,
            practice: true,
            domainLead: { select: { name: true } },
            projectAllocations: {
              where: { status: "CONFIRMED" },
              select: { allocationPct: true, projectName: true },
            },
          },
        },
      },
      orderBy: [{ projectName: "asc" }, { createdAt: "desc" }],
    });

    const enriched = allocations.map((alloc) => {
      const activeConfirmedTotal = alloc.employee.projectAllocations.reduce(
        (sum, a) => sum + (a.allocationPct || 0),
        0
      );
      return {
        ...alloc,
        employeeConfirmedTotalAllocationPct: Math.round(activeConfirmedTotal * 100) / 100,
        employeeFreeCapacityPct: Math.max(0, Math.round((1.0 - activeConfirmedTotal) * 100) / 100),
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to manage allocations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      employeeId,
      projectId: requestedProjectId,
      projectName,
      projectRole,
      allocationPct = 1.0,
      startDate,
      endDate,
      status = "DRAFT",
      notes,
      isNewProject = false,
    } = body;

    if (!employeeId) return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    if (!requestedProjectId && (!projectName || !projectName.trim())) {
      return NextResponse.json({ error: "Project Name is required" }, { status: 400 });
    }

    const allocPct = Math.max(0.05, Math.min(1.0, Number(allocationPct) || 1.0));

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        projectAllocations: true,
      },
    });

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // 1. Resolve or create Project (with duplicate name check if creating new)
    let targetProject = null;
    if (requestedProjectId) {
      targetProject = await prisma.project.findUnique({ where: { id: requestedProjectId } });
      if (!targetProject) {
        return NextResponse.json({ error: "Selected project not found" }, { status: 404 });
      }
    } else {
      const trimmedName = projectName.trim();
      const allProjects = await prisma.project.findMany();
      const existingProj = allProjects.find(
        (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      if (existingProj) {
        if (isNewProject) {
          return NextResponse.json(
            {
              error: `A project named '${existingProj.name}' already exists. Duplicate project names are not allowed.`,
            },
            { status: 400 }
          );
        }
        targetProject = existingProj;
      } else {
        targetProject = await prisma.project.create({
          data: {
            name: trimmedName,
            code: `PRJ-${String(allProjects.length + 1).padStart(3, "0")}`,
            status: "ACTIVE",
            startDate: startDate ? new Date(startDate) : new Date(),
          },
        });
      }
    }

    // 2. Prevent duplicate allocation for same employee on the same project
    const duplicateOnProject = employee.projectAllocations.find(
      (a) =>
        (a.projectId === targetProject!.id ||
          a.projectName.trim().toLowerCase() === targetProject!.name.trim().toLowerCase()) &&
        (a.status === "CONFIRMED" || a.status === "DRAFT")
    );
    if (duplicateOnProject) {
      return NextResponse.json(
        {
          error: `${employee.employeeName} already has a ${duplicateOnProject.status} allocation (${Math.round(duplicateOnProject.allocationPct * 100)}%) on '${targetProject.name}'. Edit or remove the existing allocation instead.`,
        },
        { status: 400 }
      );
    }

    // 3. Strict 100% Cap Over-Allocation Prevention (Requirement 2)
    const currentTotalConfirmed = employee.projectAllocations
      .filter((a) => a.status === "CONFIRMED")
      .reduce((sum, a) => sum + (a.allocationPct || 0), 0);

    const confirmedPctInt = Math.round(currentTotalConfirmed * 100);
    const requestedPctInt = Math.round(allocPct * 100);

    if (confirmedPctInt >= 100) {
      return NextResponse.json(
        {
          error: `${employee.employeeName} is already 100% allocated (${confirmedPctInt}%). Additional allocations are not allowed.`,
        },
        { status: 400 }
      );
    }

    if (confirmedPctInt + requestedPctInt > 100) {
      const remainingPct = Math.max(0, 100 - confirmedPctInt);
      return NextResponse.json(
        {
          error: `Over-allocation prevented: ${employee.employeeName} already has ${confirmedPctInt}% confirmed allocation. Maximum additional allocation allowed is ${remainingPct}%.`,
        },
        { status: 400 }
      );
    }

    const allocation = await prisma.projectAllocation.create({
      data: {
        employeeId,
        projectId: targetProject.id,
        projectName: targetProject.name,
        projectRole: projectRole?.trim() || employee.hgvRole,
        allocationPct: Math.round(allocPct * 100) / 100,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: status === "CONFIRMED" ? "CONFIRMED" : "DRAFT",
        proposedBy: user.displayName || user.email,
        confirmedBy: status === "CONFIRMED" ? user.displayName || user.email : null,
        notes: notes?.trim() || null,
      },
      include: {
        employee: { select: { employeeName: true, employeeId: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "CREATE",
      entityType: "ALLOCATION",
      entityId: allocation.id,
      description: `Created ${allocation.status} allocation for ${employee.employeeName} on '${allocation.projectName}' (${Math.round(allocPct * 100)}%)`,
      afterJson: allocation,
    });

    return NextResponse.json({
      success: true,
      allocation,
      projectedTotalAllocation: (confirmedPctInt + (status === "CONFIRMED" ? requestedPctInt : 0)) / 100,
      isOverAllocated: false,
      warning: null,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to finalize allocations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { allocationIds, projectName, projectId } = body;

    let draftsToConfirm: any[] = [];

    if (Array.isArray(allocationIds) && allocationIds.length > 0) {
      draftsToConfirm = await prisma.projectAllocation.findMany({
        where: { id: { in: allocationIds }, status: "DRAFT" },
        include: { employee: { include: { projectAllocations: { where: { status: "CONFIRMED" } } } } },
      });
    } else if (projectId || projectName) {
      const whereClause: any = { status: "DRAFT" };
      if (projectId) whereClause.projectId = projectId;
      else if (projectName) whereClause.projectName = projectName;

      draftsToConfirm = await prisma.projectAllocation.findMany({
        where: whereClause,
        include: { employee: { include: { projectAllocations: { where: { status: "CONFIRMED" } } } } },
      });
    }

    if (draftsToConfirm.length === 0) {
      return NextResponse.json({ error: "No draft allocations found to finalize" }, { status: 400 });
    }

    // Strict 100% Cap Validation before confirming drafts
    const runningTotals = new Map<string, number>();
    for (const draft of draftsToConfirm) {
      const emp = draft.employee;
      const baseConfirmed = runningTotals.has(emp.id)
        ? runningTotals.get(emp.id)!
        : Math.round(
            emp.projectAllocations.reduce((s: number, a: any) => s + (a.allocationPct || 0), 0) * 100
          );
      const draftPct = Math.round((draft.allocationPct || 0) * 100);
      if (baseConfirmed + draftPct > 100) {
        return NextResponse.json(
          {
            error: `Over-allocation prevented: Cannot finalize allocation for ${emp.employeeName} (${draftPct}%), as their total confirmed allocation would reach ${baseConfirmed + draftPct}% (exceeding 100%).`,
          },
          { status: 400 }
        );
      }
      runningTotals.set(emp.id, baseConfirmed + draftPct);
    }

    const targetIds = draftsToConfirm.map((d) => d.id);

    await prisma.projectAllocation.updateMany({
      where: { id: { in: targetIds } },
      data: {
        status: "CONFIRMED",
        confirmedBy: user.displayName || user.email,
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "ALLOCATION",
      description: `Finalized and confirmed ${targetIds.length} draft allocation(s)${projectName ? ` for project '${projectName}'` : ""}`,
    });

    return NextResponse.json({
      success: true,
      confirmedCount: targetIds.length,
      message: `Successfully finalized ${targetIds.length} allocation(s).`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete allocations" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Allocation ID is required" }, { status: 400 });

    const existing = await prisma.projectAllocation.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) return NextResponse.json({ error: "Allocation not found" }, { status: 404 });

    await prisma.projectAllocation.delete({ where: { id } });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "ALLOCATION",
      entityId: id,
      description: `Removed allocation for ${existing.employee.employeeName} on project '${existing.projectName}'`,
      beforeJson: existing,
    });

    return NextResponse.json({ success: true, message: "Allocation deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
