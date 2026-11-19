import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");

    const where: any = {};
    if (department && department !== "ALL") where.department = department;
    if (courseId && courseId !== "ALL") where.courseId = courseId;
    if (status && status !== "ALL") where.status = status;

    const enrollments = await prisma.lmsEnrollment.findMany({
      where,
      include: {
        course: true,
        certificate: true,
        quizAttempts: {
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { course: { title: "asc" } },
        { userName: "asc" },
      ],
    });

    // Format as CSV
    const headers = [
      "Employee Name",
      "Corporate Email",
      "Department",
      "Course Title",
      "Category",
      "Mandatory Compliance",
      "Enrollment Status",
      "Progress %",
      "Assigned Date",
      "Due Date",
      "Completed Date",
      "Quiz Score %",
      "Certificate Number",
      "SHA-256 Verification Hash",
      "Verification Status",
      "Audit Verification URL",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = enrollments.map((enr) => {
      const cert = enr.certificate;
      const latestAttempt = enr.quizAttempts[0];
      const score = cert?.scorePercent ?? latestAttempt?.scorePercent ?? null;
      const certNum = cert?.certificateNumber ?? "N/A";
      const hash = cert?.verificationHash ?? "N/A";
      const verifyUrl = certNum !== "N/A" ? `https://hgv.workforce/lms/verify/${certNum}` : "N/A";

      return [
        escapeCsv(enr.userName),
        escapeCsv(enr.userEmail),
        escapeCsv(enr.department || "General"),
        escapeCsv(enr.course.title),
        escapeCsv(enr.course.category),
        escapeCsv(enr.course.isMandatory ? "YES (MANDATORY)" : "NO (ELECTIVE)"),
        escapeCsv(enr.status),
        escapeCsv(`${enr.progressPercent}%`),
        escapeCsv(enr.enrolledAt ? new Date(enr.enrolledAt).toISOString().split("T")[0] : ""),
        escapeCsv(enr.dueDate ? new Date(enr.dueDate).toISOString().split("T")[0] : ""),
        escapeCsv(enr.completedAt ? new Date(enr.completedAt).toISOString().split("T")[0] : "PENDING"),
        escapeCsv(score !== null && score !== undefined ? `${score}%` : "NOT_ATTEMPTED"),
        escapeCsv(certNum),
        escapeCsv(hash),
        escapeCsv(cert ? cert.status : "NOT_CERTIFIED"),
        escapeCsv(verifyUrl),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `SOC2_ISO27001_Compliance_Audit_Package_${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
