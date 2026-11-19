import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    // Auto-sync any unlinked allocations so every project name becomes a first-class Project record
    const unlinkedAllocs = await prisma.projectAllocation.findMany({
      where: { projectId: null },
    });

    if (unlinkedAllocs.length > 0) {
      const existingProjects = await prisma.project.findMany();
      const projByName = new Map(existingProjects.map((p) => [p.name.trim().toLowerCase(), p]));
      let projCount = existingProjects.length;

      for (const alloc of unlinkedAllocs) {
        const key = alloc.projectName.trim().toLowerCase();
        let proj = projByName.get(key);
        if (!proj) {
          projCount++;
          proj = await prisma.project.create({
            data: {
              name: alloc.projectName.trim(),
              code: `PRJ-${String(projCount).padStart(3, "0")}`,
              status: "ACTIVE",
              startDate: alloc.startDate,
            },
          });
          projByName.set(key, proj);
        }
        await prisma.projectAllocation.update({
          where: { id: alloc.id },
          data: { projectId: proj.id },
        });
      }
    }

    const projects = await prisma.project.findMany({
      include: {
        allocations: {
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
              },
            },
          },
          orderBy: [{ status: "asc" }, { allocationPct: "desc" }],
        },
      },
      orderBy: { name: "asc" },
    });

    const enriched = projects.map((proj) => {
      const confirmed = proj.allocations.filter((a) => a.status === "CONFIRMED");
      const drafts = proj.allocations.filter((a) => a.status === "DRAFT");
      const confirmedFte = confirmed.reduce((s, a) => s + (a.allocationPct || 0), 0);
      const draftFte = drafts.reduce((s, a) => s + (a.allocationPct || 0), 0);

      return {
        ...proj,
        confirmedCount: confirmed.length,
        draftCount: drafts.length,
        totalResources: proj.allocations.length,
        confirmedFte: Math.round(confirmedFte * 100) / 100,
        draftFte: Math.round(draftFte * 100) / 100,
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
        { error: "Forbidden: You do not have permission to create projects" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, code, clientName = "HGV", description, status = "ACTIVE", startDate, endDate } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Case-insensitive duplicate project name validation (Requirement 3)
    const allProjects = await prisma.project.findMany({
      select: { id: true, name: true },
    });
    const duplicate = allProjects.find(
      (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        {
          error: `A project named '${duplicate.name}' already exists. Duplicate project names are not allowed.`,
        },
        { status: 400 }
      );
    }

    const totalProjects = allProjects.length;
    const projectCode = code?.trim() || `PRJ-${String(totalProjects + 1).padStart(3, "0")}`;

    const project = await prisma.project.create({
      data: {
        name: trimmedName,
        code: projectCode,
        clientName: clientName?.trim() || "HGV",
        description: description?.trim() || null,
        status: status || "ACTIVE",
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "CREATE",
      entityType: "PROJECT",
      entityId: project.id,
      description: `Created new project '${project.name}' (${project.code})`,
      afterJson: project,
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
