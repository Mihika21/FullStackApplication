import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logLmsAudit } from "@/lib/lms";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user.roleCode !== "HR_MANAGER" && user.roleCode !== "AUDITOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Find certificates expiring in <= 30 days that have not already been re-enrolled
    const expiringCerts = await prisma.lmsCertificate.findMany({
      where: {
        expiresAt: {
          lte: thirtyDaysAhead,
        },
        status: "VALID",
      },
      include: {
        course: true,
      },
    });

    const reEnrolledList = [];

    for (const cert of expiringCerts) {
      // Check if there is an active ongoing enrollment for this user and course
      const existingActiveEnrollment = await prisma.lmsEnrollment.findFirst({
        where: {
          courseId: cert.courseId,
          userEmail: cert.userEmail,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
      });

      if (!existingActiveEnrollment) {
        // Create new recertification cycle enrollment
        const newDueDate = new Date(cert.expiresAt);
        const newEnrollment = await prisma.lmsEnrollment.create({
          data: {
            userEmail: cert.userEmail,
            userName: cert.userName,
            courseId: cert.courseId,
            status: "ASSIGNED",
            dueDate: newDueDate,
            isRecertification: true,
            previousCertId: cert.id,
            progressPercent: 0,
          },
        });

        // Mark old certificate status as EXPIRING_SOON if still marked VALID
        await prisma.lmsCertificate.update({
          where: { id: cert.id },
          data: { status: "EXPIRING_SOON" },
        });

        reEnrolledList.push({
          userEmail: cert.userEmail,
          userName: cert.userName,
          courseTitle: cert.course.title,
          expiresAt: cert.expiresAt,
          newEnrollmentId: newEnrollment.id,
        });

        await logLmsAudit({
          actorEmail: user.email,
          actorRole: user.roleCode,
          action: "RECERTIFICATION_TRIGGERED",
          targetEntity: "ENROLLMENT",
          entityId: newEnrollment.id,
          details: {
            userEmail: cert.userEmail,
            courseTitle: cert.course.title,
            previousCertNumber: cert.certificateNumber,
          },
        });
      }
    }

    // 2. Also flag overdue uncompleted enrollments
    const overdueEnrollments = await prisma.lmsEnrollment.findMany({
      where: {
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
    });

    for (const ov of overdueEnrollments) {
      await prisma.lmsEnrollment.update({
        where: { id: ov.id },
        data: { status: "OVERDUE" },
      });
    }

    return NextResponse.json({
      success: true,
      scannedExpiringCount: expiringCerts.length,
      autoReEnrolledCount: reEnrolledList.length,
      overdueFlaggedCount: overdueEnrollments.length,
      details: reEnrolledList,
      message: `Recertification Cadence Scan Complete: ${reEnrolledList.length} employees auto-enrolled in mandatory recertification cycle (T-30 SLA), ${overdueEnrollments.length} delinquent enrollments flagged as non-compliant.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
