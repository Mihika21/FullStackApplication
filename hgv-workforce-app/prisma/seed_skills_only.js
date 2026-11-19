const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Skill Matrix taxonomy, role profiles, and allocations safely...');

  await prisma.roleRequirementLine.deleteMany();
  await prisma.roleRequirementProfile.deleteMany();
  await prisma.employeeSkill.deleteMany();
  await prisma.employeeCertification.deleteMany();
  await prisma.projectAllocation.deleteMany();
  await prisma.project.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.skillCategory.deleteMany();

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

  await prisma.auditEvent.create({
    data: {
      actorEmail: 'system@hgv.com',
      actorRole: 'SYSTEM',
      action: 'SEED_SKILLS',
      entityType: 'SKILLS',
      description: 'Skill Matrix taxonomy seeded',
    },
  });


  console.log('Skill Matrix seeded successfully!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
