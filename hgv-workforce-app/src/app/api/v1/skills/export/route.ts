import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const practice = searchParams.get("practice");
    const domainLeadId = searchParams.get("domainLeadId");

    // 1. Fetch taxonomy
    const categories = await prisma.skillCategory.findMany({
      where: { active: true },
      include: {
        skills: {
          where: { active: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const allSkills = categories.flatMap((c) => c.skills);

    // 2. Fetch employees with allocations & skills
    const where: any = { assignmentStatus: "Active" };
    if (practice) where.practice = practice;
    if (domainLeadId) where.domainLeadId = domainLeadId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        domainLead: true,
        skillRatings: true,
        projectAllocations: {
          where: { status: "CONFIRMED" },
        },
      },
      orderBy: { employeeName: "asc" },
    });

    // 3. Build Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "HGV GCC Workforce Platform";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Skill Matrix — Heatmap", {
      views: [{ state: "frozen", xSplit: 5, ySplit: 3 }],
    });

    // Title Row
    sheet.mergeCells(1, 1, 1, 5 + allSkills.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = "HGV GCC Skill Matrix — Validated Proficiency Ratings (0–5)";
    titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B192C" }, // HGV Navy
    };
    titleCell.alignment = { horizontal: "left", vertical: "middle" };
    sheet.getRow(1).height = 32;

    // Category Row (Row 2)
    let currentCol = 6;
    categories.forEach((cat) => {
      const skillCount = cat.skills?.length || 0;
      if (skillCount > 0) {
        sheet.mergeCells(2, currentCol, 2, currentCol + skillCount - 1);
        const catCell = sheet.getCell(2, currentCol);
        catCell.value = cat.name.toUpperCase();
        catCell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF1E3E62" } };
        catCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" },
        };
        catCell.alignment = { horizontal: "center", vertical: "middle" };
        currentCol += skillCount;
      }
    });
    sheet.getRow(2).height = 20;

    // Header Column Names (Row 3)
    const headerRow = sheet.getRow(3);
    headerRow.height = 26;
    const colHeaders = [
      "Employee ID",
      "Employee Name",
      "Role",
      "Practice",
      "Alloc %",
      ...allSkills.map((s) => s.name),
    ];

    colHeaders.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3E62" },
      };
      cell.alignment = {
        horizontal: idx < 4 ? "left" : "center",
        vertical: "middle",
      };
    });

    const levelFillColors: Record<number, string> = {
      0: "FFF8FAFC",
      1: "FFE0F2FE",
      2: "FFBFDBFE",
      3: "FF99F6E4",
      4: "FFC7D2FE",
      5: "FFA7F3D0",
    };

    // Employee Data Rows
    employees.forEach((emp, empIdx) => {
      const rowNum = 4 + empIdx;
      const row = sheet.getRow(rowNum);
      row.height = 20;

      const totalAlloc = emp.projectAllocations.reduce((sum, a) => sum + (a.allocationPct || 0), 0);

      row.getCell(1).value = emp.employeeId || "—";
      row.getCell(2).value = emp.employeeName;
      row.getCell(3).value = emp.hgvRole;
      row.getCell(4).value = emp.practice || "General";
      row.getCell(5).value = `${Math.round(totalAlloc * 100)}%`;

      for (let c = 1; c <= 5; c++) {
        const cell = row.getCell(c);
        cell.font = { name: "Arial", size: 9 };
        cell.alignment = { vertical: "middle", horizontal: c === 5 ? "center" : "left" };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      }

      const ratingMap = new Map(emp.skillRatings.map((sr) => [sr.skillId, sr.validatedRating ?? 0]));

      allSkills.forEach((s, sIdx) => {
        const cell = row.getCell(6 + sIdx);
        const rating = ratingMap.get(s.id) || 0;
        cell.value = rating;
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = {
          name: "Arial",
          size: 9,
          bold: rating >= 4,
          color: { argb: rating === 0 ? "FF94A3B8" : "FF0F172A" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: levelFillColors[rating] || "FFFFFFFF" },
        };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    // Summary Rows
    const summaryStart = 4 + employees.length + 1;
    const l3Row = sheet.getRow(summaryStart);
    l3Row.getCell(2).value = "Headcount ≥ L3 (Proficient)";
    l3Row.getCell(2).font = { name: "Arial", size: 9, bold: true };

    const l4Row = sheet.getRow(summaryStart + 1);
    l4Row.getCell(2).value = "Headcount ≥ L4 (Advanced)";
    l4Row.getCell(2).font = { name: "Arial", size: 9, bold: true };

    const riskRow = sheet.getRow(summaryStart + 2);
    riskRow.getCell(2).value = "Coverage Risk (SPOF / NO COVER)";
    riskRow.getCell(2).font = { name: "Arial", size: 9, bold: true, color: { argb: "FFB91C1C" } };

    allSkills.forEach((s, idx) => {
      let l3Count = 0;
      let l4Count = 0;

      employees.forEach((emp) => {
        const r = emp.skillRatings.find((sr) => sr.skillId === s.id)?.validatedRating || 0;
        if (r >= 3) l3Count++;
        if (r >= 4) l4Count++;
      });

      const cIdx = 6 + idx;
      l3Row.getCell(cIdx).value = l3Count;
      l3Row.getCell(cIdx).alignment = { horizontal: "center" };

      l4Row.getCell(cIdx).value = l4Count;
      l4Row.getCell(cIdx).alignment = { horizontal: "center" };

      let risk = "OK";
      if (l4Count === 0) risk = "NO COVER";
      else if (l4Count === 1) risk = "SPOF";

      const riskCell = riskRow.getCell(cIdx);
      riskCell.value = risk;
      riskCell.alignment = { horizontal: "center" };
      riskCell.font = {
        bold: true,
        color: { argb: risk === "NO COVER" ? "FFDC2626" : risk === "SPOF" ? "FFD97706" : "FF16A34A" },
      };
    });

    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 24;
    sheet.getColumn(3).width = 22;
    sheet.getColumn(4).width = 18;
    sheet.getColumn(5).width = 10;
    allSkills.forEach((_, idx) => {
      sheet.getColumn(6 + idx).width = 14;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="HGV_GCC_Skill_Matrix_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
