export interface BillingCalculationInput {
  employee: {
    id: string;
    employeeId?: string | null;
    employeeName: string;
    engagementType: string; // GCC, NOC, Rebadge, Colocation, Non-GCC
    hgvStartDate?: Date | string | null;
    shiftTypeId?: string | null;
    shiftType?: {
      code: string;
      name: string;
      defaultRate: number;
    } | null;
  };
  compensation?: {
    fixedCtcInrAnnual: number;
    variablePayMode: string; // NONE, FLAT_PERCENT, CUSTOM_AMOUNT
    variablePayPercent?: number | null;
    variablePayCustomInrMonthly?: number | null;
    joiningBonusInr?: number | null;
  } | null;
  billingConfig: {
    versionNumber: number;
    fxRateInrUsd: number;
    variablePayRatePercent: number;
    operationalMarginPercent: number;
    facilityCostUsdMonthly: number;
    userBundleCostUsdMonthly: number;
    shiftAllowanceGeneralUsd: number;
    shiftAllowanceUsShiftUsd: number;
    shiftAllowanceUkShiftUsd: number;
    shiftAllowance24x7NocUsd: number;
  };
  billingMonth: string; // "YYYY-MM", e.g. "2026-08"
  pmoOverride?: {
    validatedAmountUsd: number;
    validationStatus: string;
  } | null;
}

export interface BillingCalculationResult {
  employeeId: string;
  billingMonth: string;
  engagementType: string;
  configurationVersion: number;
  fixedCtcInrAnnual: number;
  monthlyFixedSalaryInr: number;
  variablePayMode: string;
  variablePayAmountInr: number;
  variablePayAmountUsd: number;
  fxRateInrUsd: number;
  salaryCostUsd: number;
  operationalMarginAmountUsd: number;
  facilityCostUsd: number;
  userBundleCostUsd: number;
  shiftAllowanceUsd: number;
  shiftAllowanceSource: "PMO_OVERRIDE" | "SHIFT_TYPE_DEFAULT";
  joiningBonusComponentUsd: number;
  joiningBonusMonthIndex: number | null;
  fullyLoadedCostUsd: number;
  annualFullyLoadedCostUsd: number;
  billingStatus: "CALCULATED" | "NOT_APPLICABLE" | "ERROR";
  components: Array<{
    componentType: string;
    sourceType: string;
    amountUsd: number;
    rateValue?: number;
    description: string;
  }>;
}

/**
 * Calculates month difference between start date and target billing month (1-indexed)
 */
export function getJoiningMonthIndex(startDateInput: Date | string | null | undefined, billingMonth: string): number | null {
  if (!startDateInput) return null;
  const start = new Date(startDateInput);
  if (isNaN(start.getTime())) return null;

  const [tYear, tMonth] = billingMonth.split("-").map(Number); // tMonth 1..12
  const sYear = start.getFullYear();
  const sMonth = start.getMonth() + 1; // 1..12

  const diffMonths = (tYear - sYear) * 12 + (tMonth - sMonth);
  if (diffMonths < 0) return 0; // Prior to start date
  return diffMonths + 1; // 1 for 1st month, 2 for 2nd month, 3 for 3rd month, 4+ thereafter
}

