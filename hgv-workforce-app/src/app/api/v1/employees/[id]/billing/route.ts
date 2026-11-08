import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateEmployeeBilling } from "@/lib/billingEngine";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const billingMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7); // YYYY-MM

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        domainLead: true,
        shiftType: true,
        compensations: {
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get current billing configuration
    const billingConfig = await prisma.billingConfiguration.findFirst({
      where: { isCurrent: true },
      orderBy: { versionNumber: "desc" },
    });

    if (!billingConfig) {
      return NextResponse.json(
        { error: "No active billing configuration found" },
        { status: 500 }
      );
    }

    // Check for PMO validated shift allowance override
    const pmoOverride = await prisma.shiftAllowanceOverride.findUnique({
      where: {
        employeeId_billingMonth: {
          employeeId: id,
          billingMonth,
        },
      },
    });

    const calculation = calculateEmployeeBilling({
      employee,
      compensation: employee.compensations[0] || null,
      billingConfig,
      billingMonth,
      pmoOverride,
    });

    return NextResponse.json({
      calculation,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        engagementType: employee.engagementType,
        hgvRole: employee.hgvRole,
        hgvDepartment: employee.hgvDepartment,
        domainLeadName: employee.domainLead?.name,
        hgvStartDate: employee.hgvStartDate,
      },
      billingConfig: {
        versionNumber: billingConfig.versionNumber,
        fxRateInrUsd: billingConfig.fxRateInrUsd,
        variablePayRatePercent: billingConfig.variablePayRatePercent,
        operationalMarginPercent: billingConfig.operationalMarginPercent,
        facilityCostUsdMonthly: billingConfig.facilityCostUsdMonthly,
        userBundleCostUsdMonthly: billingConfig.userBundleCostUsdMonthly,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
