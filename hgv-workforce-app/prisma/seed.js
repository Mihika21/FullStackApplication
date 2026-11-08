const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HGV Workforce database...');

  // 1. Clean existing records if any
  await prisma.billingResultComponent.deleteMany();
  await prisma.billingResult.deleteMany();
  await prisma.shiftAllowanceOverride.deleteMany();
  await prisma.employeeCompensation.deleteMany();
  await prisma.employeeContact.deleteMany();
  await prisma.employeeAddress.deleteMany();
  await prisma.employeeAttrition.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.shiftType.deleteMany();
  await prisma.source.deleteMany();
  await prisma.domainLead.deleteMany();
  await prisma.billingConfiguration.deleteMany();
  await prisma.appUser.deleteMany();
  await prisma.role.deleteMany();
  await prisma.auditEvent.deleteMany();

  // 2. Roles
  const hrManagerRole = await prisma.role.create({
    data: {
      code: 'HR_MANAGER',
      name: 'HR Manager',
      description: 'Full master data, compensation, Billing Configuration, reports, user administration and audit trail',
    },
  });

  const hrTeamMemberRole = await prisma.role.create({
    data: {
      code: 'HR_TEAM_MEMBER',
      name: 'HR Team Member',
      description: 'Master data, compensation, bulk uploads, and permitted reports; no Billing Configuration edit',
    },
  });

  const gccLeadRole = await prisma.role.create({
    data: {
      code: 'GCC_LEAD',
      name: 'GCC Lead',
      description: 'Read-only access to workforce master data, compensation, billing figures and reports',
    },
  });

  // 3. Application Users
  const hrManagerUser = await prisma.appUser.create({
    data: {
      email: 'sarah.jenkins@hgv.com',
      displayName: 'Sarah Jenkins',
      roleId: hrManagerRole.id,
      status: 'ACTIVE',
      passwordHash: 'dummy_hash',
    },
  });

  const hrTeamMemberUser = await prisma.appUser.create({
    data: {
      email: 'alex.rivera@hgv.com',
      displayName: 'Alex Rivera',
      roleId: hrTeamMemberRole.id,
      status: 'ACTIVE',
      passwordHash: 'dummy_hash',
    },
  });

  const gccLeadUser = await prisma.appUser.create({
    data: {
      email: 'jeff.chu@hgv.com',
      displayName: 'Jeff Chu',
      roleId: gccLeadRole.id,
      status: 'ACTIVE',
      passwordHash: 'dummy_hash',
    },
  });

  // 4. Domain Leads
  const leads = await Promise.all([
    prisma.domainLead.create({ data: { name: 'Jeff Chu' } }),
    prisma.domainLead.create({ data: { name: 'Sue Pawa' } }),
    prisma.domainLead.create({ data: { name: 'Michael Chang' } }),
    prisma.domainLead.create({ data: { name: 'Priya Sharma' } }),
    prisma.domainLead.create({ data: { name: 'David Wilson' } }),
  ]);

  // 5. Sources
  const sources = await Promise.all([
    prisma.source.create({ data: { name: 'Direct Hire' } }),
    prisma.source.create({ data: { name: 'Internal Transfer' } }),
    prisma.source.create({ data: { name: 'Staffing Agency' } }),
    prisma.source.create({ data: { name: 'Campus Recruitment' } }),
    prisma.source.create({ data: { name: 'Referral' } }),
  ]);

  // 6. Shift Types
  const generalShift = await prisma.shiftType.create({
    data: {
      code: 'GENERAL',
      name: 'General Shift (Day)',
      startTime: '09:00',
      endTime: '18:00',
      timezone: 'IST (UTC+5:30)',
      description: 'Standard Business Day Shift (09:00 - 18:00 IST)',
      defaultRate: 0.0,
    },
  });
  const usShift = await prisma.shiftType.create({
    data: {
      code: 'US_SHIFT',
      name: 'US Night Shift',
      startTime: '21:00',
      endTime: '06:00',
      timezone: 'IST (UTC+5:30)',
      description: 'US East/Central Night Coverage (21:00 - 06:00 IST)',
      defaultRate: 200.0,
    },
  });
  const ukShift = await prisma.shiftType.create({
    data: {
      code: 'UK_SHIFT',
      name: 'UK Evening Shift',
      startTime: '14:00',
      endTime: '23:00',
      timezone: 'IST (UTC+5:30)',
      description: 'UK/EMEA Evening Coverage (14:00 - 23:00 IST)',
      defaultRate: 150.0,
    },
  });
  const nocShift = await prisma.shiftType.create({
    data: {
      code: 'NOC_24X7',
      name: '24x7 NOC Rotational',
      startTime: 'Rotational',
      endTime: 'Rotational',
      timezone: 'IST (UTC+5:30)',
      description: '24x7 Tier-1/2 Operations Rotational Shifts',
      defaultRate: 250.0,
    },
  });

  // 7. Initial Billing Configuration (Version 1)
  const billingConfig = await prisma.billingConfiguration.create({
    data: {
      versionNumber: 1,
      effectiveFrom: new Date('2026-01-01'),
      fxRateInrUsd: 90.0,
      variablePayRatePercent: 5.0, // 5% flat variable pay
      operationalMarginPercent: 30.0, // 30% ops margin
      facilityCostUsdMonthly: 500.0, // $6,000 annual
      userBundleCostUsdMonthly: 0.0,
      shiftAllowanceGeneralUsd: 0.0,
      shiftAllowanceUsShiftUsd: 200.0,
      shiftAllowanceUkShiftUsd: 150.0,
      shiftAllowance24x7NocUsd: 250.0,
      isCurrent: true,
      createdBy: hrManagerUser.email,
    },
  });

  // 8. Sample Workforce Records
  const employeesData = [
    {
      employeeId: 'IN01806551',
      employeeName: 'Nimmi K Cherian',
      oraclePersonNumber: '2130101',
      assignmentStatus: 'Active',
      gender: 'Female',
      engagementType: 'GCC',
      employmentCategory: 'Full Time',
      gccPresence: true,
      hgvRole: 'ETL/SQL QA',
      hgvDepartment: 'Quality Assurance',
      domainLeadId: leads[0].id, // Jeff Chu
      reportingManager: 'Sue Pawa',
      businessUnit: 'Hospitality Tech',
      practice: 'Data & Analytics',
      gradeLevel: 'L4',
      sourceId: sources[0].id,
      hgvStartDate: new Date('2026-08-01'),
      shiftTypeId: generalShift.id,
      fixedCtc: 2600000,
      variableMode: 'FLAT_PERCENT',
      variablePct: 5.0,
      joiningBonus: 150000, // Amortized over 3 months -> 50,000 INR/mo
      baseLocation: 'Hyderabad',
    },
    {
      employeeId: 'IN01806552',
      employeeName: 'Radha Subramanian',
      oraclePersonNumber: '2130102',
      assignmentStatus: 'Active',
      gender: 'Female',
      engagementType: 'GCC',
      employmentCategory: 'Full Time',
      gccPresence: true,
      hgvRole: 'IT Quality Analyst',
      hgvDepartment: 'Quality Assurance',
      domainLeadId: leads[0].id, // Jeff Chu
      reportingManager: 'Sue Pawa',
      businessUnit: 'Hospitality Tech',
      practice: 'QA',
      gradeLevel: 'L3',
      sourceId: sources[4].id,
      hgvStartDate: new Date('2026-08-10'),
      shiftTypeId: usShift.id,
      fixedCtc: 1950000,
      variableMode: 'FLAT_PERCENT',
      variablePct: 5.0,
      joiningBonus: 0,
      baseLocation: 'Hyderabad',
    },
    {
      employeeId: 'IN01806553',
      employeeName: 'Karthik Raman',
      oraclePersonNumber: '2130103',
      assignmentStatus: 'Active',
      gender: 'Male',
      engagementType: 'GCC',
      employmentCategory: 'Full Time',
      gccPresence: true,
      hgvRole: 'Senior Cloud Engineer',
      hgvDepartment: 'Cloud Infrastructure',
      domainLeadId: leads[1].id, // Sue Pawa
      reportingManager: 'Jeff Chu',
      businessUnit: 'Infrastructure',
      practice: 'DevOps & SRE',
      gradeLevel: 'L5',
      sourceId: sources[1].id,
      hgvStartDate: new Date('2026-06-15'),
      shiftTypeId: generalShift.id,
      fixedCtc: 3200000,
      variableMode: 'CUSTOM_AMOUNT',
      variableCustom: 25000, // 25,000 INR monthly custom
      joiningBonus: 300000,
      baseLocation: 'Bangalore',
    },
    {
      employeeId: 'IN01806554',
      employeeName: 'Ananya Deshmukh',
      oraclePersonNumber: '2130104',
      assignmentStatus: 'Active',
      gender: 'Female',
      engagementType: 'NOC',
      employmentCategory: 'Full Time',
      gccPresence: true,
      hgvRole: 'NOC Incident Lead',
      hgvDepartment: 'Global Operations',
      domainLeadId: leads[2].id, // Michael Chang
      reportingManager: 'Michael Chang',
      businessUnit: 'IT Operations',
      practice: 'Command Center',
      gradeLevel: 'L4',
      sourceId: sources[2].id,
      hgvStartDate: new Date('2026-07-01'),
      shiftTypeId: nocShift.id,
      fixedCtc: 2400000,
      variableMode: 'NONE',
      joiningBonus: 90000,
      baseLocation: 'Hyderabad',
    },
    {
      employeeId: null, // Rebadge has optional Employee ID
      employeeName: 'Marcus Vance',
      oraclePersonNumber: 'RB-9021',
      assignmentStatus: 'Active',
      gender: 'Male',
      engagementType: 'Rebadge',
      employmentCategory: 'Rebadge',
      gccPresence: true,
      hgvRole: 'ERP Functional Specialist',
      hgvDepartment: 'Finance Systems',
      domainLeadId: leads[3].id, // Priya Sharma
      reportingManager: 'Priya Sharma',
      businessUnit: 'Enterprise Apps',
      practice: 'Oracle Cloud',
      gradeLevel: 'L4',
      sourceId: sources[2].id,
      hgvStartDate: new Date('2026-05-01'),
      shiftTypeId: generalShift.id,
      fixedCtc: 0,
      variableMode: 'NONE',
      joiningBonus: 0,
      baseLocation: 'Hyderabad',
    },
    {
      employeeId: null, // Colocation has optional Employee ID
      employeeName: 'Elena Rostova',
      oraclePersonNumber: 'COL-4412',
      assignmentStatus: 'Active',
      gender: 'Female',
      engagementType: 'Colocation',
      employmentCategory: 'Colocation',
      gccPresence: true,
      hgvRole: 'Network Engineer',
      hgvDepartment: 'Network Services',
      domainLeadId: leads[2].id, // Michael Chang
      reportingManager: 'Michael Chang',
      businessUnit: 'Infrastructure',
      practice: 'Core Networks',
      gradeLevel: 'L3',
      sourceId: sources[2].id,
      hgvStartDate: new Date('2026-04-15'),
      shiftTypeId: generalShift.id,
      fixedCtc: 0,
      variableMode: 'NONE',
      joiningBonus: 0,
      baseLocation: 'Hyderabad',
    },
    {
      employeeId: 'IN01806557',
      employeeName: 'Vikramaditya Roy',
      oraclePersonNumber: '2130107',
      assignmentStatus: 'Active',
      gender: 'Male',
      engagementType: 'Non-GCC',
      employmentCategory: 'C2C Consultant',
      gccPresence: false,
      hgvRole: 'Security Architect',
      hgvDepartment: null,
      domainLeadId: leads[4].id, // David Wilson
      reportingManager: 'David Wilson',
      project: 'HGV Core PCI DSS Remediation', // Required for Non-GCC
      sourceId: sources[2].id,
      hgvStartDate: new Date('2026-03-01'),
      shiftTypeId: null,
      fixedCtc: 0,
      variableMode: 'NONE',
      joiningBonus: 0,
      baseLocation: 'Mumbai',
    },
    {
      employeeId: 'IN01806558',
      employeeName: 'Sunita Rao',
      oraclePersonNumber: '2130108',
      assignmentStatus: 'Inactive',
      gender: 'Female',
      engagementType: 'GCC',
      employmentCategory: 'Full Time',
      gccPresence: true,
      hgvRole: 'Data Engineer',
      hgvDepartment: 'Data & Analytics',
      domainLeadId: leads[0].id, // Jeff Chu
      reportingManager: 'Jeff Chu',
      businessUnit: 'Hospitality Tech',
      practice: 'Data Lake',
      gradeLevel: 'L3',
      sourceId: sources[0].id,
      hgvStartDate: new Date('2026-01-10'),
      hgvEndDate: new Date('2026-07-31'),
      shiftTypeId: generalShift.id,
      fixedCtc: 2100000,
      variableMode: 'FLAT_PERCENT',
      variablePct: 5.0,
      joiningBonus: 0,
      baseLocation: 'Hyderabad',
      isAttrition: true,
      attritionReason: 'Relocation abroad',
      attritionDate: new Date('2026-07-31'),
    },
  ];

  for (const empData of employeesData) {
    const emp = await prisma.employee.create({
      data: {
        employeeId: empData.employeeId,
        employeeName: empData.employeeName,
        oraclePersonNumber: empData.oraclePersonNumber,
        assignmentStatus: empData.assignmentStatus,
        gender: empData.gender,
        engagementType: empData.engagementType,
        employmentCategory: empData.employmentCategory,
        gccPresence: empData.gccPresence,
        hgvRole: empData.hgvRole,
        hgvDepartment: empData.hgvDepartment,
        domainLeadId: empData.domainLeadId,
        reportingManager: empData.reportingManager,
        businessUnit: empData.businessUnit,
        practice: empData.practice,
        gradeLevel: empData.gradeLevel,
        project: empData.project,
        sourceId: empData.sourceId,
        hgvStartDate: empData.hgvStartDate,
        hgvEndDate: empData.hgvEndDate,
        shiftTypeId: empData.shiftTypeId,
      },
    });

    // Compensation
    if (empData.engagementType === 'GCC' || empData.engagementType === 'NOC') {
      await prisma.employeeCompensation.create({
        data: {
          employeeId: emp.id,
          effectiveFrom: empData.hgvStartDate || new Date('2026-01-01'),
          fixedCtcInrAnnual: empData.fixedCtc,
          variablePayMode: empData.variableMode,
          variablePayPercent: empData.variablePct || null,
          variablePayCustomInrMonthly: empData.variableCustom || null,
          joiningBonusInr: empData.joiningBonus,
        },
      });
    }

    // Contact
    await prisma.employeeContact.create({
      data: {
        employeeId: emp.id,
        personalEmail: `${empData.employeeName.toLowerCase().replace(/[^a-z]/g, '.')}@gmail.com`,
        hgvEmail: `${empData.employeeName.toLowerCase().replace(/[^a-z]/g, '.')}@hgv.com`,
        mobile: '+91 98765 ' + Math.floor(10000 + Math.random() * 90000),
        emergencyContactName: 'Family Contact',
        emergencyContactPhone: '+91 91234 ' + Math.floor(10000 + Math.random() * 90000),
        qualification: 'Bachelor of Technology (B.Tech)',
      },
    });

    // Address
    await prisma.employeeAddress.create({
      data: {
        employeeId: emp.id,
        baseLocation: empData.baseLocation,
        currentAddress: `${empData.baseLocation}, India`,
        permanentAddress: `${empData.baseLocation}, India`,
      },
    });

    // Documents (Masked in views)
    await prisma.employeeDocument.create({
      data: {
        employeeId: emp.id,
        documentType: 'PAN',
        documentNumber: 'ABCDE' + Math.floor(1000 + Math.random() * 9000) + 'F',
      },
    });
    await prisma.employeeDocument.create({
      data: {
        employeeId: emp.id,
        documentType: 'Aadhar',
        documentNumber: 'XXXX-XXXX-' + Math.floor(1000 + Math.random() * 9000),
      },
    });

    // Attrition if applicable
    if (empData.isAttrition) {
      await prisma.employeeAttrition.create({
        data: {
          employeeId: emp.id,
          attritionReason: empData.attritionReason,
          attritionDate: empData.attritionDate,
          notes: 'Completed exit interview and handover process.',
        },
      });
    }
  }

  // 9. Sample PMO Shift Allowance Override
  // Give Radha Subramanian a PMO validated override for 2026-08 of $240.00 (overriding default $200)
  const radha = await prisma.employee.findFirst({ where: { employeeName: 'Radha Subramanian' } });
  if (radha) {
    await prisma.shiftAllowanceOverride.create({
      data: {
        employeeId: radha.id,
        billingMonth: '2026-08',
        validatedAmountUsd: 240.0,
        validationStatus: 'VALIDATED',
        validatedBy: 'PMO_Validation_Aug26',
      },
    });
  }

  // 10. Audit log for seeding
  await prisma.auditEvent.create({
    data: {
      actorEmail: 'system@hgv.com',
      actorRole: 'SYSTEM',
      action: 'CREATE',
      entityType: 'USER',
      description: 'System initialization and master reference data seeded.',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
