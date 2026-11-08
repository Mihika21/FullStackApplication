import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateEmployeeBilling } from "@/lib/billingEngine";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const billingMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    // 1. Employee counts
    const [allEmployees, activeCount, inactiveCount, recentUploads, recentAudits] = await Promise.all([
      prisma.employee.findMany({
        include: {
          domainLead: true,
          shiftType: true,
          compensations: {
            orderBy: { effectiveFrom: "desc" },
            take: 1,
          },
        },
      }),
      prisma.employee.count({ where: { assignmentStatus: "Active" } }),
      prisma.employee.count({ where: { assignmentStatus: "Inactive" } }),
      prisma.importBatch.findMany({
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { rowErrors: { take: 3 } },
      }),
      prisma.auditEvent.findMany({
        orderBy: { occurredAt: "desc" },
        take: 6,
      }),
    ]);

    // 2. Breakdown by Engagement Type
    const engagementMix: Record<string, number> = {
      GCC: 0,
      NOC: 0,
      Rebadge: 0,
      Colocation: 0,
      "Non-GCC": 0,
    };
    let gccPresenceCount = 0;

    for (const emp of allEmployees) {
      if (emp.assignmentStatus === "Active") {
        engagementMix[emp.engagementType] = (engagementMix[emp.engagementType] || 0) + 1;
        if (emp.gccPresence) gccPresenceCount++;
      }
    }

    // 3. Billing Snapshot
    const billingConfig = await prisma.billingConfiguration.findFirst({
      where: { isCurrent: true },
      orderBy: { versionNumber: "desc" },
    });

    let totalMonthlyBillingUsd = 0;
    let totalSalaryCostUsd = 0;
    let totalOpsMarginUsd = 0;
    let totalFacilityCostUsd = 0;
    let billedEmployeesCount = 0;

    if (billingConfig) {
      const overrides = await prisma.shiftAllowanceOverride.findMany({
        where: { billingMonth, validationStatus: "VALIDATED" },
      });
      const overrideMap = new Map(overrides.map((o) => [o.employeeId, o]));

      for (const emp of allEmployees) {
        if (emp.assignmentStatus === "Active") {
          const res = calculateEmployeeBilling({
            employee: emp,
            compensation: emp.compensations[0] || null,
            billingConfig,
            billingMonth,
            pmoOverride: overrideMap.get(emp.id) || null,
          });

          if (res.billingStatus === "CALCULATED") {
            billedEmployeesCount++;
            totalMonthlyBillingUsd += res.fullyLoadedCostUsd;
            totalSalaryCostUsd += res.salaryCostUsd;
            totalOpsMarginUsd += res.operationalMarginAmountUsd;
            totalFacilityCostUsd += res.facilityCostUsd;
          }
        }
      }
    }

    // 4. Attention items / data quality
    const attentionItems: { type: string; title: string; count: number }[] = [];
    const missingCtcCount = allEmployees.filter(
      (e) => (e.engagementType === "GCC" || e.engagementType === "NOC") && (!e.compensations[0] || e.compensations[0].fixedCtcInrAnnual <= 0)
    ).length;

    if (missingCtcCount > 0) {
      attentionItems.push({
        type: "WARNING",
        title: "GCC/NOC employees with missing Fixed CTC",
        count: missingCtcCount,
      });
    }

    const missingShiftCount = allEmployees.filter(
      (e) => e.assignmentStatus === "Active" && e.engagementType !== "Non-GCC" && !e.shiftTypeId
    ).length;

    if (missingShiftCount > 0) {
      attentionItems.push({
        type: "INFO",
        title: "Active employees without designated Shift Type",
        count: missingShiftCount,
      });
    }

    return NextResponse.json({
      userRole: user.roleCode,
      billingMonth,
      headcount: {
        total: allEmployees.length,
        active: activeCount,
        inactive: inactiveCount,
        gccPresenceCount,
        engagementMix,
      },
      billing: {
        configVersion: billingConfig?.versionNumber || 1,
        fxRate: billingConfig?.fxRateInrUsd || 90,
        billedEmployeesCount,
        totalMonthlyBillingUsd: Number(totalMonthlyBillingUsd.toFixed(2)),
        annualRunRateUsd: Number((totalMonthlyBillingUsd * 12).toFixed(2)),
        totalSalaryCostUsd: Number(totalSalaryCostUsd.toFixed(2)),
        totalOpsMarginUsd: Number(totalOpsMarginUsd.toFixed(2)),
        totalFacilityCostUsd: Number(totalFacilityCostUsd.toFixed(2)),
      },
      attentionItems,
      recentUploads,
      recentAudits,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
