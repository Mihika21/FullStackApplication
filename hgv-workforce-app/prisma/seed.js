const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HGV Workforce database...');

  // 1. Clean existing records if any
  await prisma.roleRequirementLine.deleteMany();
  await prisma.roleRequirementProfile.deleteMany();
  await prisma.projectAllocation.deleteMany();
  await prisma.project.deleteMany();
  await prisma.employeeCertification.deleteMany();
  await prisma.employeeSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.skillCategory.deleteMany();
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

  // 10. Skill Categories & Skills Taxonomy (BRD Section 5.1 & Starter Workbook)
  console.log('Seeding Skill Matrix taxonomy, role profiles, and allocations...');
  const catProg = await prisma.skillCategory.create({
    data: { name: 'Programming', description: 'Core software engineering and application development languages', sortOrder: 1 },
  });
  const catCloud = await prisma.skillCategory.create({
    data: { name: 'Cloud', description: 'Cloud infrastructure, hosting platforms, and DevOps tooling', sortOrder: 2 },
  });
  const catData = await prisma.skillCategory.create({
    data: { name: 'Data & AI', description: 'Data platforms, databases, pipelines, analytics and machine learning', sortOrder: 3 },
  });
  const catTesting = await prisma.skillCategory.create({
    data: { name: 'Testing', description: 'Quality assurance, test automation frameworks and performance testing', sortOrder: 4 },
  });
  const catDomain = await prisma.skillCategory.create({
    data: { name: 'Domain Knowledge', description: 'Industry and business domain functional expertise', sortOrder: 5 },
  });
  const catSoft = await prisma.skillCategory.create({
    data: { name: 'Soft Skills', description: 'Behavioural, leadership, communication and stakeholder management competencies', sortOrder: 6 },
  });

  const skillsData = [
    { code: 'SK001', name: 'Python', categoryId: catProg.id, type: 'Technical', synonyms: 'Python, py, Python3' },
    { code: 'SK002', name: 'SQL', categoryId: catData.id, type: 'Technical', synonyms: 'SQL, PostgreSQL, T-SQL, MySQL' },
    { code: 'SK003', name: 'Azure', categoryId: catCloud.id, type: 'Technical', synonyms: 'Azure, Microsoft Azure, Cloud' },
    { code: 'SK004', name: 'Data Engineering', categoryId: catData.id, type: 'Technical', synonyms: 'ETL, Data Pipelines, Spark, Airflow' },
    { code: 'SK005', name: 'Machine Learning', categoryId: catData.id, type: 'Technical', synonyms: 'ML, AI, Scikit-learn, PyTorch, LLMs' },
    { code: 'SK006', name: 'Java', categoryId: catProg.id, type: 'Technical', synonyms: 'Java, Spring, Spring Boot' },
    { code: 'SK007', name: 'React', categoryId: catProg.id, type: 'Technical', synonyms: 'React, ReactJS, Next.js, Frontend' },
    { code: 'SK008', name: 'Test Automation', categoryId: catTesting.id, type: 'Technical', synonyms: 'Selenium, Cypress, Playwright, QA Automation' },
    { code: 'SK009', name: 'DevOps / CI-CD', categoryId: catCloud.id, type: 'Technical', synonyms: 'DevOps, CI/CD, Docker, Kubernetes, Terraform' },
    { code: 'SK010', name: 'Domain: Hospitality', categoryId: catDomain.id, type: 'Functional', synonyms: 'Hospitality, Timeshare, Reservations, PMS' },
    { code: 'SK011', name: 'Stakeholder Mgmt', categoryId: catSoft.id, type: 'Behavioural', synonyms: 'Stakeholder Management, Client Engagement' },
    { code: 'SK012', name: 'Mentoring', categoryId: catSoft.id, type: 'Behavioural', synonyms: 'Mentorship, Tech Coaching, Team Lead' },
  ];

  const seededSkills = {};
  for (const s of skillsData) {
    const createdSkill = await prisma.skill.create({ data: s });
    seededSkills[s.name] = createdSkill;
  }

  // 11. Role Requirement Profiles & Lines (BRD Section 5.5)
  const roleProfiles = [
    {
      roleName: 'Senior Data Engineer',
      department: 'Data & Analytics',
      lines: [
        { skill: 'Python', level: 4, importance: 'MUST_HAVE' },
        { skill: 'SQL', level: 5, importance: 'MUST_HAVE' },
        { skill: 'Azure', level: 4, importance: 'MUST_HAVE' },
        { skill: 'Data Engineering', level: 5, importance: 'MUST_HAVE' },
        { skill: 'Stakeholder Mgmt', level: 3, importance: 'GOOD_TO_HAVE' },
        { skill: 'Mentoring', level: 3, importance: 'GOOD_TO_HAVE' },
      ],
    },
    {
      roleName: 'ETL/SQL QA',
      department: 'Quality Assurance',
      lines: [
        { skill: 'SQL', level: 4, importance: 'MUST_HAVE' },
        { skill: 'Test Automation', level: 4, importance: 'MUST_HAVE' },
        { skill: 'Python', level: 3, importance: 'GOOD_TO_HAVE' },
        { skill: 'Data Engineering', level: 3, importance: 'GOOD_TO_HAVE' },
      ],
    },
    {
      roleName: 'IT Quality Analyst',
      department: 'Quality Assurance',
      lines: [
        { skill: 'SQL', level: 3, importance: 'MUST_HAVE' },
        { skill: 'Test Automation', level: 4, importance: 'MUST_HAVE' },
        { skill: 'DevOps / CI-CD', level: 3, importance: 'GOOD_TO_HAVE' },
      ],
    },
    {
      roleName: 'Senior Cloud Engineer',
      department: 'Cloud Infrastructure',
      lines: [
        { skill: 'Azure', level: 5, importance: 'MUST_HAVE' },
        { skill: 'DevOps / CI-CD', level: 5, importance: 'MUST_HAVE' },
        { skill: 'Python', level: 3, importance: 'GOOD_TO_HAVE' },
        { skill: 'Mentoring', level: 3, importance: 'GOOD_TO_HAVE' },
      ],
    },
    {
      roleName: 'NOC Incident Lead',
      department: 'Global Operations',
      lines: [
        { skill: 'DevOps / CI-CD', level: 4, importance: 'MUST_HAVE' },
        { skill: 'Stakeholder Mgmt', level: 4, importance: 'MUST_HAVE' },
        { skill: 'Mentoring', level: 3, importance: 'GOOD_TO_HAVE' },
        { skill: 'Domain: Hospitality', level: 3, importance: 'GOOD_TO_HAVE' },
      ],
    },
    {
      roleName: 'ERP Functional Specialist',
      department: 'Finance Systems',
      lines: [
        { skill: 'Domain: Hospitality', level: 4, importance: 'MUST_HAVE' },
        { skill: 'Stakeholder Mgmt', level: 4, importance: 'MUST_HAVE' },
        { skill: 'SQL', level: 3, importance: 'GOOD_TO_HAVE' },
      ],
    },
  ];

  for (const rp of roleProfiles) {
    const profile = await prisma.roleRequirementProfile.create({
      data: {
        roleName: rp.roleName,
        department: rp.department,
        description: `Standard competency profile for ${rp.roleName}`,
      },
    });

    for (const line of rp.lines) {
      if (seededSkills[line.skill]) {
        await prisma.roleRequirementLine.create({
          data: {
            profileId: profile.id,
            skillId: seededSkills[line.skill].id,
            minimumLevel: line.level,
            importance: line.importance,
          },
        });
      }
    }
  }

  // 12. Seed Employee Skills (0-5 scale) matching Starter Workbook
  const allEmployees = await prisma.employee.findMany();
  const empByName = {};
  for (const emp of allEmployees) {
    empByName[emp.employeeName] = emp;
  }

  const sampleRatings = [
    {
      name: 'Nimmi K Cherian',
      ratings: {
        'Python': { self: 4, val: 4, yrs: 5.5 },
        'SQL': { self: 5, val: 4, yrs: 6.0 },
        'Azure': { self: 3, val: 3, yrs: 3.0 },
        'Data Engineering': { self: 4, val: 4, yrs: 4.5 },
        'Machine Learning': { self: 2, val: 2, yrs: 1.5 },
        'Test Automation': { self: 3, val: 3, yrs: 2.0 },
        'Domain: Hospitality': { self: 3, val: 3, yrs: 2.0 },
        'Stakeholder Mgmt': { self: 3, val: 3, yrs: 3.0 },
      },
      allocations: [
        { project: 'HGV Core Data Platform', role: 'Lead QA Engineer', pct: 0.8, status: 'CONFIRMED' },
      ],
      certifications: [
        { name: 'Azure Data Engineer Associate', certId: 'AZ-DE-99210', issuer: 'Microsoft', status: 'Expiring soon', issueDate: new Date('2025-03-15'), expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
      ],
    },
    {
      name: 'Radha Subramanian',
      ratings: {
        'SQL': { self: 3, val: 3, yrs: 3.5 },
        'Test Automation': { self: 5, val: 5, yrs: 5.0 },
        'DevOps / CI-CD': { self: 3, val: 3, yrs: 2.5 },
        'Python': { self: 3, val: 3, yrs: 3.0 },
        'Domain: Hospitality': { self: 2, val: 2, yrs: 1.0 },
        'Stakeholder Mgmt': { self: 2, val: 2, yrs: 2.0 },
      },
      allocations: [
        { project: 'Hospitality Tech QA Suite', role: 'IT Quality Analyst', pct: 0.6, status: 'CONFIRMED' },
        { project: 'Mobile App Automation Upgrade', role: 'Automation Specialist', pct: 0.3, status: 'DRAFT' },
      ],
      certifications: [
        { name: 'ISTQB Certified Tester Foundation', certId: 'ISTQB-CTFL-4819', issuer: 'ISTQB', status: 'Valid', issueDate: new Date('2024-01-10'), expiryDate: null },
      ],
    },
    {
      name: 'Karthik Raman',
      ratings: {
        'Azure': { self: 5, val: 5, yrs: 7.0 },
        'DevOps / CI-CD': { self: 5, val: 5, yrs: 6.5 },
        'Python': { self: 3, val: 3, yrs: 4.0 },
        'SQL': { self: 2, val: 2, yrs: 2.0 },
        'Domain: Hospitality': { self: 1, val: 1, yrs: 0.5 },
        'Stakeholder Mgmt': { self: 3, val: 3, yrs: 4.0 },
        'Mentoring': { self: 3, val: 3, yrs: 3.5 },
      },
      allocations: [
        { project: 'HGV Cloud Migration', role: 'Lead DevOps Architect', pct: 0.9, status: 'CONFIRMED' },
      ],
      certifications: [
        { name: 'Azure Solutions Architect Expert', certId: 'MSFT-AZ-305-8812', issuer: 'Microsoft', status: 'Expired', issueDate: new Date('2024-06-01'), expiryDate: new Date('2026-06-01') },
        { name: 'Certified Kubernetes Administrator (CKA)', certId: 'CKA-9812401', issuer: 'Cloud Native Computing Foundation', status: 'Valid', issueDate: new Date('2025-10-15'), expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      ],
    },
    {
      name: 'Ananya Deshmukh',
      ratings: {
        'DevOps / CI-CD': { self: 4, val: 4, yrs: 4.0 },
        'Stakeholder Mgmt': { self: 4, val: 4, yrs: 5.0 },
        'Mentoring': { self: 3, val: 3, yrs: 3.0 },
        'Domain: Hospitality': { self: 3, val: 3, yrs: 2.0 },
        'Python': { self: 2, val: 2, yrs: 1.5 },
        'SQL': { self: 2, val: 2, yrs: 1.0 },
      },
      allocations: [
        { project: 'NOC Command Center 24x7', role: 'Incident Commander', pct: 1.0, status: 'CONFIRMED' },
      ],
      certifications: [
        { name: 'ITIL v4 Managing Professional', certId: 'ITIL-MP-41029', issuer: 'AXELOS', status: 'Valid', issueDate: new Date('2024-05-12'), expiryDate: null },
      ],
    },
    {
      name: 'Marcus Vance',
      ratings: {
        'Domain: Hospitality': { self: 4, val: 4, yrs: 8.0 },
        'Stakeholder Mgmt': { self: 4, val: 4, yrs: 7.0 },
        'SQL': { self: 3, val: 3, yrs: 4.0 },
        'Mentoring': { self: 3, val: 3, yrs: 4.0 },
      },
      allocations: [
        { project: 'Oracle Financials Rebadge Support', role: 'Lead Functional Specialist', pct: 0.5, status: 'CONFIRMED' },
      ],
      certifications: [
        { name: 'Oracle Cloud Infrastructure Financials Certified Specialist', certId: '1Z0-1054-991', issuer: 'Oracle', status: 'Valid', issueDate: new Date('2025-08-10'), expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000) },
      ],
    },
  ];

  for (const sr of sampleRatings) {
    const emp = empByName[sr.name];
    if (!emp) continue;

    for (const [skillName, ratingInfo] of Object.entries(sr.ratings)) {
      const skill = seededSkills[skillName];
      if (!skill) continue;

      await prisma.employeeSkill.create({
        data: {
          employeeId: emp.id,
          skillId: skill.id,
          selfRating: ratingInfo.self,
          validatedRating: ratingInfo.val,
          yearsOfExperience: ratingInfo.yrs,
          ratingSource: 'MANAGER',
          validatedBy: 'Jeff Chu (Domain Lead)',
          validatedAt: new Date(),
        },
      });
    }

    // Certifications
    if (sr.certifications) {
      for (const cert of sr.certifications) {
        await prisma.employeeCertification.create({
          data: {
            employeeId: emp.id,
            name: cert.name,
            certificationId: cert.certId,
            issuingBody: cert.issuer,
            status: cert.status,
            issueDate: cert.issueDate,
            expiryDate: cert.expiryDate,
            verified: true,
          },
        });
      }
    }

    // Allocations
    if (sr.allocations) {
      for (const alloc of sr.allocations) {
        const proj = await prisma.project.upsert({
          where: { name: alloc.project },
          update: {},
          create: {
            name: alloc.project,
            status: 'ACTIVE',
          },
        });
        await prisma.projectAllocation.create({
          data: {
            employeeId: emp.id,
            projectId: proj.id,
            projectName: alloc.project,
            projectRole: alloc.role,
            allocationPct: alloc.pct,
            status: alloc.status,
            proposedBy: 'hr.manager@hgv.com',
            confirmedBy: alloc.status === 'CONFIRMED' ? 'Jeff Chu' : null,
          },
        });
      }
    }
  }

  // 13. Audit log for seeding
  await prisma.auditEvent.create({
    data: {
      actorEmail: 'system@hgv.com',
      actorRole: 'SYSTEM',
      action: 'CREATE',
      entityType: 'USER',
      description: 'System initialization, master reference data, and Skill Matrix seeded.',
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
