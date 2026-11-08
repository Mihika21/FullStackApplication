import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const engagementType = searchParams.get("engagementType") || "";
    const domainLeadId = searchParams.get("domainLeadId") || "";
    const assignmentStatus = searchParams.get("assignmentStatus") || "";
    const gccPresence = searchParams.get("gccPresence");
    const employmentCategory = searchParams.get("employmentCategory") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { employeeName: { contains: search.trim() } },
        { employeeId: { contains: search.trim() } },
        { oraclePersonNumber: { contains: search.trim() } },
        { hgvRole: { contains: search.trim() } },
        { hgvDepartment: { contains: search.trim() } },
        { project: { contains: search.trim() } },
      ];
    }

    if (engagementType) where.engagementType = engagementType;
    if (domainLeadId) where.domainLeadId = domainLeadId;
    if (assignmentStatus) where.assignmentStatus = assignmentStatus;
    if (employmentCategory) where.employmentCategory = employmentCategory;
    if (gccPresence !== null && gccPresence !== undefined && gccPresence !== "") {
      where.gccPresence = gccPresence === "true";
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: {
          domainLead: true,
          source: true,
          shiftType: true,
          compensations: {
            orderBy: { effectiveFrom: "desc" },
            take: 1,
          },
        },
        orderBy: { employeeName: "asc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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
        { error: "Forbidden: You do not have permission to create employees" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      employeeId,
      employeeName,
      oraclePersonNumber,
      assignmentStatus = "Active",
      gender,
      engagementType,
      employmentCategory,
      gccPresence = true,
      hgvRole,
      hgvDepartment,
      domainLeadId,
      reportingManager,
      businessUnit,
      practice,
      subPractice,
      gradeLevel,
      project,
      sourceId,
      subSource,
      dateOfJoining,
      hgvStartDate,
      hgvEndDate,
      shiftTypeId,
      // Compensation fields
      fixedCtcInrAnnual,
      variablePayMode = "NONE",
      variablePayPercent,
      variablePayCustomInrMonthly,
      joiningBonusInr = 0,
      // Contact & address
      personalEmail,
      hgvEmail,
      mobile,
      emergencyContactName,
      emergencyContactPhone,
      qualification,
      baseLocation,
      currentAddress,
    } = body;

    // 1. Mandatory Common Validations
    if (!employeeName?.trim()) return NextResponse.json({ error: "Employee Name is required" }, { status: 400 });
    if (!assignmentStatus) return NextResponse.json({ error: "Assignment Status is required" }, { status: 400 });
    if (!gender) return NextResponse.json({ error: "Gender is required" }, { status: 400 });
    if (!hgvRole?.trim()) return NextResponse.json({ error: "HGV Role is required" }, { status: 400 });
    if (!domainLeadId) return NextResponse.json({ error: "Domain Lead is required" }, { status: 400 });
    if (!engagementType) return NextResponse.json({ error: "Engagement Type is required" }, { status: 400 });
    if (!sourceId) return NextResponse.json({ error: "Source is required" }, { status: 400 });

    // 2. Engagement-specific dynamic mandatory checks
    if (engagementType === "GCC" || engagementType === "NOC") {
      if (!employeeId?.trim()) return NextResponse.json({ error: "Employee ID is required for GCC/NOC" }, { status: 400 });
      if (!hgvStartDate) return NextResponse.json({ error: "HGV Start Date is required for GCC/NOC" }, { status: 400 });
      if (!hgvDepartment?.trim()) return NextResponse.json({ error: "HGV Department is required for GCC/NOC" }, { status: 400 });
      if (!employmentCategory) return NextResponse.json({ error: "Employment Category is required for GCC/NOC" }, { status: 400 });
      if (!shiftTypeId) return NextResponse.json({ error: "Shift Type is required for GCC/NOC" }, { status: 400 });
      if (fixedCtcInrAnnual === undefined || fixedCtcInrAnnual === null || Number(fixedCtcInrAnnual) < 0) {
        return NextResponse.json({ error: "Valid Fixed CTC (INR) is required for GCC/NOC" }, { status: 400 });
      }
    } else if (engagementType === "Rebadge" || engagementType === "Colocation") {
      if (!hgvStartDate) return NextResponse.json({ error: `HGV Start Date is required for ${engagementType}` }, { status: 400 });
      if (!hgvDepartment?.trim()) return NextResponse.json({ error: `HGV Department is required for ${engagementType}` }, { status: 400 });
      if (!shiftTypeId) return NextResponse.json({ error: `Shift Type is required for ${engagementType}` }, { status: 400 });
    } else if (engagementType === "Non-GCC") {
      if (!employeeId?.trim()) return NextResponse.json({ error: "Employee ID is required for Non-GCC" }, { status: 400 });
      if (!employmentCategory) return NextResponse.json({ error: "Employment Category is required for Non-GCC" }, { status: 400 });
      if (!project?.trim()) return NextResponse.json({ error: "Project is required for Non-GCC" }, { status: 400 });
    }

    // Check Employee ID uniqueness if supplied
    if (employeeId?.trim()) {
      const existing = await prisma.employee.findUnique({
        where: { employeeId: employeeId.trim() },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Employee ID "${employeeId}" already exists` },
          { status: 409 }
        );
      }
    }

    // Create Employee record in transaction
    const newEmployee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          employeeId: employeeId?.trim() || null,
          employeeName: employeeName.trim(),
          oraclePersonNumber: oraclePersonNumber?.trim() || null,
          assignmentStatus,
          gender,
          engagementType,
          employmentCategory: employmentCategory || null,
          gccPresence: Boolean(gccPresence),
          hgvRole: hgvRole.trim(),
          hgvDepartment: hgvDepartment?.trim() || null,
          domainLeadId,
          reportingManager: reportingManager?.trim() || null,
          businessUnit: businessUnit?.trim() || null,
          practice: practice?.trim() || null,
          subPractice: subPractice?.trim() || null,
          gradeLevel: gradeLevel?.trim() || null,
          project: project?.trim() || null,
          sourceId,
          subSource: subSource?.trim() || null,
          dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
          hgvStartDate: hgvStartDate ? new Date(hgvStartDate) : null,
          hgvEndDate: hgvEndDate ? new Date(hgvEndDate) : null,
          shiftTypeId: shiftTypeId || null,
        },
      });

      // Compensation
      if (engagementType === "GCC" || engagementType === "NOC") {
        await tx.employeeCompensation.create({
          data: {
            employeeId: emp.id,
            effectiveFrom: hgvStartDate ? new Date(hgvStartDate) : new Date(),
            fixedCtcInrAnnual: parseFloat(fixedCtcInrAnnual) || 0,
            variablePayMode: variablePayMode || "NONE",
            variablePayPercent: variablePayPercent ? parseFloat(variablePayPercent) : null,
            variablePayCustomInrMonthly: variablePayCustomInrMonthly ? parseFloat(variablePayCustomInrMonthly) : null,
            joiningBonusInr: joiningBonusInr ? parseFloat(joiningBonusInr) : 0,
          },
        });
      }

      // Contact
      await tx.employeeContact.create({
        data: {
          employeeId: emp.id,
          personalEmail: personalEmail || null,
          hgvEmail: hgvEmail || null,
          mobile: mobile || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          qualification: qualification || null,
        },
      });

      // Address
      await tx.employeeAddress.create({
        data: {
          employeeId: emp.id,
          baseLocation: baseLocation || "Hyderabad",
          currentAddress: currentAddress || null,
        },
      });

      return emp;
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "CREATE",
      entityType: "EMPLOYEE",
      entityId: newEmployee.id,
      description: `Created workforce record for ${newEmployee.employeeName} (${newEmployee.engagementType})`,
      afterJson: newEmployee,
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
