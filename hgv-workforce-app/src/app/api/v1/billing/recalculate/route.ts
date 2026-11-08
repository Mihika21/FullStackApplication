import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { calculateEmployeeBilling } from "@/lib/billingEngine";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    if (!permissions.canEditCompensation && !permissions.canEditBillingConfig) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to recalculate billing" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const billingMonth = body.billingMonth || new Date().toISOString().slice(0, 7);

    const billingConfig = await prisma.billingConfiguration.findFirst({
      where: { isCurrent: true },
      orderBy: { versionNumber: "desc" },
    });

    if (!billingConfig) {
      return NextResponse.json({ error: "No active billing configuration found" }, { status: 500 });
    }

    // Fetch all active employees
    const employees = await prisma.employee.findMany({
      where: { assignmentStatus: "Active" },
      include: {
        shiftType: true,
        compensations: {
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
    });

    const overrides = await prisma.shiftAllowanceOverride.findMany({
      where: { billingMonth, validationStatus: "VALIDATED" },
    });
    const overrideMap = new Map(overrides.map((o) => [o.employeeId, o]));

    let calculatedCount = 0;
    let notApplicableCount = 0;
    let totalMonthlyBillingUsd = 0;

    for (const emp of employees) {
      const pmoOverride = overrideMap.get(emp.id) || null;
      const res = calculateEmployeeBilling({
        employee: emp,
        compensation: emp.compensations[0] || null,
        billingConfig,
        billingMonth,
        pmoOverride,
      });

      if (res.billingStatus === "CALCULATED") {
        calculatedCount++;
        totalMonthlyBillingUsd += res.fullyLoadedCostUsd;
      } else {
        notApplicableCount++;
      }

      // Upsert billing result snapshot
      const existing = await prisma.billingResult.findUnique({
        where: {
          employeeId_billingMonth: {
            employeeId: emp.id,
            billingMonth,
          },
        },
      });

      if (existing) {
        await prisma.billingResultComponent.deleteMany({
          where: { billingResultId: existing.id },
        });

        await prisma.billingResult.update({
          where: { id: existing.id },
          data: {
            engagementType: res.engagementType,
            configurationVersion: res.configurationVersion,
            fixedCtcInrAnnual: res.fixedCtcInrAnnual,
            monthlyFixedSalaryInr: res.monthlyFixedSalaryInr,
            variablePayMode: res.variablePayMode,
            variablePayAmountInr: res.variablePayAmountInr,
            variablePayAmountUsd: res.variablePayAmountUsd,
            fxRateInrUsd: res.fxRateInrUsd,
            salaryCostUsd: res.salaryCostUsd,
            operationalMarginAmountUsd: res.operationalMarginAmountUsd,
            facilityCostUsd: res.facilityCostUsd,
            userBundleCostUsd: res.userBundleCostUsd,
            shiftAllowanceUsd: res.shiftAllowanceUsd,
            shiftAllowanceSource: res.shiftAllowanceSource,
            joiningBonusComponentUsd: res.joiningBonusComponentUsd,
            joiningBonusMonthIndex: res.joiningBonusMonthIndex,
            fullyLoadedCostUsd: res.fullyLoadedCostUsd,
            annualFullyLoadedCostUsd: res.annualFullyLoadedCostUsd,
            billingStatus: res.billingStatus,
            calculatedAt: new Date(),
            components: {
              create: res.components.map((c) => ({
                componentType: c.componentType,
                sourceType: c.sourceType,
                amountUsd: c.amountUsd,
                rateValue: c.rateValue || null,
                description: c.description,
              })),
            },
          },
        });
      } else {
        await prisma.billingResult.create({
          data: {
            employeeId: emp.id,
            billingMonth,
            engagementType: res.engagementType,
            configurationVersion: res.configurationVersion,
            fixedCtcInrAnnual: res.fixedCtcInrAnnual,
            monthlyFixedSalaryInr: res.monthlyFixedSalaryInr,
            variablePayMode: res.variablePayMode,
            variablePayAmountInr: res.variablePayAmountInr,
            variablePayAmountUsd: res.variablePayAmountUsd,
            fxRateInrUsd: res.fxRateInrUsd,
            salaryCostUsd: res.salaryCostUsd,
            operationalMarginAmountUsd: res.operationalMarginAmountUsd,
            facilityCostUsd: res.facilityCostUsd,
            userBundleCostUsd: res.userBundleCostUsd,
            shiftAllowanceUsd: res.shiftAllowanceUsd,
            shiftAllowanceSource: res.shiftAllowanceSource,
            joiningBonusComponentUsd: res.joiningBonusComponentUsd,
            joiningBonusMonthIndex: res.joiningBonusMonthIndex,
            fullyLoadedCostUsd: res.fullyLoadedCostUsd,
            annualFullyLoadedCostUsd: res.annualFullyLoadedCostUsd,
            billingStatus: res.billingStatus,
            calculatedAt: new Date(),
            components: {
              create: res.components.map((c) => ({
                componentType: c.componentType,
                sourceType: c.sourceType,
                amountUsd: c.amountUsd,
                rateValue: c.rateValue || null,
                description: c.description,
              })),
            },
          },
        });
      }
    }

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "UPDATE",
      entityType: "COMPENSATION",
      description: `Executed batch billing recalculation for ${billingMonth}. Processed ${employees.length} records ($${totalMonthlyBillingUsd.toFixed(2)} USD)`,
    });

    return NextResponse.json({
      success: true,
      billingMonth,
      totalEmployees: employees.length,
      calculatedCount,
      notApplicableCount,
      totalMonthlyBillingUsd: Number(totalMonthlyBillingUsd.toFixed(2)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
