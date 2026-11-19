import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = { active: true };
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { synonyms: { contains: search } },
      ];
    }

    const skills = await prisma.skill.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { employeeRatings: true },
        },
      },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(skills);
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
        { error: "Forbidden: You do not have permission to manage skills taxonomy" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, categoryId, categoryName, type = "Technical", synonyms, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
    }

    let finalCategoryId = categoryId;

    // Support creating or finding category on the fly
    if (!finalCategoryId && categoryName) {
      let cat = await prisma.skillCategory.findUnique({
        where: { name: categoryName.trim() },
      });
      if (!cat) {
        cat = await prisma.skillCategory.create({
          data: {
            name: categoryName.trim(),
            description: `Auto-created category for ${categoryName.trim()}`,
            sortOrder: 10,
          },
        });
      }
      finalCategoryId = cat.id;
    }

    if (!finalCategoryId) {
      return NextResponse.json({ error: "Skill category is required" }, { status: 400 });
    }

    // Check duplicate skill name
    const existing = await prisma.skill.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: `Skill '${name.trim()}' already exists` }, { status: 400 });
    }

    // Auto-generate code if needed
    const count = await prisma.skill.count();
    const code = `SK${String(count + 1).padStart(3, "0")}`;

    const newSkill = await prisma.skill.create({
      data: {
        code,
        name: name.trim(),
        categoryId: finalCategoryId,
        type: type || "Technical",
        synonyms: synonyms?.trim() || null,
        description: description?.trim() || null,
      },
      include: {
        category: true,
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "CREATE",
      entityType: "SKILL",
      entityId: newSkill.id,
      description: `Created new ${newSkill.type} skill '${newSkill.name}' in category '${newSkill.category.name}'`,
      afterJson: newSkill,
    });

    return NextResponse.json({ success: true, skill: newSkill }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