export function calculateEmployeeBilling(input: BillingCalculationInput): BillingCalculationResult {
  const { employee, compensation, billingConfig, billingMonth, pmoOverride } = input;
  const fxRate = billingConfig.fxRateInrUsd > 0 ? billingConfig.fxRateInrUsd : 90.0;
  const components: BillingCalculationResult["components"] = [];

  // Non-GCC Fixed Bid
  if (employee.engagementType === "Non-GCC") {
    return {
      employeeId: employee.id,
      billingMonth,
      engagementType: employee.engagementType,
      configurationVersion: billingConfig.versionNumber,
      fixedCtcInrAnnual: 0,
      monthlyFixedSalaryInr: 0,
      variablePayMode: "NONE",
      variablePayAmountInr: 0,
      variablePayAmountUsd: 0,
      fxRateInrUsd: fxRate,
      salaryCostUsd: 0,
      operationalMarginAmountUsd: 0,
      facilityCostUsd: 0,
      userBundleCostUsd: 0,
      shiftAllowanceUsd: 0,
      shiftAllowanceSource: "SHIFT_TYPE_DEFAULT",
      joiningBonusComponentUsd: 0,
      joiningBonusMonthIndex: null,
      fullyLoadedCostUsd: 0,
      annualFullyLoadedCostUsd: 0,
      billingStatus: "NOT_APPLICABLE",
      components: [
        {
          componentType: "EXTERNAL",
          sourceType: "FIXED_BID",
          amountUsd: 0,
          description: "Billing calculated outside platform",
        },
      ],
    };
  }

  // Rebadge & Colocation (Facility Cost + User Bundle Cost only)
  if (employee.engagementType === "Rebadge" || employee.engagementType === "Colocation") {
    const facilityCost = Number(billingConfig.facilityCostUsdMonthly.toFixed(2));
    const userBundleCost = Number(billingConfig.userBundleCostUsdMonthly.toFixed(2));
    const fullyLoaded = Number((facilityCost + userBundleCost).toFixed(2));

    components.push({
      componentType: "FACILITY",
      sourceType: "CONFIG",
      amountUsd: facilityCost,
      description: "Monthly Facility Cost",
    });

    if (userBundleCost > 0) {
      components.push({
        componentType: "BUNDLE",
        sourceType: "CONFIG",
        amountUsd: userBundleCost,
        description: "Monthly User Bundle Cost",
      });
    }

    return {
      employeeId: employee.id,
      billingMonth,
      engagementType: employee.engagementType,
      configurationVersion: billingConfig.versionNumber,
      fixedCtcInrAnnual: 0,
      monthlyFixedSalaryInr: 0,
      variablePayMode: "NONE",
      variablePayAmountInr: 0,
      variablePayAmountUsd: 0,
      fxRateInrUsd: fxRate,
      salaryCostUsd: 0,
      operationalMarginAmountUsd: 0,
      facilityCostUsd: facilityCost,
      userBundleCostUsd: userBundleCost,
      shiftAllowanceUsd: 0,
      shiftAllowanceSource: "SHIFT_TYPE_DEFAULT",
      joiningBonusComponentUsd: 0,
      joiningBonusMonthIndex: null,
      fullyLoadedCostUsd: fullyLoaded,
      annualFullyLoadedCostUsd: Number((fullyLoaded * 12).toFixed(2)),
      billingStatus: "CALCULATED",
      components,
    };
  }

  // GCC & NOC Engagements
  const fixedCtc = compensation?.fixedCtcInrAnnual || 0;
  const monthlyFixedSalaryInr = Number((fixedCtc / 12).toFixed(2));
  const variablePayMode = compensation?.variablePayMode || "NONE";

  let variablePayInr = 0;
  if (variablePayMode === "FLAT_PERCENT") {
    const pct = billingConfig.variablePayRatePercent;
    variablePayInr = Number((monthlyFixedSalaryInr * (pct / 100)).toFixed(2));
  } else if (variablePayMode === "CUSTOM_AMOUNT") {
    variablePayInr = compensation?.variablePayCustomInrMonthly || 0;
  }

  const variablePayUsd = Number((variablePayInr / fxRate).toFixed(2));
  const fixedSalaryUsd = Number((monthlyFixedSalaryInr / fxRate).toFixed(2));
  const salaryCostUsd = Number((fixedSalaryUsd + variablePayUsd).toFixed(2));

  components.push({
    componentType: "SALARY_BASE",
    sourceType: "FIXED",
    amountUsd: fixedSalaryUsd,
    rateValue: fixedCtc,
    description: `Monthly Fixed Salary (₹${monthlyFixedSalaryInr.toLocaleString('en-IN')} ÷ ${fxRate} FX)`,
  });

  if (variablePayUsd > 0) {
    components.push({
      componentType: "VARIABLE_PAY",
      sourceType: "VARIABLE",
      amountUsd: variablePayUsd,
      description: `Variable Pay (${variablePayMode === "FLAT_PERCENT" ? `${billingConfig.variablePayRatePercent}% Flat` : "Custom Amount"})`,
    });
  }

  // Operational Margin
  const marginPct = billingConfig.operationalMarginPercent;
  const operationalMarginAmountUsd = Number((salaryCostUsd * (marginPct / 100)).toFixed(2));
  components.push({
    componentType: "MARGIN",
    sourceType: "CONFIG",
    amountUsd: operationalMarginAmountUsd,
    rateValue: marginPct,
    description: `Operational Margin (${marginPct}% of Salary Cost)`,
  });

  // Facility Cost & User Bundle Cost
  const facilityCostUsd = Number(billingConfig.facilityCostUsdMonthly.toFixed(2));
  components.push({
    componentType: "FACILITY",
    sourceType: "CONFIG",
    amountUsd: facilityCostUsd,
    description: "Monthly Facility Cost",
  });

  const userBundleCostUsd = Number(billingConfig.userBundleCostUsdMonthly.toFixed(2));
  if (userBundleCostUsd > 0) {
    components.push({
      componentType: "BUNDLE",
      sourceType: "CONFIG",
      amountUsd: userBundleCostUsd,
      description: "Monthly User Bundle Cost",
    });
  }

  // Shift Allowance
  let shiftAllowanceUsd = 0;
  let shiftAllowanceSource: "PMO_OVERRIDE" | "SHIFT_TYPE_DEFAULT" = "SHIFT_TYPE_DEFAULT";

  if (pmoOverride && pmoOverride.validationStatus === "VALIDATED") {
    shiftAllowanceUsd = Number(pmoOverride.validatedAmountUsd.toFixed(2));
    shiftAllowanceSource = "PMO_OVERRIDE";
    components.push({
      componentType: "SHIFT",
      sourceType: "OVERRIDE",
      amountUsd: shiftAllowanceUsd,
      description: `PMO Validated Shift Allowance Override for ${billingMonth}`,
    });
  } else if (employee.shiftType) {
    const code = employee.shiftType.code;
    let rate = employee.shiftType.defaultRate || 0;
    if (code === "GENERAL") rate = billingConfig.shiftAllowanceGeneralUsd;
    else if (code === "US_SHIFT") rate = billingConfig.shiftAllowanceUsShiftUsd;
    else if (code === "UK_SHIFT") rate = billingConfig.shiftAllowanceUkShiftUsd;
    else if (code === "NOC_24X7") rate = billingConfig.shiftAllowance24x7NocUsd;

    shiftAllowanceUsd = Number(rate.toFixed(2));
    components.push({
      componentType: "SHIFT",
      sourceType: "CONFIG",
      amountUsd: shiftAllowanceUsd,
      description: `Shift Type Default (${employee.shiftType.name})`,
    });
  }

  // Joining Bonus (3-month amortization: 1/3 in Months 1..3, 0 in Month 4+)
  let joiningBonusComponentUsd = 0;
  const monthIndex = getJoiningMonthIndex(employee.hgvStartDate, billingMonth);
  const totalBonusInr = compensation?.joiningBonusInr || 0;

  if (totalBonusInr > 0 && monthIndex !== null && monthIndex >= 1 && monthIndex <= 3) {
    const monthlyBonusInr = totalBonusInr / 3;
    joiningBonusComponentUsd = Number((monthlyBonusInr / fxRate).toFixed(2));
    components.push({
      componentType: "BONUS",
      sourceType: "CONFIG",
      amountUsd: joiningBonusComponentUsd,
      rateValue: monthIndex,
      description: `Joining Bonus Amortization (Month ${monthIndex} of 3 - ₹${Math.round(monthlyBonusInr).toLocaleString('en-IN')})`,
    });
  } else if (totalBonusInr > 0 && monthIndex !== null && monthIndex > 3) {
    components.push({
      componentType: "BONUS",
      sourceType: "CONFIG",
      amountUsd: 0,
      rateValue: monthIndex,
      description: `Joining Bonus Expired (Month ${monthIndex} - beyond 3-month window)`,
    });
  }

  // Total Monthly Fully Loaded Cost
  const fullyLoadedCostUsd = Number(
    (
      salaryCostUsd +
      operationalMarginAmountUsd +
      facilityCostUsd +
      userBundleCostUsd +
      shiftAllowanceUsd +
      joiningBonusComponentUsd
    ).toFixed(2)
  );

  const annualFullyLoadedCostUsd = Number((fullyLoadedCostUsd * 12).toFixed(2));

  return {
    employeeId: employee.id,
    billingMonth,
    engagementType: employee.engagementType,
    configurationVersion: billingConfig.versionNumber,
    fixedCtcInrAnnual: fixedCtc,
    monthlyFixedSalaryInr,
    variablePayMode,
    variablePayAmountInr: variablePayInr,
    variablePayAmountUsd: variablePayUsd,
    fxRateInrUsd: fxRate,
    salaryCostUsd,
    operationalMarginAmountUsd,
    facilityCostUsd,
    userBundleCostUsd,
    shiftAllowanceUsd,
    shiftAllowanceSource,
    joiningBonusComponentUsd,
    joiningBonusMonthIndex: monthIndex,
    fullyLoadedCostUsd,
    annualFullyLoadedCostUsd,
    billingStatus: "CALCULATED",
    components,
  };
}
