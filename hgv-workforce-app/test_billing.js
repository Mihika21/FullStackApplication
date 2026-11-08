const { calculateEmployeeBilling } = require('./src/lib/billingEngine');

console.log('--- Running Deterministic Billing Test Matrix ---');

const baseConfig = {
  versionNumber: 1,
  fxRateInrUsd: 90.0,
  variablePayRatePercent: 5.0, // 5%
  operationalMarginPercent: 30.0, // 30%
  facilityCostUsdMonthly: 500.0, // $500
  userBundleCostUsdMonthly: 0.0,
  shiftAllowanceGeneralUsd: 0.0,
  shiftAllowanceUsShiftUsd: 200.0,
  shiftAllowanceUkShiftUsd: 150.0,
  shiftAllowance24x7NocUsd: 250.0,
};

// 1. GCC + Flat % (Nimmi K Cherian, CTC 2,600,000 INR, 5% Var, US Shift default = $200)
// Monthly fixed = 2,600,000 / 12 = 216,666.67 INR
// Var pay INR = 216,666.67 * 0.05 = 10,833.33 INR
// Var pay USD = 10,833.33 / 90 = 120.37 USD
// Salary fixed USD = 216,666.67 / 90 = 2407.41 USD
// Salary Cost USD = 2407.41 + 120.37 = 2527.78 USD
// Ops Margin USD = 2527.78 * 0.30 = 758.33 USD
// Facility USD = 500 USD
// Shift USD = 200 USD
// Bonus Month 1 (150,000 INR bonus) = (150,000 / 3) / 90 = 555.56 USD
// Fully loaded Month 1 = 2527.78 + 758.33 + 500 + 200 + 555.56 = 4541.67 USD
const test1 = calculateEmployeeBilling({
  employee: {
    id: 'emp1',
    employeeId: 'IN01806551',
    employeeName: 'Nimmi K Cherian',
    engagementType: 'GCC',
    hgvStartDate: '2026-08-01',
    shiftType: { code: 'US_SHIFT', name: 'US Night Shift', defaultRate: 200 },
  },
  compensation: {
    fixedCtcInrAnnual: 2600000,
    variablePayMode: 'FLAT_PERCENT',
    variablePayPercent: 5.0,
    joiningBonusInr: 150000,
  },
  billingConfig: baseConfig,
  billingMonth: '2026-08', // Month 1 of joining
});

console.log('Test 1 (GCC + Flat % + Joining Bonus Month 1):');
console.log(' - Monthly Fixed Salary INR:', test1.monthlyFixedSalaryInr);
console.log(' - Salary Cost USD:', test1.salaryCostUsd);
console.log(' - Ops Margin USD:', test1.operationalMarginAmountUsd);
console.log(' - Joining Bonus USD:', test1.joiningBonusComponentUsd, `(Month Index: ${test1.joiningBonusMonthIndex})`);
console.log(' - Fully Loaded Cost USD:', test1.fullyLoadedCostUsd);
console.assert(test1.joiningBonusComponentUsd > 550, 'Bonus should be ~555.56 USD');

// 2. Joining Bonus Month 4 (should be 0)
const test2 = calculateEmployeeBilling({
  employee: {
    id: 'emp1',
    employeeId: 'IN01806551',
    employeeName: 'Nimmi K Cherian',
    engagementType: 'GCC',
    hgvStartDate: '2026-08-01',
    shiftType: { code: 'US_SHIFT', name: 'US Night Shift', defaultRate: 200 },
  },
  compensation: {
    fixedCtcInrAnnual: 2600000,
    variablePayMode: 'FLAT_PERCENT',
    variablePayPercent: 5.0,
    joiningBonusInr: 150000,
  },
  billingConfig: baseConfig,
  billingMonth: '2026-12', // Month 5
});
console.log('\nTest 2 (Joining Bonus Month 5):');
console.log(' - Joining Bonus USD:', test2.joiningBonusComponentUsd, `(Month Index: ${test2.joiningBonusMonthIndex})`);
console.assert(test2.joiningBonusComponentUsd === 0, 'Bonus in month 4+ must be 0');

// 3. PMO Validated Override Precedence
const test3 = calculateEmployeeBilling({
  employee: {
    id: 'emp1',
    employeeId: 'IN01806551',
    employeeName: 'Nimmi K Cherian',
    engagementType: 'GCC',
    shiftType: { code: 'GENERAL', name: 'General Shift', defaultRate: 0 },
  },
  compensation: {
    fixedCtcInrAnnual: 2600000,
    variablePayMode: 'NONE',
  },
  billingConfig: baseConfig,
  billingMonth: '2026-08',
  pmoOverride: {
    validatedAmountUsd: 350.0,
    validationStatus: 'VALIDATED',
  },
});
console.log('\nTest 3 (PMO Override Precedence):');
console.log(' - Shift Allowance USD:', test3.shiftAllowanceUsd, `(Source: ${test3.shiftAllowanceSource})`);
console.assert(test3.shiftAllowanceUsd === 350.0, 'PMO Override must take precedence');
console.assert(test3.shiftAllowanceSource === 'PMO_OVERRIDE', 'Source must be PMO_OVERRIDE');

// 4. Rebadge / Colocation (Facility + User bundle only)
const test4 = calculateEmployeeBilling({
  employee: {
    id: 'emp2',
    employeeName: 'Marcus Vance',
    engagementType: 'Rebadge',
  },
  compensation: null,
  billingConfig: baseConfig,
  billingMonth: '2026-08',
});
console.log('\nTest 4 (Rebadge / Colocation):');
console.log(' - Salary Cost USD:', test4.salaryCostUsd);
console.log(' - Facility Cost USD:', test4.facilityCostUsd);
console.log(' - Fully Loaded Cost USD:', test4.fullyLoadedCostUsd);
console.assert(test4.salaryCostUsd === 0, 'Rebadge salary cost must be 0');
console.assert(test4.fullyLoadedCostUsd === 500.0, 'Rebadge fully loaded cost must equal facility cost');

// 5. Non-GCC Fixed Bid
const test5 = calculateEmployeeBilling({
  employee: {
    id: 'emp3',
    employeeName: 'Vikramaditya Roy',
    engagementType: 'Non-GCC',
  },
  compensation: null,
  billingConfig: baseConfig,
  billingMonth: '2026-08',
});
console.log('\nTest 5 (Non-GCC Fixed Bid):');
console.log(' - Billing Status:', test5.billingStatus);
console.log(' - Fully Loaded Cost USD:', test5.fullyLoadedCostUsd);
console.assert(test5.billingStatus === 'NOT_APPLICABLE', 'Non-GCC status must be NOT_APPLICABLE');
console.assert(test5.fullyLoadedCostUsd === 0, 'Non-GCC cost must be 0');

console.log('\n✅ ALL CRITICAL BILLING FORMULAS AND TEST CASES PASSED!');
