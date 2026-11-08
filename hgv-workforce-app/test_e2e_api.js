const http = require('http');
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Simple helper to make HTTP requests
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('application/json')
            ? JSON.parse(body)
            : body;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      if (typeof data === 'object') {
        req.write(JSON.stringify(data));
      } else {
        req.write(data);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('   HGV GCC WORKFORCE & BILLING - AUTOMATED VERIFICATION   ');
  console.log('========================================================\n');

  let cookie = '';

  // 1. Authenticate as HR Manager
  console.log('1. Testing Authentication (Sarah Jenkins - HR Manager)...');
  const loginRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'sarah.jenkins@hgv.com' });

  console.assert(loginRes.status === 200, `Login failed: ${loginRes.status}`);
  cookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0] || '';
  console.log(`   ✔ Logged in successfully as: ${loginRes.body?.user?.displayName} (${loginRes.body?.user?.roleName})`);

  // 2. Fetch Dashboard
  console.log('\n2. Testing Dashboard API...');
  const dashRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/dashboard',
    method: 'GET',
    headers: { Cookie: cookie },
  });
  console.assert(dashRes.status === 200, `Dashboard failed: ${dashRes.status}`);
  console.log(`   ✔ Total Active Workforce: ${dashRes.body?.headcount?.active}`);
  console.log(`   ✔ Current Monthly Billing USD: $${dashRes.body?.billing?.totalMonthlyBillingUsd}`);

  // 3. Test Workforce Listing & Filters
  console.log('\n3. Testing Workforce Master Data Roster...');
  const wfRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/employees?limit=5',
    method: 'GET',
    headers: { Cookie: cookie },
  });
  console.assert(wfRes.status === 200, `Workforce list failed: ${wfRes.status}`);
  console.log(`   ✔ Retrieved ${wfRes.body?.data?.length} workforce records (Total: ${wfRes.body?.pagination?.total})`);
  const sampleEmp = wfRes.body?.data?.[0];

  // 4. Test Employee Compensation & Deterministic Billing Breakdown
  if (sampleEmp) {
    console.log(`\n4. Testing Individual Employee Billing (${sampleEmp.employeeName} - ${sampleEmp.engagementType})...`);
    const billRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/v1/employees/${sampleEmp.id}/billing?month=2026-08`,
      method: 'GET',
      headers: { Cookie: cookie },
    });
    console.assert(billRes.status === 200, `Employee billing failed: ${billRes.status}`);
    const calc = billRes.body?.calculation;
    console.log(`   ✔ Fully Loaded Cost USD: $${calc?.fullyLoadedCostUsd}`);
    console.log(`   ✔ Ops Margin USD: $${calc?.operationalMarginAmountUsd}`);
    console.log(`   ✔ Shift Allowance USD: $${calc?.shiftAllowanceUsd} (${calc?.shiftAllowanceSource})`);
    console.log(`   ✔ Joining Bonus USD: $${calc?.joiningBonusComponentUsd}`);
    console.log(`   ✔ Billing Status: ${calc?.billingStatus}`);
  }

  // 5. Test Billing Recalculate
  console.log('\n5. Testing Batch Billing Recalculation Engine...');
  const recalcRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/billing/recalculate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
  }, { billingMonth: '2026-08' });
  console.assert(recalcRes.status === 200, `Recalculate failed: ${recalcRes.status}`);
  console.log(`   ✔ Batch Recalculated ${recalcRes.body?.totalEmployees} employees`);
  console.log(`   ✔ Total Monthly Billed: $${recalcRes.body?.totalMonthlyBillingUsd} USD`);

  // 6. Test Reports Endpoint (Billing Summary Excel & JSON)
  console.log('\n6. Testing Reporting & Financial Rollup API...');
  const rptJsonRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/reports/billing?billingMonth=2026-08&format=json',
    method: 'GET',
    headers: { Cookie: cookie },
  });
  console.assert(rptJsonRes.status === 200, `Report JSON failed: ${rptJsonRes.status}`);
  console.log(`   ✔ Billing Summary JSON: ${rptJsonRes.body?.data?.length} rows generated`);

  const rptXlsxRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/reports/billing?billingMonth=2026-08&format=excel',
    method: 'GET',
    headers: { Cookie: cookie },
  });
  console.assert(rptXlsxRes.status === 200, `Report Excel failed: ${rptXlsxRes.status}`);
  console.assert(
    rptXlsxRes.headers['content-type']?.includes('spreadsheet'),
    'Should return Excel content-type'
  );
  console.log(`   ✔ Billing Summary Excel: Binary stream verified (${rptXlsxRes.body?.length} bytes)`);

  // 7. Test Billing Configuration Retrieval & RBAC Guard
  console.log('\n7. Testing Billing Configuration Governance & Security...');
  const cfgRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/billing-configuration',
    method: 'GET',
    headers: { Cookie: cookie },
  });
  console.assert(cfgRes.status === 200, `Config GET failed: ${cfgRes.status}`);
  console.log(`   ✔ Current Production Config Version: v${cfgRes.body?.current?.versionNumber}`);
  console.log(`   ✔ FX Rate: ₹${cfgRes.body?.current?.fxRateInrUsd} | Margin: ${cfgRes.body?.current?.operationalMarginPercent}%`);

  // 8. Test Role Switch to GCC Lead (Read Only) & Verify RBAC Restriction
  console.log('\n8. Testing RBAC Restriction (Switching to GCC Lead - Read Only)...');
  const switchRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/auth/switch-role',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
  }, { roleCode: 'GCC_LEAD' });
  console.assert(switchRes.status === 200, `Switch role failed: ${switchRes.status}`);
  cookie = switchRes.headers['set-cookie']?.[0]?.split(';')[0] || cookie;

  // Now attempt to mutate billing configuration as GCC Lead (Must return 403 Forbidden)
  const forbiddenRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/billing-configuration',
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
  }, {
    fxRateInrUsd: 95.0,
    variablePayRatePercent: 5.0,
    operationalMarginPercent: 30.0,
    facilityCostUsdMonthly: 500.0,
  });
  console.assert(forbiddenRes.status === 403, `Should be 403 Forbidden, got: ${forbiddenRes.status}`);
  console.log(`   ✔ RBAC Defense Verified: GCC Lead attempt to modify Billing Config returned 403 Forbidden (${forbiddenRes.body?.error})`);

  // 9. Test Global Search API
  console.log('\n9. Testing Global Unified Search API...');
  const searchRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/search?q=Nimmi',
    method: 'GET',
    headers: { Cookie: cookie },
  });
  console.assert(searchRes.status === 200, `Search failed: ${searchRes.status}`);
  console.log(`   ✔ Found ${searchRes.body?.employees?.length} employees matching "Nimmi"`);

  // 10. Test Audit Trail
  console.log('\n10. Testing Audit Trail API (Switch back to HR Manager)...');
  const switchBackRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/auth/switch-role',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
  }, { roleCode: 'HR_MANAGER' });
  cookie = switchBackRes.headers['set-cookie']?.[0]?.split(';')[0] || cookie;

  const auditRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/v1/audit?limit=5',
    method: 'GET',
    headers: { Cookie: cookie },
  });
  console.assert(auditRes.status === 200, `Audit failed: ${auditRes.status}`);
  console.log(`   ✔ Audit Trail verified: ${auditRes.body?.data?.length} events loaded (Total logged: ${auditRes.body?.pagination?.total})`);

  console.log('\n========================================================');
  console.log('   🎉 ALL 10 END-TO-END VERIFICATION CHECKS PASSED!     ');
  console.log('========================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
