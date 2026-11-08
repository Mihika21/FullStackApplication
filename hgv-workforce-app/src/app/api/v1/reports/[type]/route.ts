import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateEmployeeBilling } from "@/lib/billingEngine";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;
    const { searchParams } = new URL(request.url);
    const billingMonth = searchParams.get("billingMonth") || new Date().toISOString().slice(0, 7);
    const engagementType = searchParams.get("engagementType") || "";
    const domainLeadId = searchParams.get("domainLeadId") || "";
    const assignmentStatus = searchParams.get("assignmentStatus") || "";
    const format = searchParams.get("format") || "json"; // json, excel, pdf

    // Build filter
    const where: any = {};
    if (engagementType) where.engagementType = engagementType;
    if (domainLeadId) where.domainLeadId = domainLeadId;
    if (assignmentStatus) where.assignmentStatus = assignmentStatus;

    // Fetch matching employees
    const employees = await prisma.employee.findMany({
      where,
      include: {
        domainLead: true,
        source: true,
        shiftType: true,
        compensations: {
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
        address: true,
      },
      orderBy: { employeeName: "asc" },
    });

    const billingConfig = await prisma.billingConfiguration.findFirst({
      where: { isCurrent: true },
      orderBy: { versionNumber: "desc" },
    });

    if (!billingConfig) {
      return NextResponse.json({ error: "No active billing configuration found" }, { status: 500 });
    }

    // 1. BILLING SUMMARY REPORT
    if (type === "billing") {
      const overrides = await prisma.shiftAllowanceOverride.findMany({
        where: { billingMonth, validationStatus: "VALIDATED" },
      });
      const overrideMap = new Map(overrides.map((o) => [o.employeeId, o]));

      const calculatedRows = employees.map((emp) => {
        const pmoOverride = overrideMap.get(emp.id) || null;
        const res = calculateEmployeeBilling({
          employee: emp,
          compensation: emp.compensations[0] || null,
          billingConfig,
          billingMonth,
          pmoOverride,
        });

        return {
          employeeId: emp.employeeId || "—",
          employeeName: emp.employeeName,
          engagementType: emp.engagementType,
          hgvRole: emp.hgvRole,
          hgvDepartment: emp.hgvDepartment || "—",
          domainLead: emp.domainLead?.name || "—",
          shiftType: emp.shiftType?.name || "—",
          fixedCtcInr: res.fixedCtcInrAnnual,
          monthlySalaryInr: res.monthlyFixedSalaryInr,
          variablePayMode: res.variablePayMode,
          variablePayUsd: res.variablePayAmountUsd,
          salaryCostUsd: res.salaryCostUsd,
          operationalMarginUsd: res.operationalMarginAmountUsd,
          facilityCostUsd: res.facilityCostUsd,
          userBundleCostUsd: res.userBundleCostUsd,
          shiftAllowanceUsd: res.shiftAllowanceUsd,
          shiftAllowanceSource: res.shiftAllowanceSource,
          joiningBonusUsd: res.joiningBonusComponentUsd,
          monthlyFullyLoadedCostUsd: res.fullyLoadedCostUsd,
          annualFullyLoadedCostUsd: res.annualFullyLoadedCostUsd,
          billingStatus: res.billingStatus,
        };
      });

      // Aggregates by Domain Lead & Engagement
      const domainLeadTotals: Record<string, { count: number; totalCost: number }> = {};
      const engagementTotals: Record<string, { count: number; totalCost: number }> = {};
      let totalBilledUsd = 0;

      for (const r of calculatedRows) {
        if (r.billingStatus === "CALCULATED") {
          totalBilledUsd += r.monthlyFullyLoadedCostUsd;

          domainLeadTotals[r.domainLead] = domainLeadTotals[r.domainLead] || { count: 0, totalCost: 0 };
          domainLeadTotals[r.domainLead].count += 1;
          domainLeadTotals[r.domainLead].totalCost += r.monthlyFullyLoadedCostUsd;

          engagementTotals[r.engagementType] = engagementTotals[r.engagementType] || { count: 0, totalCost: 0 };
          engagementTotals[r.engagementType].count += 1;
          engagementTotals[r.engagementType].totalCost += r.monthlyFullyLoadedCostUsd;
        }
      }

      if (format === "excel") {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(`Billing Summary - ${billingMonth}`);

        // Title and metadata
        sheet.addRow([`HGV GCC Workforce - Billing Summary Report`]);
        sheet.addRow([`Billing Month: ${billingMonth} | Generated: ${new Date().toISOString()}`]);
        sheet.addRow([`FX Rate: ${billingConfig.fxRateInrUsd} INR/USD | Ops Margin: ${billingConfig.operationalMarginPercent}% | Total Monthly Billed: $${totalBilledUsd.toFixed(2)} USD`]);
        sheet.addRow([]);

        // Table headers
        const headerRow = sheet.addRow([
          "Employee ID",
          "Employee Name",
          "Engagement",
          "Role",
          "Department",
          "Domain Lead",
          "Shift Type",
          "Annual CTC (INR)",
          "Salary Cost (USD)",
          "Ops Margin (USD)",
          "Facility Cost (USD)",
          "Shift Allowance (USD)",
          "Joining Bonus (USD)",
          "Monthly Cost (USD)",
          "Annual Cost (USD)",
          "Status",
        ]);

        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF202B46" }, // HGV Navy
        };

        for (const row of calculatedRows) {
          sheet.addRow([
            row.employeeId,
            row.employeeName,
            row.engagementType,
            row.hgvRole,
            row.hgvDepartment,
            row.domainLead,
            row.shiftType,
            row.fixedCtcInr,
            row.salaryCostUsd,
            row.operationalMarginUsd,
            row.facilityCostUsd,
            row.shiftAllowanceUsd,
            row.joiningBonusUsd,
            row.monthlyFullyLoadedCostUsd,
            row.annualFullyLoadedCostUsd,
            row.billingStatus,
          ]);
        }

        sheet.columns.forEach((col) => {
          col.width = 18;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="HGV_Billing_Summary_${billingMonth}.xlsx"`,
          },
        });
      }

      if (format === "pdf") {
        const doc = new jsPDF("landscape");
        doc.setFontSize(16);
        doc.setTextColor(32, 43, 70); // HGV Navy
        doc.text(`HGV GCC Workforce - Billing Summary Report (${billingMonth})`, 14, 15);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total Monthly Calculated Billing: $${totalBilledUsd.toFixed(2)} USD | FX: ${billingConfig.fxRateInrUsd}`, 14, 22);

        autoTable(doc, {
          startY: 28,
          head: [
            ["ID", "Name", "Engagement", "Role", "Lead", "Salary ($)", "Margin ($)", "Facility ($)", "Shift ($)", "Monthly ($)"]
          ],
          body: calculatedRows.map((r) => [
            r.employeeId,
            r.employeeName,
            r.engagementType,
            r.hgvRole,
            r.domainLead,
            `$${r.salaryCostUsd.toFixed(2)}`,
            `$${r.operationalMarginUsd.toFixed(2)}`,
            `$${r.facilityCostUsd.toFixed(2)}`,
            `$${r.shiftAllowanceUsd.toFixed(2)}`,
            `$${r.monthlyFullyLoadedCostUsd.toFixed(2)}`,
          ]),
          headStyles: { fillColor: [32, 43, 70] },
          styles: { fontSize: 8 },
        });

        const pdfBuffer = doc.output("arraybuffer");
        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="HGV_Billing_Summary_${billingMonth}.pdf"`,
          },
        });
      }

      return NextResponse.json({
        billingMonth,
        totalEmployees: employees.length,
        totalBilledUsd: Number(totalBilledUsd.toFixed(2)),
        domainLeadTotals,
        engagementTotals,
        data: calculatedRows,
      });
    }

    // 2. MASTER DATA EXPORT REPORT
    if (type === "master-data") {
      const exportRows = employees.map((emp) => ({
        employeeId: emp.employeeId || "—",
        employeeName: emp.employeeName,
        oraclePersonNumber: emp.oraclePersonNumber || "—",
        assignmentStatus: emp.assignmentStatus,
        gender: emp.gender,
        engagementType: emp.engagementType,
        employmentCategory: emp.employmentCategory || "—",
        gccPresence: emp.gccPresence ? "Yes" : "No",
        hgvRole: emp.hgvRole,
        hgvDepartment: emp.hgvDepartment || "—",
        domainLead: emp.domainLead?.name || "—",
        project: emp.project || "—",
        source: emp.source?.name || "—",
        shiftType: emp.shiftType?.name || "—",
        hgvStartDate: emp.hgvStartDate ? emp.hgvStartDate.toISOString().slice(0, 10) : "—",
        baseLocation: emp.address?.baseLocation || "—",
        fixedCtcInr: emp.compensations[0]?.fixedCtcInrAnnual || 0,
      }));

      if (format === "excel") {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Master Data");

        sheet.addRow(["HGV GCC Workforce - Master Data Export"]);
        sheet.addRow([`Generated: ${new Date().toISOString()} | Total Records: ${employees.length}`]);
        sheet.addRow([]);

        const headerRow = sheet.addRow([
          "Employee ID",
          "Employee Name",
          "Oracle Person #",
          "Status",
          "Gender",
          "Engagement Type",
          "Category",
          "GCC Presence",
          "Role",
          "Department",
          "Domain Lead",
          "Project",
          "Source",
          "Shift Type",
          "Start Date",
          "Base Location",
          "Fixed CTC (INR)",
        ]);

        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF202B46" },
        };

        for (const row of exportRows) {
          sheet.addRow(Object.values(row));
        }

        sheet.columns.forEach((col) => {
          col.width = 18;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="HGV_Master_Data_${new Date().toISOString().slice(0, 10)}.xlsx"`,
          },
        });
      }

      return NextResponse.json({
        total: exportRows.length,
        data: exportRows,
      });
    }

    // 3. HEADCOUNT SUMMARY REPORT
    if (type === "headcount") {
      const byEngagement: Record<string, number> = {};
      const byDomainLead: Record<string, number> = {};
      const byGender: Record<string, number> = {};
      const byGccPresence: Record<string, number> = { Yes: 0, No: 0 };
      const byStatus: Record<string, number> = {};

      for (const emp of employees) {
        byEngagement[emp.engagementType] = (byEngagement[emp.engagementType] || 0) + 1;
        byDomainLead[emp.domainLead?.name || "Unassigned"] = (byDomainLead[emp.domainLead?.name || "Unassigned"] || 0) + 1;
        byGender[emp.gender] = (byGender[emp.gender] || 0) + 1;
        if (emp.gccPresence) byGccPresence["Yes"] += 1;
        else byGccPresence["No"] += 1;
        byStatus[emp.assignmentStatus] = (byStatus[emp.assignmentStatus] || 0) + 1;
      }

      if (format === "excel") {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Headcount Summary");

        sheet.addRow(["HGV GCC Workforce - Headcount Summary Report"]);
        sheet.addRow([`Generated: ${new Date().toISOString()} | Total Workforce: ${employees.length}`]);
        sheet.addRow([]);

        sheet.addRow(["Engagement Type", "Headcount"]);
        Object.entries(byEngagement).forEach(([k, v]) => sheet.addRow([k, v]));
        sheet.addRow([]);

        sheet.addRow(["Domain Lead", "Headcount"]);
        Object.entries(byDomainLead).forEach(([k, v]) => sheet.addRow([k, v]));
        sheet.addRow([]);

        sheet.addRow(["Gender", "Headcount"]);
        Object.entries(byGender).forEach(([k, v]) => sheet.addRow([k, v]));
        sheet.addRow([]);

        sheet.addRow(["GCC Presence", "Headcount"]);
        Object.entries(byGccPresence).forEach(([k, v]) => sheet.addRow([k, v]));

        sheet.columns.forEach((col) => {
          col.width = 24;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="HGV_Headcount_Summary_${new Date().toISOString().slice(0, 10)}.xlsx"`,
          },
        });
      }

      return NextResponse.json({
        totalHeadcount: employees.length,
        byEngagement,
        byDomainLead,
        byGender,
        byGccPresence,
        byStatus,
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
