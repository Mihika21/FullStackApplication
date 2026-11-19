import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logLmsAudit } from "@/lib/lms";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isMandatory = searchParams.get("isMandatory");
    const status = searchParams.get("status");

    const where: any = {};
    if (category) where.category = category;
    if (isMandatory !== null && isMandatory !== undefined && isMandatory !== "") {
      where.isMandatory = isMandatory === "true";
    }
    if (status) where.status = status;

    const courses = await prisma.lmsCourse.findMany({
      where,
      include: {
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            lessons: { orderBy: { orderIndex: "asc" } },
            quiz: {
              include: {
                questions: {
                  include: { options: true },
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
      orderBy: [{ isMandatory: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ courses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (user.roleCode !== "HR_MANAGER") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      description,
      category,
      isMandatory,
      recertificationDays,
      passingScore,
      estimatedDurationMinutes,
      enforceVideoCompletion,
      targetDepartment,
      targetRole,
      status,
      modules,
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const generatedSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const newCourse = await prisma.lmsCourse.create({
      data: {
        title,
        slug: generatedSlug,
        description,
        category: category || "Cybersecurity & IT",
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : true,
        recertificationDays: recertificationDays !== undefined ? parseInt(recertificationDays) : 365,
        passingScore: passingScore !== undefined ? parseInt(passingScore) : 80,
        estimatedDurationMinutes: estimatedDurationMinutes !== undefined ? parseInt(estimatedDurationMinutes) : 45,
        enforceVideoCompletion: enforceVideoCompletion !== undefined ? Boolean(enforceVideoCompletion) : true,
        targetDepartment: targetDepartment || null,
        targetRole: targetRole || null,
        status: status || "PUBLISHED",
      },
    });

    // If modules were provided
    if (Array.isArray(modules)) {
      for (let mIdx = 0; mIdx < modules.length; mIdx++) {
        const mod = modules[mIdx];
        const createdModule = await prisma.lmsModule.create({
          data: {
            courseId: newCourse.id,
            title: mod.title || `Module ${mIdx + 1}`,
            description: mod.description || null,
            orderIndex: mIdx + 1,
          },
        });

        if (Array.isArray(mod.lessons)) {
          for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
            const les = mod.lessons[lIdx];
            await prisma.lmsLesson.create({
              data: {
                moduleId: createdModule.id,
                title: les.title || `Lesson ${lIdx + 1}`,
                contentType: les.contentType || "TEXT",
                contentUrl: les.contentUrl || null,
                textContent: les.textContent || null,
                durationSec: les.durationSec ? parseInt(les.durationSec) : 300,
                orderIndex: lIdx + 1,
              },
            });
          }
        }
      }
    }

    await logLmsAudit({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "COURSE_PUBLISHED",
      targetEntity: "COURSE",
      entityId: newCourse.id,
      details: { title: newCourse.title, isMandatory: newCourse.isMandatory },
    });

    return NextResponse.json({ course: newCourse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
