import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        domainLead: true,
        source: true,
        shiftType: true,
        compensations: {
          orderBy: { effectiveFrom: "desc" },
        },
        contact: true,
        address: true,
        attritions: {
          orderBy: { attritionDate: "desc" },
        },
        documents: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Mask sensitive PII in standard views
    const maskedDocuments = employee.documents.map((doc) => {
      let maskedNum = doc.documentNumber;
      if (maskedNum.length > 4) {
        maskedNum = "•".repeat(maskedNum.length - 4) + maskedNum.slice(-4);
      }
      return {
        ...doc,
        documentNumber: maskedNum,
      };
    });

    return NextResponse.json({
      ...employee,
      documents: maskedDocuments,
    });
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
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit employees" },
        { status: 403 }
      );
    }

    const { id } = params;
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        compensations: { orderBy: { effectiveFrom: "desc" }, take: 1 },
      },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      employeeId,
      employeeName,
      oraclePersonNumber,
      assignmentStatus,
      gender,
      engagementType,
      employmentCategory,
      gccPresence,
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
      // Compensation
      fixedCtcInrAnnual,
      variablePayMode,
      variablePayPercent,
      variablePayCustomInrMonthly,
      joiningBonusInr,
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

    // Check Employee ID uniqueness if changed
    if (employeeId && employeeId.trim() !== existingEmployee.employeeId) {
      const conflict = await prisma.employee.findUnique({
        where: { employeeId: employeeId.trim() },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `Employee ID "${employeeId}" already exists` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id },
        data: {
          employeeId: employeeId?.trim() || null,
          employeeName: employeeName?.trim() || existingEmployee.employeeName,
          oraclePersonNumber: oraclePersonNumber?.trim() || null,
          assignmentStatus: assignmentStatus || existingEmployee.assignmentStatus,
          gender: gender || existingEmployee.gender,
          engagementType: engagementType || existingEmployee.engagementType,
          employmentCategory: employmentCategory || null,
          gccPresence: gccPresence !== undefined ? Boolean(gccPresence) : existingEmployee.gccPresence,
          hgvRole: hgvRole?.trim() || existingEmployee.hgvRole,
          hgvDepartment: hgvDepartment?.trim() || null,
          domainLeadId: domainLeadId || existingEmployee.domainLeadId,
          reportingManager: reportingManager?.trim() || null,
          businessUnit: businessUnit?.trim() || null,
          practice: practice?.trim() || null,
          subPractice: subPractice?.trim() || null,
          gradeLevel: gradeLevel?.trim() || null,
          project: project?.trim() || null,
          sourceId: sourceId || existingEmployee.sourceId,
          subSource: subSource?.trim() || null,
          dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
          hgvStartDate: hgvStartDate ? new Date(hgvStartDate) : null,
          hgvEndDate: hgvEndDate ? new Date(hgvEndDate) : null,
          shiftTypeId: shiftTypeId || null,
        },
      });

      // Compensation update if permitted and applicable
      if (permissions.canEditCompensation && (emp.engagementType === "GCC" || emp.engagementType === "NOC")) {
        const latestComp = existingEmployee.compensations[0];
        if (latestComp) {
          await tx.employeeCompensation.update({
            where: { id: latestComp.id },
            data: {
              fixedCtcInrAnnual: fixedCtcInrAnnual !== undefined ? parseFloat(fixedCtcInrAnnual) : latestComp.fixedCtcInrAnnual,
              variablePayMode: variablePayMode || latestComp.variablePayMode,
              variablePayPercent: variablePayPercent !== undefined ? (variablePayPercent ? parseFloat(variablePayPercent) : null) : latestComp.variablePayPercent,
              variablePayCustomInrMonthly: variablePayCustomInrMonthly !== undefined ? (variablePayCustomInrMonthly ? parseFloat(variablePayCustomInrMonthly) : null) : latestComp.variablePayCustomInrMonthly,
              joiningBonusInr: joiningBonusInr !== undefined ? parseFloat(joiningBonusInr) : latestComp.joiningBonusInr,
            },
          });
        } else {
          await tx.employeeCompensation.create({
            data: {
              employeeId: emp.id,
              fixedCtcInrAnnual: parseFloat(fixedCtcInrAnnual) || 0,
              variablePayMode: variablePayMode || "NONE",
              variablePayPercent: variablePayPercent ? parseFloat(variablePayPercent) : null,
              variablePayCustomInrMonthly: variablePayCustomInrMonthly ? parseFloat(variablePayCustomInrMonthly) : null,
              joiningBonusInr: joiningBonusInr ? parseFloat(joiningBonusInr) : 0,
            },
          });
        }
      }

      // Contact upsert
      await tx.employeeContact.upsert({
        where: { employeeId: id },
        create: {
          employeeId: id,
          personalEmail: personalEmail || null,
          hgvEmail: hgvEmail || null,
          mobile: mobile || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          qualification: qualification || null,
        },
        update: {
          personalEmail: personalEmail || null,
          hgvEmail: hgvEmail || null,
          mobile: mobile || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          qualification: qualification || null,
        },
      });

      // Address upsert
      await tx.employeeAddress.upsert({
        where: { employeeId: id },
        create: {
          employeeId: id,
          baseLocation: baseLocation || "Hyderabad",
          currentAddress: currentAddress || null,
        },
        update: {
          baseLocation: baseLocation || "Hyderabad",
          currentAddress: currentAddress || null,
        },
      });

      return emp;
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "EMPLOYEE",
      entityId: id,
      description: `Updated workforce record for ${updated.employeeName}`,
      beforeJson: existingEmployee,
      afterJson: updated,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
