import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logLmsAudit } from "@/lib/lms";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { enrollmentId, enrollmentIds, channel = "MULTI_CHANNEL", customMessage } = body;

    const targetEnrollmentIds: string[] = [];
    if (enrollmentId) targetEnrollmentIds.push(enrollmentId);
    if (Array.isArray(enrollmentIds)) {
      targetEnrollmentIds.push(...enrollmentIds);
    }

    if (targetEnrollmentIds.length === 0) {
      return NextResponse.json({ error: "At least one enrollmentId is required" }, { status: 400 });
    }

    const enrollments = await prisma.lmsEnrollment.findMany({
      where: { id: { in: targetEnrollmentIds } },
      include: { course: true },
    });

    if (enrollments.length === 0) {
      return NextResponse.json({ error: "No matching enrollments found" }, { status: 404 });
    }

    const createdNudgeLogs = [];
    const now = new Date();

    for (const enr of enrollments) {
      const message =
        customMessage ||
        `Urgent Compliance Reminder: Your mandatory certification for "${enr.course.title}" is due or overdue. Please complete your training immediately to maintain enterprise compliance status.`;

      const nudge = await prisma.lmsNudgeLog.create({
        data: {
          enrollmentId: enr.id,
          managerId: user.id,
          managerName: user.displayName,
          targetUserEmail: enr.userEmail,
          targetUserName: enr.userName,
          channel: channel.toUpperCase(),
          message,
          sentAt: now,
        },
      });

      createdNudgeLogs.push(nudge);

      await logLmsAudit({
        actorEmail: user.email,
        actorRole: user.roleCode,
        action: "NUDGE_SENT",
        targetEntity: "NUDGE",
        entityId: nudge.id,
        details: {
          recipientEmail: enr.userEmail,
          recipientName: enr.userName,
          courseTitle: enr.course.title,
          channel,
        },
      });
    }

    return NextResponse.json({
      success: true,
      nudgesSent: createdNudgeLogs.length,
      recipients: createdNudgeLogs.map((n) => n.targetUserName),
      channel,
      message: `Dispatched ${createdNudgeLogs.length} compliance nudge${
        createdNudgeLogs.length > 1 ? "s" : ""
      } across corporate ${channel} channels.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const nudgeLogs = await prisma.lmsNudgeLog.findMany({
      take: limit,
      orderBy: { sentAt: "desc" },
      include: {
        enrollment: {
          include: { course: true },
        },
      },
    });

    return NextResponse.json({ nudgeLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
