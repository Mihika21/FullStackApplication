import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const practice = searchParams.get("practice");
    const domainLeadId = searchParams.get("domainLeadId");
    const engagementType = searchParams.get("engagementType");

    // 1. Fetch active categories and skills
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

    // 2. Fetch active employees with allocations and skill ratings
    const employeeWhere: any = { assignmentStatus: "Active" };
    if (practice) employeeWhere.practice = practice;
    if (domainLeadId) employeeWhere.domainLeadId = domainLeadId;
    if (engagementType) employeeWhere.engagementType = engagementType;

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      include: {
        domainLead: true,
        skillRatings: {
          include: { skill: true },
        },
        projectAllocations: {
          where: { status: "CONFIRMED" },
        },
      },
      orderBy: { employeeName: "asc" },
    });

    // 3. Map matrix rows
    const matrixRows = employees.map((emp) => {
      // Calculate current confirmed allocation
      const totalAlloc = emp.projectAllocations.reduce((sum, a) => sum + (a.allocationPct || 0), 0);
      const freeCapacity = Math.max(0, 1.0 - totalAlloc);

      const skillMap: Record<string, number> = {};
      emp.skillRatings.forEach((sr) => {
        skillMap[sr.skillId] = sr.validatedRating ?? sr.selfRating ?? 0;
      });

      return {
        id: emp.id,
        employeeId: emp.employeeId || "—",
        name: emp.employeeName,
        role: emp.hgvRole,
        department: emp.hgvDepartment,
        practice: emp.practice || "General",
        domainLead: emp.domainLead?.name || "—",
        engagementType: emp.engagementType,
        allocationPct: Math.round(totalAlloc * 100) / 100,
        freeCapacityPct: Math.round(freeCapacity * 100) / 100,
        skills: skillMap,
      };
    });

    // 4. Calculate summary metrics per skill (matching Starter Workbook)
    const summary: Record<string, {
      headcountL3: number;
      headcountL4: number;
      averageRating: number;
      coverageRisk: "OK" | "SPOF" | "NO COVER";
    }> = {};

    allSkills.forEach((skill) => {
      let l3Count = 0;
      let l4Count = 0;
      let ratedSum = 0;
      let ratedCount = 0;

      matrixRows.forEach((row) => {
        const rating = row.skills[skill.id] || 0;
        if (rating >= 3) l3Count++;
        if (rating >= 4) l4Count++;
        if (rating > 0) {
          ratedSum += rating;
          ratedCount++;
        }
      });

      const avg = ratedCount > 0 ? Math.round((ratedSum / ratedCount) * 10) / 10 : 0;
      let risk: "OK" | "SPOF" | "NO COVER" = "OK";
      if (l4Count === 0) {
        risk = "NO COVER";
      } else if (l4Count === 1) {
        risk = "SPOF";
      }

      summary[skill.id] = {
        headcountL3: l3Count,
        headcountL4: l4Count,
        averageRating: avg,
        coverageRisk: risk,
      };
    });

    return NextResponse.json({
      categories,
      skills: allSkills,
      matrix: matrixRows,
      summary,
      totalEmployees: matrixRows.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
