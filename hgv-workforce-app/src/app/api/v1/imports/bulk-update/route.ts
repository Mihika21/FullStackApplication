import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import Papa from "papaparse";

const VALID_ASSIGNMENT_STATUSES = [
  "Onboarding",
  "Active",
  "Probation",
  "Notice Period",
  "On Leave",
  "Resigned",
  "Terminated",
  "Inactive",
];

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditWorkforce) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to perform workforce bulk updates" },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // 1. STAGE: APPLY UPDATES
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { action, validRows, fileName } = body;

      if (action === "apply") {
        if (!validRows || !Array.isArray(validRows) || validRows.length === 0) {
          return NextResponse.json(
            { error: "No valid rows provided for update" },
            { status: 400 }
          );
        }

        // Fetch lookups
        const [domainLeads, shiftTypes] = await Promise.all([
          prisma.domainLead.findMany({ where: { active: true } }),
          prisma.shiftType.findMany({ where: { active: true } }),
        ]);

        const leadMap = new Map(domainLeads.map((dl) => [dl.name.toLowerCase().trim(), dl.id]));
        const shiftMap = new Map(shiftTypes.map((st) => [st.code.toUpperCase().trim(), st.id]));
        shiftTypes.forEach((st) => shiftMap.set(st.name.toLowerCase().trim(), st.id));

        let updatedCount = 0;

        for (const row of validRows) {
          const empId = row.employeeId;
          const employee = await prisma.employee.findUnique({
            where: { employeeId: empId },
          });

          if (!employee) continue;

          const dataToUpdate: any = {};

          if (row.assignmentStatus) {
            dataToUpdate.assignmentStatus = row.assignmentStatus;
          }
          if (row.hgvRole) {
            dataToUpdate.hgvRole = row.hgvRole;
          }
          if (row.hgvDepartment) {
            dataToUpdate.hgvDepartment = row.hgvDepartment;
          }
          if (row.domainLead && leadMap.has(row.domainLead.toLowerCase().trim())) {
            dataToUpdate.domainLeadId = leadMap.get(row.domainLead.toLowerCase().trim())!;
          }
          if (row.reportingManager) {
            dataToUpdate.reportingManager = row.reportingManager;
          }
          if (row.businessUnit) {
            dataToUpdate.businessUnit = row.businessUnit;
          }
          if (row.practice) {
            dataToUpdate.practice = row.practice;
          }
          if (row.subPractice) {
            dataToUpdate.subPractice = row.subPractice;
          }
          if (row.gradeLevel) {
            dataToUpdate.gradeLevel = row.gradeLevel;
          }
          if (row.project) {
            dataToUpdate.project = row.project;
          }
          if (row.shiftType && shiftMap.has(row.shiftType.toUpperCase().trim())) {
            dataToUpdate.shiftTypeId = shiftMap.get(row.shiftType.toUpperCase().trim())!;
          }

          // Update Employee
          if (Object.keys(dataToUpdate).length > 0) {
            await prisma.employee.update({
              where: { id: employee.id },
              data: dataToUpdate,
            });
          }

          // Update Address if baseLocation provided
          if (row.baseLocation) {
            await prisma.employeeAddress.upsert({
              where: { employeeId: employee.id },
              create: {
                employeeId: employee.id,
                baseLocation: row.baseLocation,
                currentAddress: `${row.baseLocation}, India`,
                permanentAddress: `${row.baseLocation}, India`,
              },
              update: {
                baseLocation: row.baseLocation,
              },
            });
          }

          // Update Compensation if CTC / Variable Pay provided
          if (
            row.fixedCtc !== undefined ||
            row.variablePayMode ||
            row.variablePayPercent !== undefined ||
            row.customVariablePay !== undefined ||
            row.joiningBonus !== undefined
          ) {
            const latestComp = await prisma.employeeCompensation.findFirst({
              where: { employeeId: employee.id },
              orderBy: { effectiveFrom: "desc" },
            });

            const newFixedCtc =
              row.fixedCtc !== undefined && row.fixedCtc !== ""
                ? parseFloat(row.fixedCtc)
                : latestComp?.fixedCtcInrAnnual || 0;

            const newMode = row.variablePayMode || latestComp?.variablePayMode || "NONE";
            const newVarPct =
              row.variablePayPercent !== undefined && row.variablePayPercent !== ""
                ? parseFloat(row.variablePayPercent)
                : latestComp?.variablePayPercent || null;
            const newVarCustom =
              row.customVariablePay !== undefined && row.customVariablePay !== ""
                ? parseFloat(row.customVariablePay)
                : latestComp?.variablePayCustomInrMonthly || null;
            const newJoiningBonus =
              row.joiningBonus !== undefined && row.joiningBonus !== ""
                ? parseFloat(row.joiningBonus)
                : latestComp?.joiningBonusInr || 0;

            await prisma.employeeCompensation.create({
              data: {
                employeeId: employee.id,
                effectiveFrom: new Date(),
                fixedCtcInrAnnual: newFixedCtc,
                variablePayMode: newMode,
                variablePayPercent: newVarPct,
                variablePayCustomInrMonthly: newVarCustom,
                joiningBonusInr: newJoiningBonus,
              },
            });
          }

          updatedCount++;
        }

        // Record import batch
        const batch = await prisma.importBatch.create({
          data: {
            uploadType: "BULK_UPDATE",
            fileName: fileName || "bulk_update.csv",
            status: "COMPLETED",
            totalRows: validRows.length,
            validRows: updatedCount,
            failedRows: 0,
            uploadedBy: user.email,
          },
        });

        // Audit log
        await logAuditEvent({
          actorEmail: user.email,
          actorRole: user.roleCode,
          action: "UPDATE",
          entityType: "BATCH",
          entityId: batch.id,
          description: `Bulk updated ${updatedCount} workforce master records from staged batch`,
        });

        return NextResponse.json({
          success: true,
          updatedCount,
          batchId: batch.id,
        });
      }
    }

    // 2. STAGE: VALIDATE UPLOADED CSV
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No CSV file uploaded." }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    const rows = parsed.data as Record<string, string>[];
    if (rows.length === 0) {
      return NextResponse.json({ error: "Uploaded CSV file is empty." }, { status: 400 });
    }

    // Reference lookups for validation
    const [existingEmployees, domainLeads, shiftTypes] = await Promise.all([
      prisma.employee.findMany({
        where: { employeeId: { not: null } },
        select: { employeeId: true, employeeName: true, assignmentStatus: true },
      }),
      prisma.domainLead.findMany({ where: { active: true }, select: { name: true } }),
      prisma.shiftType.findMany({ where: { active: true }, select: { code: true, name: true } }),
    ]);

    const employeeMap = new Map(
      existingEmployees.map((e) => [e.employeeId!.toUpperCase().trim(), e])
    );
    const leadNames = new Set(domainLeads.map((dl) => dl.name.toLowerCase().trim()));
    const shiftCodes = new Set(shiftTypes.map((st) => st.code.toUpperCase().trim()));
    shiftTypes.forEach((st) => shiftCodes.add(st.name.toUpperCase().trim()));

    const validatedRows: any[] = [];
    const failedRows: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const rowNum = i + 2; // header is row 1
      const errors: string[] = [];

      // Primary Key identification
      const empId = (rawRow["Employee ID"] || rawRow["employeeId"] || "").trim();

      if (!empId) {
        errors.push("Missing required 'Employee ID'");
      } else if (!employeeMap.has(empId.toUpperCase())) {
        errors.push(`Employee ID '${empId}' not found in workforce database`);
      }

      // Assignment Status validation
      const status = (rawRow["Assignment Status"] || rawRow["assignmentStatus"] || "").trim();
      if (status) {
        const matchedStatus = VALID_ASSIGNMENT_STATUSES.find(
          (s) => s.toLowerCase() === status.toLowerCase()
        );
        if (!matchedStatus) {
          errors.push(
            `Invalid Assignment Status '${status}'. Must be one of: ${VALID_ASSIGNMENT_STATUSES.join(", ")}`
          );
        }
      }

      // Domain Lead validation
      const lead = (rawRow["Domain Lead"] || rawRow["domainLead"] || "").trim();
      if (lead && !leadNames.has(lead.toLowerCase())) {
        errors.push(`Domain Lead '${lead}' is not an active Domain Lead`);
      }

      // Shift Type validation
      const shift = (rawRow["Shift Type"] || rawRow["shiftType"] || "").trim();
      if (shift && !shiftCodes.has(shift.toUpperCase())) {
        errors.push(`Shift Type '${shift}' does not match any configured active shift types`);
      }

      // Fixed CTC validation
      const fixedCtc = (rawRow["Fixed CTC"] || rawRow["fixedCtc"] || "").trim();
      if (fixedCtc && (isNaN(Number(fixedCtc)) || Number(fixedCtc) < 0)) {
        errors.push("Fixed CTC must be a non-negative number");
      }

      // Variable Pay % validation
      const varPct = (rawRow["Variable Pay %"] || rawRow["variablePayPercent"] || "").trim();
      if (varPct && (isNaN(Number(varPct)) || Number(varPct) < 0 || Number(varPct) > 100)) {
        errors.push("Variable Pay % must be a number between 0 and 100");
      }

      const existingRecord = empId ? employeeMap.get(empId.toUpperCase()) : null;
      const targetName =
        (rawRow["Employee Name"] || rawRow["employeeName"] || "").trim() ||
        existingRecord?.employeeName ||
        "Unknown";

      const processedRow = {
        rowNumber: rowNum,
        employeeId: empId,
        employeeName: targetName,
        assignmentStatus: status || existingRecord?.assignmentStatus,
        hgvRole: (rawRow["HGV Role"] || rawRow["hgvRole"] || "").trim(),
        hgvDepartment: (rawRow["HGV Department"] || rawRow["hgvDepartment"] || "").trim(),
        domainLead: lead,
        reportingManager: (rawRow["Reporting Manager"] || rawRow["reportingManager"] || "").trim(),
        businessUnit: (rawRow["Business Unit"] || rawRow["businessUnit"] || "").trim(),
        practice: (rawRow["Practice"] || rawRow["practice"] || "").trim(),
        subPractice: (rawRow["Sub Practice"] || rawRow["subPractice"] || "").trim(),
        gradeLevel: (rawRow["Grade Level"] || rawRow["gradeLevel"] || "").trim(),
        project: (rawRow["Project"] || rawRow["project"] || "").trim(),
        shiftType: shift,
        baseLocation: (rawRow["Base Location"] || rawRow["baseLocation"] || "").trim(),
        fixedCtc: fixedCtc,
        variablePayMode: (rawRow["Variable Pay Mode"] || rawRow["variablePayMode"] || "").trim(),
        variablePayPercent: varPct,
        customVariablePay: (rawRow["Custom Variable Pay"] || rawRow["customVariablePay"] || "").trim(),
        joiningBonus: (rawRow["Joining Bonus"] || rawRow["joiningBonus"] || "").trim(),
        status: errors.length === 0 ? "VALID" : "INVALID",
        errors,
        raw: rawRow,
      };

      if (errors.length === 0) {
        validatedRows.push(processedRow);
      } else {
        failedRows.push({
          ...rawRow,
          "Validation Error Reason": errors.join("; "),
        });
      }
    }

    // Build Failed Rows CSV string
    const failedRowsCsv = failedRows.length > 0 ? Papa.unparse(failedRows) : null;

    return NextResponse.json({
      fileName: file.name,
      totalRows: rows.length,
      validRowsCount: validatedRows.length,
      invalidRowsCount: failedRows.length,
      validatedRows,
      failedRows,
      failedRowsCsv,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
