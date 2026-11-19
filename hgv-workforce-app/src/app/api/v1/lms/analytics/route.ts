import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Total active enrollments across mandatory courses
    const allMandatoryEnrollments = await prisma.lmsEnrollment.findMany({
      where: {
        course: { isMandatory: true },
      },
      include: {
        course: true,
      },
    });

    const totalCount = allMandatoryEnrollments.length;
    let completedCount = 0;
    let overdueCount = 0;
    let inProgressCount = 0;
    let assignedCount = 0;

    const deptMap: Record<string, { total: number; completed: number; overdue: number }> = {};

    for (const enr of allMandatoryEnrollments) {
      const dept = enr.department || "General";
      if (!deptMap[dept]) {
        deptMap[dept] = { total: 0, completed: 0, overdue: 0 };
      }
      deptMap[dept].total++;

      if (enr.status === "COMPLETED") {
        completedCount++;
        deptMap[dept].completed++;
      } else if (enr.status === "OVERDUE" || (enr.dueDate && new Date(enr.dueDate) < now)) {
        overdueCount++;
        deptMap[dept].overdue++;
      } else if (enr.status === "IN_PROGRESS") {
        inProgressCount++;
      } else {
        assignedCount++;
      }
    }

    const overallCompliancePercent =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 1000) / 10 : 0;
    const overdueRatePercent =
      totalCount > 0 ? Math.round((overdueCount / totalCount) * 1000) / 10 : 0;

    // Department rankings
    const departmentRankings = Object.entries(deptMap)
      .map(([name, data]) => ({
        name,
        total: data.total,
        completed: data.completed,
        overdue: data.overdue,
        compliancePercent:
          data.total > 0 ? Math.round((data.completed / data.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.compliancePercent - a.compliancePercent);

    // Expiring certificates (T-30 recertification radar)
    const expiringSoonCertificates = await prisma.lmsCertificate.findMany({
      where: {
        status: "VALID",
        expiresAt: {
          gte: now,
          lte: thirtyDaysAhead,
        },
      },
      include: { course: true },
      orderBy: { expiresAt: "asc" },
      take: 15,
    });

    // Recent nudges
    const recentNudges = await prisma.lmsNudgeLog.findMany({
      take: 10,
      orderBy: { sentAt: "desc" },
      include: {
        enrollment: {
          include: { course: true },
        },
      },
    });

    // Recent audit logs
    const recentAuditLogs = await prisma.lmsAuditTrail.findMany({
      take: 15,
      orderBy: { timestamp: "desc" },
    });

    // Total certified count
    const totalCertificatesIssued = await prisma.lmsCertificate.count();

    return NextResponse.json({
      scorecard: {
        overallCompliancePercent,
        targetSla: 99.5,
        totalEnrollments: totalCount,
        completedCount,
        overdueCount,
        inProgressCount,
        assignedCount,
        overdueRatePercent,
        overdueSlaTarget: 2.0,
        totalCertificatesIssued,
        recertificationRadarCount: expiringSoonCertificates.length,
      },
      departmentRankings,
      expiringSoonCertificates,
      recentNudges,
      recentAuditLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
