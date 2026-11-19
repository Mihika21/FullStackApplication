import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logLmsAudit } from "@/lib/lms";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const course = await prisma.lmsCourse.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: { orderBy: { orderIndex: "asc" } },
            quiz: {
              include: {
                questions: {
                  orderBy: { orderIndex: "asc" },
                  include: {
                    options: { orderBy: { orderIndex: "asc" } },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            certificates: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course });
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
    if (user.roleCode !== "HR_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    const updated = await prisma.lmsCourse.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        isMandatory: body.isMandatory !== undefined ? Boolean(body.isMandatory) : undefined,
        recertificationDays: body.recertificationDays !== undefined ? parseInt(body.recertificationDays) : undefined,
        passingScore: body.passingScore !== undefined ? parseInt(body.passingScore) : undefined,
        estimatedDurationMinutes: body.estimatedDurationMinutes !== undefined ? parseInt(body.estimatedDurationMinutes) : undefined,
        enforceVideoCompletion: body.enforceVideoCompletion !== undefined ? Boolean(body.enforceVideoCompletion) : undefined,
        targetDepartment: body.targetDepartment,
        targetRole: body.targetRole,
        status: body.status,
      },
    });

    await logLmsAudit({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "COURSE_UPDATED",
      targetEntity: "COURSE",
      entityId: id,
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json({ course: updated });
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
    if (user.roleCode !== "HR_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    await prisma.lmsCourse.delete({ where: { id } });

    await logLmsAudit({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "COURSE_DELETED",
      targetEntity: "COURSE",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
