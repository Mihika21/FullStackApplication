import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logLmsAudit } from "@/lib/lms";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);

    let userEmail = searchParams.get("userEmail");
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");
    const scope = searchParams.get("scope"); // "mine" or "all"

    // Default to current user's email if learner scope or if role is HR_TEAM_MEMBER without explicit scope=all
    if (scope === "mine" || (!userEmail && user.roleCode === "HR_TEAM_MEMBER" && scope !== "all")) {
      userEmail = user.email;
    }

    const where: any = {};
    if (userEmail) where.userEmail = userEmail;
    if (department) where.department = department;
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;

    const enrollments = await prisma.lmsEnrollment.findMany({
      where,
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
                quiz: true,
              },
            },
          },
        },
        certificate: true,
        lessonProgress: true,
        nudgeLogs: {
          orderBy: { sentAt: "desc" },
          take: 3,
        },
      },
      orderBy: [
        { status: "asc" }, // OVERDUE first or ASSIGNED
        { dueDate: "asc" },
      ],
    });

    // Check for any enrollments that passed due date but are not COMPLETED, mark as OVERDUE
    const now = new Date();
    const updatedEnrollments = enrollments.map((enr) => {
      if (enr.status !== "COMPLETED" && enr.dueDate && new Date(enr.dueDate) < now) {
        return { ...enr, status: "OVERDUE", isOverdue: true };
      }
      return {
        ...enr,
        isOverdue: enr.status === "OVERDUE" || (enr.status !== "COMPLETED" && new Date(enr.dueDate) < now),
      };
    });

    return NextResponse.json({ enrollments: updatedEnrollments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { courseId, employeeIds, userEmail, userName, department, daysToComplete = 30 } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const course = await prisma.lmsCourse.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(daysToComplete));

    const createdEnrollments = [];

    // Case 1: Bulk enrollment by employeeIds or department
    if (Array.isArray(employeeIds) && employeeIds.length > 0) {
      if (user.roleCode !== "HR_MANAGER" && user.roleCode !== "GCC_LEAD") {
        return NextResponse.json({ error: "Unauthorized for bulk assignment" }, { status: 403 });
      }

      const emps = await prisma.employee.findMany({
        where: { id: { in: employeeIds } },
      });

      for (const emp of emps) {
        const empEmail = `${emp.employeeName.toLowerCase().replace(/[^a-z]/g, ".")}@hgv.com`;
        
        // Upsert or create
        const existing = await prisma.lmsEnrollment.findFirst({
          where: { courseId, userEmail: empEmail, status: { not: "COMPLETED" } },
        });

        if (!existing) {
          const enr = await prisma.lmsEnrollment.create({
            data: {
              employeeId: emp.id,
              userEmail: empEmail,
              userName: emp.employeeName,
              department: emp.hgvDepartment || "General",
              courseId,
              dueDate,
              status: "ASSIGNED",
              progressPercent: 0,
            },
          });
          createdEnrollments.push(enr);
        }
      }
    } else {
      // Case 2: Single enrollment (Self-enrollment or individual assignment)
      const targetEmail = userEmail || user.email;
      const targetName = userName || user.displayName;
      const targetDept = department || "Corporate";

      const existing = await prisma.lmsEnrollment.findFirst({
        where: { courseId, userEmail: targetEmail, status: { not: "COMPLETED" } },
      });

      if (existing) {
        return NextResponse.json({
          message: "Already enrolled in this course",
          enrollment: existing,
        });
      }

      const enr = await prisma.lmsEnrollment.create({
        data: {
          userEmail: targetEmail,
          userName: targetName,
          department: targetDept,
          courseId,
          dueDate,
          status: "ASSIGNED",
          progressPercent: 0,
        },
      });
      createdEnrollments.push(enr);
    }

    await logLmsAudit({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "ENROLLMENT_CREATED",
      targetEntity: "ENROLLMENT",
      details: { courseTitle: course.title, totalAssigned: createdEnrollments.length },
    });

    return NextResponse.json({
      success: true,
      count: createdEnrollments.length,
      enrollments: createdEnrollments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
