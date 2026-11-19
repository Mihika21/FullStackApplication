import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const categories = await prisma.skillCategory.findMany({
      where: { active: true },
      include: {
        skills: {
          where: { active: true },
          orderBy: { name: "asc" },
        },
        _count: {
          select: { skills: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(categories);
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
        { error: "Forbidden: You do not have permission to create skill categories" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, sortOrder = 10 } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const existing = await prisma.skillCategory.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }

    const category = await prisma.skillCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 10,
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "CREATE",
      entityType: "SKILL_CATEGORY",
      entityId: category.id,
      description: `Created new skill category '${category.name}'`,
      afterJson: category,
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
