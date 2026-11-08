import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;

    if (type === "all") {
      const [domainLeads, sources, shiftTypes, roles] = await Promise.all([
        prisma.domainLead.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
        prisma.source.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
        prisma.shiftType.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
        prisma.role.findMany({ orderBy: { name: "asc" } }),
      ]);

      return NextResponse.json({
        domainLeads,
        sources,
        shiftTypes,
        roles,
        engagementTypes: ["GCC", "NOC", "Rebadge", "Colocation", "Non-GCC"],
        employmentCategories: [
          "Full Time",
          "Individual Consultant",
          "C2C Consultant",
          "Rebadge",
          "Colocation",
        ],
        assignmentStatuses: [
          "Onboarding",
          "Active",
          "Probation",
          "Notice Period",
          "On Leave",
          "Resigned",
          "Terminated",
          "Inactive",
        ],
        genders: ["Female", "Male", "Non-Binary", "Prefer not to say"],
        variablePayModes: ["NONE", "FLAT_PERCENT", "CUSTOM_AMOUNT"],
      });
    }

    if (type === "domain-leads") {
      const items = await prisma.domainLead.findMany({ where: { active: true }, orderBy: { name: "asc" } });
      return NextResponse.json(items);
    }

    if (type === "sources") {
      const items = await prisma.source.findMany({ where: { active: true }, orderBy: { name: "asc" } });
      return NextResponse.json(items);
    }

    if (type === "shift-types") {
      const items = await prisma.shiftType.findMany({ where: { active: true }, orderBy: { name: "asc" } });
      return NextResponse.json(items);
    }

    return NextResponse.json({ error: "Invalid reference type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json({ error: "Permission denied to add reference data" }, { status: 403 });
    }

    const { type } = params;
    const body = await request.json();
    const { name, code, defaultRate } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (type === "domain-leads") {
      const existing = await prisma.domainLead.findUnique({ where: { name: name.trim() } });
      if (existing) {
        return NextResponse.json({ error: "Domain Lead already exists" }, { status: 409 });
      }
      const item = await prisma.domainLead.create({ data: { name: name.trim() } });
      await logAuditEvent({
        actorEmail: user.email,
        actorRole: user.roleCode,
        action: "CREATE",
        entityType: "USER",
        description: `Added new Domain Lead: ${item.name}`,
      });
      return NextResponse.json(item, { status: 201 });
    }

    if (type === "sources") {
      const existing = await prisma.source.findUnique({ where: { name: name.trim() } });
      if (existing) {
        return NextResponse.json({ error: "Source already exists" }, { status: 409 });
      }
      const item = await prisma.source.create({ data: { name: name.trim() } });
      await logAuditEvent({
        actorEmail: user.email,
        actorRole: user.roleCode,
        action: "CREATE",
        entityType: "USER",
        description: `Added new Source: ${item.name}`,
      });
      return NextResponse.json(item, { status: 201 });
    }

    if (type === "shift-types") {
      if (!code) {
        return NextResponse.json({ error: "Code is required for shift type" }, { status: 400 });
      }
      const item = await prisma.shiftType.create({
        data: {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          defaultRate: parseFloat(defaultRate) || 0,
        },
      });
      await logAuditEvent({
        actorEmail: user.email,
        actorRole: user.roleCode,
        action: "CREATE",
        entityType: "USER",
        description: `Added new Shift Type: ${item.name} (${item.code})`,
      });
      return NextResponse.json(item, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid reference type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
