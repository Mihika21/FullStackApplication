import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canViewAudit) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view the audit trail" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "";
    const entityType = searchParams.get("entityType") || "";
    const actorEmail = searchParams.get("actorEmail") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (actorEmail) where.actorEmail = { contains: actorEmail };
    if (search.trim()) {
      where.OR = [
        { description: { contains: search.trim() } },
        { actorEmail: { contains: search.trim() } },
        { entityId: { contains: search.trim() } },
      ];
    }

    const [total, events] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
