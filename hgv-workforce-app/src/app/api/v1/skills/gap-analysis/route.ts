import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");

    // 1. Fetch all role requirement profiles
    const profiles = await prisma.roleRequirementProfile.findMany({
      include: {
        lines: {
          include: {
            skill: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { roleName: "asc" },
    });

    const profileByRole: Record<string, typeof profiles[0]> = {};
    profiles.forEach((p) => {
      profileByRole[p.roleName] = p;
    });

    // 2. Fetch active employees with skills
    const where: any = { assignmentStatus: "Active" };
    if (roleFilter) where.hgvRole = roleFilter;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        domainLead: true,
        skillRatings: {
          include: { skill: true },
        },
      },
      orderBy: { employeeName: "asc" },
    });

    // 3. Compute gap analysis per employee
    const employeeGaps = employees.map((emp) => {
      const profile = profileByRole[emp.hgvRole];
      const skillRatingMap: Record<string, number> = {};
      emp.skillRatings.forEach((sr) => {
        skillRatingMap[sr.skillId] = sr.validatedRating ?? sr.selfRating ?? 0;
      });

      const skillGaps: Record<string, {
        skillName: string;
        requiredLevel: number;
        currentLevel: number;
        gap: number;
        importance: string;
      }> = {};

      let totalGap = 0;
      let skillsWithGap = 0;
      let totalReqs = 0;
      let metReqs = 0;

      if (profile && profile.lines.length > 0) {
        totalReqs = profile.lines.length;
        profile.lines.forEach((line) => {
          const current = skillRatingMap[line.skillId] || 0;
          const gap = Math.max(0, line.minimumLevel - current);

          skillGaps[line.skillId] = {
            skillName: line.skill.name,
            requiredLevel: line.minimumLevel,
            currentLevel: current,
            gap,
            importance: line.importance,
          };

          if (gap > 0) {
            totalGap += gap;
            skillsWithGap++;
          } else {
            metReqs++;
          }
        });
      }

      return {
        id: emp.id,
        employeeId: emp.employeeId || "—",
        name: emp.employeeName,
        role: emp.hgvRole,
        practice: emp.practice || "General",
        domainLead: emp.domainLead?.name || "—",
        hasRoleProfile: !!profile,
        totalRequirements: totalReqs,
        metRequirements: metReqs,
        totalGap,
        skillsWithGap,
        skillGaps,
      };
    });

    // 4. Organization Gap Summary (BRD Section 5.6 & Workbook)
    const orgGapBySkill: Record<string, {
      skillId: string;
      skillName: string;
      categoryName: string;
      totalGapSum: number;
      peopleWithGapCount: number;
      mustHaveGapCount: number;
    }> = {};

    employeeGaps.forEach((eg) => {
      Object.entries(eg.skillGaps).forEach(([sId, g]) => {
        if (!orgGapBySkill[sId]) {
          orgGapBySkill[sId] = {
            skillId: sId,
            skillName: g.skillName,
            categoryName: "",
            totalGapSum: 0,
            peopleWithGapCount: 0,
            mustHaveGapCount: 0,
          };
        }
        if (g.gap > 0) {
          orgGapBySkill[sId].totalGapSum += g.gap;
          orgGapBySkill[sId].peopleWithGapCount++;
          if (g.importance === "MUST_HAVE") {
            orgGapBySkill[sId].mustHaveGapCount++;
          }
        }
      });
    });

    // Ranked list of organizational gaps
    const rankedOrgGaps = Object.values(orgGapBySkill)
      .filter((s) => s.totalGapSum > 0)
      .sort((a, b) => b.totalGapSum - a.totalGapSum);

    return NextResponse.json({
      roleProfiles: profiles,
      employeeGaps,
      rankedOrgGaps,
      totalEmployeesAssessed: employeeGaps.length,
      employeesWithGapsCount: employeeGaps.filter((e) => e.totalGap > 0).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
