import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const selectedManager = searchParams.get("manager"); // optional filter
    const selectedDept = searchParams.get("department");

    // Mandatory courses for compliance heatmap
    const mandatoryCourses = await prisma.lmsCourse.findMany({
      where: { isMandatory: true, status: "PUBLISHED" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        recertificationDays: true,
        passingScore: true,
      },
    });

    const whereEmp: any = {
      assignmentStatus: "Active",
    };

    // If caller is GCC_LEAD (e.g. Jeff Chu), filter to his direct reports unless overridden
    if (user.roleCode === "GCC_LEAD" && !selectedManager) {
      whereEmp.reportingManager = user.displayName;
    } else if (selectedManager && selectedManager !== "ALL") {
      whereEmp.reportingManager = selectedManager;
    }

    if (selectedDept && selectedDept !== "ALL") {
      whereEmp.hgvDepartment = selectedDept;
    }

    const employees = await prisma.employee.findMany({
      where: whereEmp,
      select: {
        id: true,
        employeeId: true,
        employeeName: true,
        hgvRole: true,
        hgvDepartment: true,
        reportingManager: true,
      },
      orderBy: { employeeName: "asc" },
    });

    // Also include demo user Alex Rivera if not already in employees
    const allEmployees = [...employees];
    const hasAlex = allEmployees.some((e) => e.employeeName === "Alex Rivera");
    if (!hasAlex && (user.roleCode === "HR_MANAGER" || user.roleCode === "AUDITOR" || selectedManager === "Sarah Jenkins")) {
      allEmployees.unshift({
        id: "demo-alex-rivera-id",
        employeeId: "IN01809999",
        employeeName: "Alex Rivera",
        hgvRole: "HR Operations Lead",
        hgvDepartment: "Human Resources",
        reportingManager: "Sarah Jenkins",
      });
    }

    // Fetch all enrollments for these employees
    const empIds = allEmployees.map((e) => e.id);
    const empEmails = allEmployees.map(
      (e) => `${e.employeeName.toLowerCase().replace(/[^a-z]/g, ".")}@hgv.com`
    );

    const enrollments = await prisma.lmsEnrollment.findMany({
      where: {
        OR: [
          { employeeId: { in: empIds } },
          { userEmail: { in: empEmails } },
          { userEmail: "alex.rivera@hgv.com" },
        ],
      },
      include: {
        certificate: true,
        nudgeLogs: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
    });

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Build the heatmap matrix
    let totalCells = 0;
    let completedCells = 0;
    let overdueCells = 0;
    let dueSoonCells = 0;
    let inProgressCells = 0;

    const teamMatrix = allEmployees.map((emp) => {
      const empEmail = `${emp.employeeName.toLowerCase().replace(/[^a-z]/g, ".")}@hgv.com`;
      const empEnrollments = enrollments.filter(
        (enr) =>
          enr.employeeId === emp.id ||
          enr.userEmail.toLowerCase() === empEmail.toLowerCase() ||
          (emp.employeeName === "Alex Rivera" && enr.userEmail === "alex.rivera@hgv.com")
      );

      let empIsFullyCompliant = true;
      let empHasOverdue = false;

      const courseStatuses: Record<string, any> = {};

      for (const course of mandatoryCourses) {
        totalCells++;
        const enr = empEnrollments.find((e) => e.courseId === course.id);

        if (!enr) {
          courseStatuses[course.id] = {
            status: "NOT_ENROLLED",
            badge: "gray",
            progressPercent: 0,
            dueDate: null,
            enrollmentId: null,
          };
          empIsFullyCompliant = false;
        } else if (enr.status === "COMPLETED") {
          completedCells++;
          courseStatuses[course.id] = {
            status: "COMPLETED",
            badge: "green",
            progressPercent: 100,
            completedAt: enr.completedAt,
            certificateNumber: enr.certificate?.certificateNumber,
            enrollmentId: enr.id,
          };
        } else {
          const isOverdue =
            enr.status === "OVERDUE" || (enr.dueDate && new Date(enr.dueDate) < now);
          const isDueSoon =
            !isOverdue && enr.dueDate && new Date(enr.dueDate) <= sevenDaysFromNow;

          empIsFullyCompliant = false;

          if (isOverdue) {
            overdueCells++;
            empHasOverdue = true;
            courseStatuses[course.id] = {
              status: "OVERDUE",
              badge: "red",
              progressPercent: enr.progressPercent,
              dueDate: enr.dueDate,
              enrollmentId: enr.id,
              lastNudge: enr.nudgeLogs[0] || null,
            };
          } else if (isDueSoon) {
            dueSoonCells++;
            courseStatuses[course.id] = {
              status: "DUE_SOON",
              badge: "yellow",
              progressPercent: enr.progressPercent,
              dueDate: enr.dueDate,
              enrollmentId: enr.id,
              lastNudge: enr.nudgeLogs[0] || null,
            };
          } else {
            inProgressCells++;
            courseStatuses[course.id] = {
              status: "IN_PROGRESS",
              badge: "blue",
              progressPercent: enr.progressPercent,
              dueDate: enr.dueDate,
              enrollmentId: enr.id,
              lastNudge: enr.nudgeLogs[0] || null,
            };
          }
        }
      }

      return {
        employee: emp,
        isFullyCompliant: empIsFullyCompliant,
        hasOverdue: empHasOverdue,
        courses: courseStatuses,
      };
    });

    const teamCompliancePercent =
      totalCells > 0 ? Math.round((completedCells / totalCells) * 1000) / 10 : 0;

    // Get list of distinct managers for filter dropdown
    const managers = await prisma.employee.findMany({
      where: { reportingManager: { not: null } },
      distinct: ["reportingManager"],
      select: { reportingManager: true },
    });

    const departments = await prisma.employee.findMany({
      where: { hgvDepartment: { not: null } },
      distinct: ["hgvDepartment"],
      select: { hgvDepartment: true },
    });

    return NextResponse.json({
      mandatoryCourses,
      teamMatrix,
      summary: {
        totalTeamMembers: allEmployees.length,
        fullyCompliantCount: teamMatrix.filter((t) => t.isFullyCompliant).length,
        overdueCount: overdueCells,
        dueSoonCount: dueSoonCells,
        completedCount: completedCells,
        totalObligations: totalCells,
        teamCompliancePercent,
      },
      filterOptions: {
        managers: managers.map((m) => m.reportingManager).filter(Boolean),
        departments: departments.map((d) => d.hgvDepartment).filter(Boolean),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
