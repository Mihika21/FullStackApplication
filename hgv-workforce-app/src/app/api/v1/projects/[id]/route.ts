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

    let project = await prisma.project.findUnique({
      where: { id },
      include: {
        allocations: {
          include: {
            employee: {
              include: {
                domainLead: { select: { name: true } },
                projectAllocations: {
                  where: { status: "CONFIRMED" },
                  select: { id: true, allocationPct: true, projectName: true },
                },
                skillRatings: {
                  include: { skill: true },
                  orderBy: { validatedRating: "desc" },
                  take: 5,
                },
              },
            },
          },
          orderBy: [{ status: "asc" }, { allocationPct: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    // Fallback: lookup by decoded project name if needed
    if (!project) {
      const decodedName = decodeURIComponent(id);
      project = await prisma.project.findUnique({
        where: { name: decodedName },
        include: {
          allocations: {
            include: {
              employee: {
                include: {
                  domainLead: { select: { name: true } },
                  projectAllocations: {
                    where: { status: "CONFIRMED" },
                    select: { id: true, allocationPct: true, projectName: true },
                  },
                  skillRatings: {
                    include: { skill: true },
                    orderBy: { validatedRating: "desc" },
                    take: 5,
                  },
                },
              },
            },
            orderBy: [{ status: "asc" }, { allocationPct: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const enrichedAllocations = project.allocations.map((alloc) => {
      const empConfirmedTotal = alloc.employee.projectAllocations.reduce(
        (sum, a) => sum + (a.allocationPct || 0),
        0
      );
      return {
        ...alloc,
        employeeConfirmedTotalPct: Math.round(empConfirmedTotal * 100) / 100,
        employeeFreeCapacityPct: Math.max(0, Math.round((1.0 - empConfirmedTotal) * 100) / 100),
      };
    });

    const confirmedCount = enrichedAllocations.filter((a) => a.status === "CONFIRMED").length;
    const draftCount = enrichedAllocations.filter((a) => a.status === "DRAFT").length;
    const confirmedFte = enrichedAllocations
      .filter((a) => a.status === "CONFIRMED")
      .reduce((s, a) => s + (a.allocationPct || 0), 0);
    const draftFte = enrichedAllocations
      .filter((a) => a.status === "DRAFT")
      .reduce((s, a) => s + (a.allocationPct || 0), 0);

    return NextResponse.json({
      ...project,
      allocations: enrichedAllocations,
      confirmedCount,
      draftCount,
      confirmedFte: Math.round(confirmedFte * 100) / 100,
      draftFte: Math.round(draftFte * 100) / 100,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to update projects" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, clientName, description, status, startDate, endDate } = body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (name && name.trim()) {
      const allProjects = await prisma.project.findMany({
        where: { id: { not: id } },
        select: { id: true, name: true },
      });
      const dup = allProjects.find(
        (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (dup) {
        return NextResponse.json(
          { error: `A project named '${dup.name}' already exists.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        clientName: clientName !== undefined ? clientName : existing.clientName,
        description: description !== undefined ? description : existing.description,
        status: status || existing.status,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
      },
    });

    // Keep denormalized projectName synced on allocations if renamed
    if (name && name.trim() !== existing.name) {
      await prisma.projectAllocation.updateMany({
        where: { projectId: id },
        data: { projectName: updated.name },
      });
    }

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "PROJECT",
      entityId: id,
      description: `Updated project '${updated.name}'`,
      beforeJson: existing,
      afterJson: updated,
    });

    return NextResponse.json({ success: true, project: updated });
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
        { error: "Forbidden: You do not have permission to delete projects" },
        { status: 403 }
      );
    }

    const { id } = params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "PROJECT",
      entityId: id,
      description: `Deleted project '${existing.name}' and its allocations`,
      beforeJson: existing,
    });

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
