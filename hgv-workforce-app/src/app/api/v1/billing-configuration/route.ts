import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getRolePermissions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentConfig = await prisma.billingConfiguration.findFirst({
      where: { isCurrent: true },
      orderBy: { versionNumber: "desc" },
    });

    const history = await prisma.billingConfiguration.findMany({
      orderBy: { versionNumber: "desc" },
      take: 10,
    });

    return NextResponse.json({
      current: currentConfig,
      history,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const permissions = getRolePermissions(user.roleCode);

    // Strictly enforce HR Manager access
    if (!permissions.canEditBillingConfig) {
      return NextResponse.json(
        { error: "Forbidden: Only HR Managers can edit Billing Configuration" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      fxRateInrUsd,
      variablePayRatePercent,
      operationalMarginPercent,
      facilityCostUsdMonthly,
      userBundleCostUsdMonthly,
      shiftAllowanceGeneralUsd,
      shiftAllowanceUsShiftUsd,
      shiftAllowanceUkShiftUsd,
      shiftAllowance24x7NocUsd,
    } = body;

    // Validate numeric ranges
    if (fxRateInrUsd === undefined || Number(fxRateInrUsd) <= 0) {
      return NextResponse.json({ error: "FX Rate must be a positive number" }, { status: 400 });
    }
    if (variablePayRatePercent === undefined || Number(variablePayRatePercent) < 0 || Number(variablePayRatePercent) > 100) {
      return NextResponse.json({ error: "Variable Pay % must be between 0 and 100" }, { status: 400 });
    }
    if (operationalMarginPercent === undefined || Number(operationalMarginPercent) < 0 || Number(operationalMarginPercent) > 100) {
      return NextResponse.json({ error: "Operational Margin % must be between 0 and 100" }, { status: 400 });
    }
    if (facilityCostUsdMonthly === undefined || Number(facilityCostUsdMonthly) < 0) {
      return NextResponse.json({ error: "Facility Cost must be non-negative" }, { status: 400 });
    }
    if (userBundleCostUsdMonthly === undefined || Number(userBundleCostUsdMonthly) < 0) {
      return NextResponse.json({ error: "User Bundle Cost must be non-negative" }, { status: 400 });
    }

    const currentConfig = await prisma.billingConfiguration.findFirst({
      where: { isCurrent: true },
      orderBy: { versionNumber: "desc" },
    });

    const nextVersion = (currentConfig?.versionNumber || 0) + 1;

    const newConfig = await prisma.$transaction(async (tx) => {
      // Mark current as not current
      if (currentConfig) {
        await tx.billingConfiguration.update({
          where: { id: currentConfig.id },
          data: {
            isCurrent: false,
            effectiveTo: new Date(),
          },
        });
      }

      // Create new version
      return await tx.billingConfiguration.create({
        data: {
          versionNumber: nextVersion,
          effectiveFrom: new Date(),
          fxRateInrUsd: parseFloat(fxRateInrUsd),
          variablePayRatePercent: parseFloat(variablePayRatePercent),
          operationalMarginPercent: parseFloat(operationalMarginPercent),
          facilityCostUsdMonthly: parseFloat(facilityCostUsdMonthly),
          userBundleCostUsdMonthly: parseFloat(userBundleCostUsdMonthly) || 0,
          shiftAllowanceGeneralUsd: parseFloat(shiftAllowanceGeneralUsd) || 0,
          shiftAllowanceUsShiftUsd: parseFloat(shiftAllowanceUsShiftUsd) || 200,
          shiftAllowanceUkShiftUsd: parseFloat(shiftAllowanceUkShiftUsd) || 150,
          shiftAllowance24x7NocUsd: parseFloat(shiftAllowance24x7NocUsd) || 250,
          isCurrent: true,
          createdBy: user.email,
        },
      });
    });

    await logAuditEvent({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "CONFIG_CHANGE",
      entityType: "BILLING_CONFIG",
      entityId: newConfig.id,
      description: `Updated Billing Configuration to Version ${nextVersion} (FX: ${newConfig.fxRateInrUsd}, Var%: ${newConfig.variablePayRatePercent}%, OpsMargin: ${newConfig.operationalMarginPercent}%, Facility: $${newConfig.facilityCostUsdMonthly})`,
      beforeJson: currentConfig,
      afterJson: newConfig,
    });

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
