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

    const batch = await prisma.importBatch.create({
      data: {
        uploadType: "SHIFT_ALLOWANCE",
        fileName: file.name,
        status: "VALIDATING",
        totalRows: rows.length,
        uploadedBy: user.email,
      },
    });

    const validRowsToUpsert: any[] = [];
    const rowErrors: any[] = [];
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

    // Preload employees by employeeId
    const employees = await prisma.employee.findMany({
      where: { employeeId: { not: null } },
      select: { id: true, employeeId: true, employeeName: true },
    });
    const employeeMap = new Map(employees.map((e) => [e.employeeId!.toLowerCase(), e]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      const empId = row["Employee ID"] || row["employeeId"] || row["EmployeeID"] || "";
      const billingMonth = row["Billing Month"] || row["billingMonth"] || row["Month"] || "";
      const amountStr = row["Validated Shift Allowance Amount"] || row["validatedAmountUsd"] || row["Amount"] || "";

      const errors: { col: string; code: string; msg: string }[] = [];

      if (!empId.trim()) {
        errors.push({ col: "Employee ID", code: "REQUIRED_FIELD", msg: "Employee ID is required" });
      }

      const emp = employeeMap.get(empId.trim().toLowerCase());
      if (empId.trim() && !emp) {
        errors.push({
          col: "Employee ID",
          code: "EMPLOYEE_NOT_FOUND",
          msg: `Employee ID "${empId}" does not exist in workforce master data`,
        });
      }

      if (!billingMonth.trim()) {
        errors.push({ col: "Billing Month", code: "REQUIRED_FIELD", msg: "Billing Month is required" });
      } else if (!monthRegex.test(billingMonth.trim())) {
        errors.push({
          col: "Billing Month",
          code: "INVALID_FORMAT",
          msg: `Invalid Billing Month format "${billingMonth}". Expected YYYY-MM (e.g. 2026-08)`,
        });
      }

      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount < 0) {
        errors.push({
          col: "Validated Shift Allowance Amount",
          code: "INVALID_NUMBER",
          msg: "Amount must be a non-negative number",
        });
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
      } else if (emp) {
        validRowsToUpsert.push({
          employeeId: emp.id,
          billingMonth: billingMonth.trim(),
          validatedAmountUsd: amount,
          validationStatus: "VALIDATED",
          sourceBatchId: batch.id,
          validatedBy: user.email,
        });
      }
    }

    if (rowErrors.length > 0) {
      await prisma.importRowError.createMany({ data: rowErrors });
    }

    for (const item of validRowsToUpsert) {
      await prisma.shiftAllowanceOverride.upsert({
        where: {
          employeeId_billingMonth: {
            employeeId: item.employeeId,
            billingMonth: item.billingMonth,
          },
        },
        create: item,
        update: {
          validatedAmountUsd: item.validatedAmountUsd,
          validationStatus: "VALIDATED",
          sourceBatchId: item.sourceBatchId,
          validatedBy: item.validatedBy,
        },
      });
    }

    const failedRowCount = new Set(rowErrors.map((r) => r.rowNumber)).size;
    const validRowCount = validRowsToUpsert.length;
    const finalStatus =
      failedRowCount === 0
        ? "COMPLETED"
        : validRowCount === 0
        ? "FAILED"
        : "COMPLETED_WITH_ERRORS";

    await prisma.importBatch.update({
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
      description: `Uploaded PMO Shift Allowance file "${file.name}": ${validRowCount} overrides applied, ${failedRowCount} errors.`,
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
