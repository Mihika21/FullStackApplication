import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logLmsAudit } from "@/lib/lms";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { enrollmentId, lessonId, secondsWatched = 0, completed = false } = body;

    if (!enrollmentId || !lessonId) {
      return NextResponse.json({ error: "enrollmentId and lessonId are required" }, { status: 400 });
    }

    const enrollment = await prisma.lmsEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: true },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const lesson = await prisma.lmsLesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Upsert lesson progress
    const progress = await prisma.lmsLessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      create: {
        enrollmentId,
        lessonId,
        userId: user.id,
        secondsWatched: parseInt(secondsWatched),
        completed: Boolean(completed),
        completedAt: completed ? new Date() : null,
      },
      update: {
        secondsWatched: {
          set: Math.max(parseInt(secondsWatched), 0),
        },
        completed: completed ? true : undefined,
        completedAt: completed ? new Date() : undefined,
      },
    });

    // Calculate total lessons vs completed lessons
    const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
    const completedProgress = await prisma.lmsLessonProgress.count({
      where: {
        enrollmentId,
        completed: true,
      },
    });

    const totalCount = allLessons.length;
    const progressPercent = totalCount > 0 ? Math.min(Math.round((completedProgress / totalCount) * 100), 99) : 0;

    const newStatus =
      enrollment.status === "COMPLETED"
        ? "COMPLETED"
        : enrollment.status === "OVERDUE"
        ? "OVERDUE"
        : "IN_PROGRESS";

    await prisma.lmsEnrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercent,
        currentLessonId: lessonId,
        status: newStatus,
      },
    });

    if (completed) {
      await logLmsAudit({
        actorEmail: user.email,
        actorRole: user.roleCode,
        action: "LESSON_COMPLETED",
        targetEntity: "LESSON",
        entityId: lessonId,
        details: { lessonTitle: lesson.title, courseTitle: enrollment.course.title },
      });
    }

    return NextResponse.json({
      success: true,
      progress,
      progressPercent,
      completedLessons: completedProgress,
      totalLessons: totalCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
