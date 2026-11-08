import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import Papa from "papaparse";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canUploadCsv) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to upload CSV files" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    const rows = parsed.data as Record<string, string>[];
    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    // Load reference lookups to enforce controlled value rules
    const [domainLeads, sources, shiftTypes] = await Promise.all([
      prisma.domainLead.findMany({ where: { active: true } }),
      prisma.source.findMany({ where: { active: true } }),
      prisma.shiftType.findMany({ where: { active: true } }),
    ]);

    const domainLeadMap = new Map(domainLeads.map((d) => [d.name.toLowerCase(), d.id]));
    const sourceMap = new Map(sources.map((s) => [s.name.toLowerCase(), s.id]));
    const shiftTypeMap = new Map(shiftTypes.map((st) => [st.code.toLowerCase(), st.id]));
    shiftTypes.forEach((st) => shiftTypeMap.set(st.name.toLowerCase(), st.id));

    // Create batch record
    const batch = await prisma.importBatch.create({
      data: {
        uploadType: "MASTER_DATA",
        fileName: file.name,
        status: "VALIDATING",
        totalRows: rows.length,
        uploadedBy: user.email,
      },
    });

    const validRowsToInsert: any[] = [];
    const rowErrors: any[] = [];

    // Existing employee IDs to detect duplicates within database and CSV
    const existingEmployees = await prisma.employee.findMany({
      where: { employeeId: { not: null } },
      select: { employeeId: true },
    });
    const existingEmpIdSet = new Set(existingEmployees.map((e) => e.employeeId!.toLowerCase()));
    const seenCsvEmpIds = new Set<string>();

    // Row-by-row validation
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // accounting for 1-based index and header line

      const empName = row["Employee Name"] || row["employeeName"] || "";
      const empId = row["Employee ID"] || row["employeeId"] || "";
      const oracleNum = row["Oracle Person Number"] || row["oraclePersonNumber"] || "";
      const status = row["Assignment Status"] || row["assignmentStatus"] || "Active";
      const gender = row["Gender"] || row["gender"] || "";
      const engagement = row["Engagement Type"] || row["engagementType"] || "";
      const category = row["Employment Category"] || row["employmentCategory"] || "";
      const gccPresenceStr = row["GCC Presence"] || row["gccPresence"] || "Yes";
      const gccPresence = gccPresenceStr.toLowerCase() === "yes" || gccPresenceStr.toLowerCase() === "true";
      const hgvRole = row["HGV Role"] || row["hgvRole"] || "";
      const hgvDept = row["HGV Department"] || row["hgvDepartment"] || "";
      const leadName = row["Domain Lead"] || row["domainLead"] || "";
      const sourceName = row["Source"] || row["source"] || "";
      const shiftName = row["Shift Type"] || row["shiftType"] || "";
      const project = row["Project"] || row["project"] || "";
      const hgvStartDate = row["HGV Start Date"] || row["hgvStartDate"] || "";
      const fixedCtcStr = row["Fixed CTC"] || row["fixedCtc"] || row["Annual Fixed CTC"] || "";
      const variableMode = (row["Variable Pay Mode"] || row["variablePayMode"] || "NONE").toUpperCase();
      const variablePctStr = row["Variable Pay %"] || row["variablePayPercent"] || "";
      const variableCustomStr = row["Custom Variable Pay"] || row["variablePayCustomInrMonthly"] || "";
      const joiningBonusStr = row["Joining Bonus"] || row["joiningBonusInr"] || "0";
      const baseLocation = row["Base Location"] || row["baseLocation"] || "Hyderabad";

      const errors: { col: string; code: string; msg: string }[] = [];

      // 1. Mandatory common fields
      if (!empName.trim()) errors.push({ col: "Employee Name", code: "REQUIRED_FIELD", msg: "Employee Name is required" });
      if (!status.trim()) errors.push({ col: "Assignment Status", code: "REQUIRED_FIELD", msg: "Assignment Status is required" });
      if (!gender.trim()) errors.push({ col: "Gender", code: "REQUIRED_FIELD", msg: "Gender is required" });
      if (!hgvRole.trim()) errors.push({ col: "HGV Role", code: "REQUIRED_FIELD", msg: "HGV Role is required" });
      if (!engagement.trim()) errors.push({ col: "Engagement Type", code: "REQUIRED_FIELD", msg: "Engagement Type is required" });
      if (!leadName.trim()) errors.push({ col: "Domain Lead", code: "REQUIRED_FIELD", msg: "Domain Lead is required" });
      if (!sourceName.trim()) errors.push({ col: "Source", code: "REQUIRED_FIELD", msg: "Source is required" });

      // 2. Controlled reference check: Cannot silently create reference values via CSV
      const domainLeadId = domainLeadMap.get(leadName.trim().toLowerCase());
      if (leadName.trim() && !domainLeadId) {
        errors.push({
          col: "Domain Lead",
          code: "UNKNOWN_REFERENCE_VALUE",
          msg: `Unknown Domain Lead "${leadName}". Must be added through authorized Reference Data flow.`,
        });
      }

      const sourceId = sourceMap.get(sourceName.trim().toLowerCase());
      if (sourceName.trim() && !sourceId) {
        errors.push({
          col: "Source",
          code: "UNKNOWN_REFERENCE_VALUE",
          msg: `Unknown Source "${sourceName}". Must be added through authorized Reference Data flow.`,
        });
      }

      let shiftTypeId: string | null = null;
      if (shiftName.trim()) {
        shiftTypeId = shiftTypeMap.get(shiftName.trim().toLowerCase()) || null;
        if (!shiftTypeId) {
          errors.push({
            col: "Shift Type",
            code: "UNKNOWN_REFERENCE_VALUE",
            msg: `Unknown Shift Type "${shiftName}".`,
          });
        }
      }

      // 3. Dynamic mandatory rules
      if (engagement === "GCC" || engagement === "NOC") {
        if (!empId.trim()) errors.push({ col: "Employee ID", code: "REQUIRED_FIELD", msg: "Employee ID is mandatory for GCC/NOC" });
        if (!hgvStartDate.trim()) errors.push({ col: "HGV Start Date", code: "REQUIRED_FIELD", msg: "HGV Start Date is mandatory for GCC/NOC" });
        if (!hgvDept.trim()) errors.push({ col: "HGV Department", code: "REQUIRED_FIELD", msg: "HGV Department is mandatory for GCC/NOC" });
        if (!category.trim()) errors.push({ col: "Employment Category", code: "REQUIRED_FIELD", msg: "Employment Category is mandatory for GCC/NOC" });
        if (!shiftTypeId) errors.push({ col: "Shift Type", code: "REQUIRED_FIELD", msg: "Shift Type is mandatory for GCC/NOC" });
        if (!fixedCtcStr || isNaN(parseFloat(fixedCtcStr)) || parseFloat(fixedCtcStr) < 0) {
          errors.push({ col: "Fixed CTC", code: "INVALID_NUMBER", msg: "Valid non-negative Fixed CTC is required for GCC/NOC" });
        }
      } else if (engagement === "Rebadge" || engagement === "Colocation") {
        if (!hgvStartDate.trim()) errors.push({ col: "HGV Start Date", code: "REQUIRED_FIELD", msg: `HGV Start Date is required for ${engagement}` });
        if (!hgvDept.trim()) errors.push({ col: "HGV Department", code: "REQUIRED_FIELD", msg: `HGV Department is required for ${engagement}` });
        if (!shiftTypeId) errors.push({ col: "Shift Type", code: "REQUIRED_FIELD", msg: `Shift Type is required for ${engagement}` });
      } else if (engagement === "Non-GCC") {
        if (!empId.trim()) errors.push({ col: "Employee ID", code: "REQUIRED_FIELD", msg: "Employee ID is mandatory for Non-GCC" });
        if (!category.trim()) errors.push({ col: "Employment Category", code: "REQUIRED_FIELD", msg: "Employment Category is mandatory for Non-GCC" });
        if (!project.trim()) errors.push({ col: "Project", code: "REQUIRED_FIELD", msg: "Project is mandatory for Non-GCC" });
      }

      // 4. Employee ID duplicates
      if (empId.trim()) {
        const lowerId = empId.trim().toLowerCase();
        if (seenCsvEmpIds.has(lowerId)) {
          errors.push({ col: "Employee ID", code: "DUPLICATE_ID", msg: `Duplicate Employee ID "${empId}" in CSV` });
        } else if (existingEmpIdSet.has(lowerId)) {
          errors.push({ col: "Employee ID", code: "DUPLICATE_ID", msg: `Employee ID "${empId}" already exists in system` });
        } else {
          seenCsvEmpIds.add(lowerId);
        }
      }

      if (errors.length > 0) {
        for (const err of errors) {
          rowErrors.push({
            importBatchId: batch.id,
            rowNumber,
            columnName: err.col,
            errorCode: err.code,
            errorMessage: err.msg,
            rawValue: row[err.col] || null,
          });
        }
      } else {
        validRowsToInsert.push({
          employee: {
            employeeId: empId.trim() || null,
            employeeName: empName.trim(),
            oraclePersonNumber: oracleNum.trim() || null,
            assignmentStatus: status.trim(),
            gender: gender.trim(),
            engagementType: engagement.trim(),
            employmentCategory: category.trim() || null,
            gccPresence,
            hgvRole: hgvRole.trim(),
            hgvDepartment: hgvDept.trim() || null,
            domainLeadId: domainLeadId!,
            sourceId: sourceId!,
            shiftTypeId,
            project: project.trim() || null,
            hgvStartDate: hgvStartDate.trim() ? new Date(hgvStartDate.trim()) : null,
          },
          compensation:
            engagement === "GCC" || engagement === "NOC"
              ? {
                  fixedCtcInrAnnual: parseFloat(fixedCtcStr) || 0,
                  variablePayMode: ["NONE", "FLAT_PERCENT", "CUSTOM_AMOUNT"].includes(variableMode) ? variableMode : "NONE",
                  variablePayPercent: parseFloat(variablePctStr) || null,
                  variablePayCustomInrMonthly: parseFloat(variableCustomStr) || null,
                  joiningBonusInr: parseFloat(joiningBonusStr) || 0,
                }
              : null,
          baseLocation,
        });
      }
    }

    // Persist valid rows and errors
    if (rowErrors.length > 0) {
      await prisma.importRowError.createMany({
        data: rowErrors,
      });
    }

    for (const item of validRowsToInsert) {
      const emp = await prisma.employee.create({
        data: item.employee,
      });

      if (item.compensation) {
        await prisma.employeeCompensation.create({
          data: {
            employeeId: emp.id,
            effectiveFrom: item.employee.hgvStartDate || new Date(),
            ...item.compensation,
          },
        });
      }

      await prisma.employeeAddress.create({
        data: {
          employeeId: emp.id,
          baseLocation: item.baseLocation,
        },
      });
    }

    const failedRowCount = new Set(rowErrors.map((r) => r.rowNumber)).size;
    const validRowCount = validRowsToInsert.length;
    const finalStatus =
      failedRowCount === 0
        ? "COMPLETED"
        : validRowCount === 0
        ? "FAILED"
        : "COMPLETED_WITH_ERRORS";

    const updatedBatch = await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: finalStatus,
        validRows: validRowCount,
        failedRows: failedRowCount,
        completedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPLOAD",
      entityType: "UPLOAD",
      entityId: batch.id,
      description: `Bulk Master Data upload "${file.name}": ${validRowCount} valid rows, ${failedRowCount} failed rows (Status: ${finalStatus})`,
    });

    return NextResponse.json({
      batchId: batch.id,
      status: finalStatus,
      totalRows: rows.length,
      validRows: validRowCount,
      failedRows: failedRowCount,
      errors: rowErrors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
