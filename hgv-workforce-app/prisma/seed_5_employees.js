const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

function computeCertificateHash(certificateNumber, userEmail, courseTitle, issuedAt) {
  const payload = `${certificateNumber}|${userEmail.toLowerCase().trim()}|${courseTitle.trim()}|${new Date(issuedAt).toISOString()}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function generateCertNumber(courseSlug, index) {
  const prefix = courseSlug.toUpperCase().slice(0, 5).replace(/[^A-Z]/g, "X");
  return `CERT-2026-${prefix}-900${index}`;
}

async function main() {
  console.log("=========================================================");
  console.log(" Seeding 5 Configured Employees across Workforce, Skill Matrix, & LMS");
  console.log("=========================================================");

  // 1. Fetch Reference Metadata
  const domainLead = await prisma.domainLead.findFirst({ where: { name: "Jeff Chu" } });
  if (!domainLead) throw new Error("Domain Lead Jeff Chu not found");

  const directSource = await prisma.source.findFirst({ where: { name: "Direct Hire" } });
  const referralSource = await prisma.source.findFirst({ where: { name: "Referral" } }) || directSource;

  const generalShift = await prisma.shiftType.findFirst({ where: { code: "GENERAL" } });
  const nocShift = await prisma.shiftType.findFirst({ where: { code: "NOC_24X7" } });

  const learnerRole = await prisma.role.findFirst({ where: { code: "HR_TEAM_MEMBER" } });

  // Skills
  const allSkills = await prisma.skill.findMany();
  const skillMap = {};
  allSkills.forEach((s) => {
    skillMap[s.name] = s.id;
  });

  // Projects
  const cloudProj = await prisma.project.findFirst({ where: { code: "PRJ-004" } }); // Cloud Migration
  const dataProj = await prisma.project.findFirst({ where: { code: "PRJ-001" } });  // Core Data Platform
  const nocProj = await prisma.project.findFirst({ where: { code: "PRJ-005" } });   // NOC Command Center 24x7
  const qaProj = await prisma.project.findFirst({ where: { code: "PRJ-002" } });    // Hospitality Tech QA Suite

  // Courses
  const cyberCourse = await prisma.lmsCourse.findFirst({ where: { slug: "annual-cybersecurity-awareness-2027" } });
  const poshCourse = await prisma.lmsCourse.findFirst({ where: { slug: "anti-harassment-posh-compliance" } });
  const gdprCourse = await prisma.lmsCourse.findFirst({ where: { slug: "global-data-privacy-gdpr-ccpa" } });
  const oshaCourse = await prisma.lmsCourse.findFirst({ where: { slug: "workplace-health-safety-osha" } });
  const leadCourse = await prisma.lmsCourse.findFirst({ where: { slug: "enterprise-leadership-people-mgmt" } });

  const employeesData = [
    // ----------------------------------------------------
    // Employee 1: Aanya Sen (100% Exemplary Certified)
    // ----------------------------------------------------
    {
      index: 1,
      employeeId: "IN01809001",
      employeeName: "Aanya Sen",
      oraclePersonNumber: "OPN9001",
      gender: "Female",
      engagementType: "GCC",
      employmentCategory: "Full Time",
      hgvRole: "Lead Cloud Solutions Architect",
      hgvDepartment: "Cloud & Platform Engineering",
      practice: "Cloud Architecture",
      subPractice: "AWS / Azure Cloud",
      gradeLevel: "L5",
      employeeGroup: "Core Engineering",
      sourceId: directSource.id,
      shiftTypeId: generalShift.id,
      dateOfJoining: new Date("2024-03-15"),
      hgvStartDate: new Date("2024-03-15"),
      email: "aanya.sen@hgv.com",
      personalEmail: "aanya.sen.cloud@gmail.com",
      mobile: "+91 98450 12001",
      emergencyContactName: "Vikram Sen",
      emergencyContactPhone: "+91 98450 12099",
      qualification: "M.Tech in Computer Science",
      bloodGroup: "O+",
      maritalStatus: "Married",
      baseLocation: "Bangalore - GCC Tech Park",
      currentAddress: "402, Prestige Palms, Whitefield, Bangalore, Karnataka 560066",
      fixedCtc: 3600000,
      variablePayMode: "FLAT_PERCENT",
      variablePayPercent: 10.0,
      // Skill Ratings
      skills: [
        { name: "Azure", rating: 5, years: 7.5, comment: "Enterprise Multi-Region Cloud Architect" },
        { name: "DevOps / CI-CD", rating: 4, years: 6.0, comment: "Terraform & Azure DevOps pipelines" },
        { name: "Python", rating: 4, years: 5.5, comment: "Cloud Automation & Serverless Functions" },
        { name: "SQL", rating: 3, years: 4.0, comment: "Relational DB modeling & Azure SQL" },
        { name: "Mentoring", rating: 4, years: 4.0, comment: "Coaches cloud engineers & architects" },
      ],
      // Project Allocation
      allocation: {
        projectId: cloudProj?.id,
        projectName: cloudProj?.name || "HGV Cloud Migration",
        projectRole: "Lead Cloud Architect",
        allocationPct: 1.0,
      },
      // Certification
      certification: {
        name: "AWS Certified Solutions Architect - Professional",
        certificationId: "CERT-AWS-SAP-9001",
        issuingBody: "Amazon Web Services",
      },
      // LMS Profile
      compliancePersona: "100% Exemplary Certified",
      enrollments: [
        { course: cyberCourse, status: "COMPLETED", progress: 100, score: 100, completedDaysAgo: 45, cert: true },
        { course: poshCourse, status: "COMPLETED", progress: 100, score: 100, completedDaysAgo: 40, cert: true },
        { course: gdprCourse, status: "COMPLETED", progress: 100, score: 100, completedDaysAgo: 35, cert: true },
        { course: oshaCourse, status: "COMPLETED", progress: 100, score: 100, completedDaysAgo: 30, cert: true },
        { course: leadCourse, status: "IN_PROGRESS", progress: 50, score: null, dueInDays: 30, cert: false },
      ],
    },

    // ----------------------------------------------------
    // Employee 2: Rohan Deshmukh (Active In-Progress Learner)
    // ----------------------------------------------------
    {
      index: 2,
      employeeId: "IN01809002",
      employeeName: "Rohan Deshmukh",
      oraclePersonNumber: "OPN9002",
      gender: "Male",
      engagementType: "GCC",
      employmentCategory: "Full Time",
      hgvRole: "Senior Full Stack Software Engineer",
      hgvDepartment: "Software Engineering",
      practice: "Full Stack Development",
      subPractice: "React / Node / Next.js",
      gradeLevel: "L4",
      employeeGroup: "Core Engineering",
      sourceId: directSource.id,
      shiftTypeId: generalShift.id,
      dateOfJoining: new Date("2025-01-10"),
      hgvStartDate: new Date("2025-01-10"),
      email: "rohan.deshmukh@hgv.com",
      personalEmail: "rohan.deshmukh.dev@gmail.com",
      mobile: "+91 98450 12002",
      emergencyContactName: "Neha Deshmukh",
      emergencyContactPhone: "+91 98450 12098",
      qualification: "B.E. in Information Technology",
      bloodGroup: "B+",
      maritalStatus: "Married",
      baseLocation: "Bangalore - GCC Tech Park",
      currentAddress: "B-104, Sobha Silicon Oasis, Hosa Road, Bangalore 560100",
      fixedCtc: 2800000,
      variablePayMode: "FLAT_PERCENT",
      variablePayPercent: 8.0,
      // Skill Ratings
      skills: [
        { name: "React", rating: 5, years: 6.0, comment: "React 18+, Next.js, TypeScript, Tailwind" },
        { name: "Java", rating: 4, years: 5.0, comment: "Spring Boot microservices & REST APIs" },
        { name: "SQL", rating: 4, years: 5.0, comment: "PostgreSQL, query tuning, indexing" },
        { name: "Python", rating: 3, years: 3.0, comment: "Scripting and API test harnesses" },
        { name: "Stakeholder Mgmt", rating: 3, years: 2.5, comment: "Sprint demos and product syncs" },
      ],
      // Project Allocation (80% allocation, 20% capacity)
      allocation: {
        projectId: dataProj?.id,
        projectName: dataProj?.name || "HGV Core Data Platform",
        projectRole: "Senior Frontend & API Engineer",
        allocationPct: 0.8,
      },
      // Certification
      certification: {
        name: "Meta Certified Senior Frontend Engineer",
        certificationId: "CERT-META-FE-9002",
        issuingBody: "Meta / Coursera",
      },
      // LMS Profile
      compliancePersona: "Active In-Progress Learner",
      enrollments: [
        { course: cyberCourse, status: "COMPLETED", progress: 100, score: 92, completedDaysAgo: 15, cert: true },
        { course: poshCourse, status: "IN_PROGRESS", progress: 65, score: null, dueInDays: 14, cert: false },
        { course: gdprCourse, status: "ASSIGNED", progress: 0, score: null, dueInDays: 20, cert: false },
        { course: oshaCourse, status: "ASSIGNED", progress: 0, score: null, dueInDays: 25, cert: false },
      ],
    },

    // ----------------------------------------------------
    // Employee 3: Meera Krishnan (Overdue Compliance Alert)
    // ----------------------------------------------------
    {
      index: 3,
      employeeId: "IN01809003",
      employeeName: "Meera Krishnan",
      oraclePersonNumber: "OPN9003",
      gender: "Female",
      engagementType: "GCC",
      employmentCategory: "Full Time",
      hgvRole: "Staff Data & Machine Learning Engineer",
      hgvDepartment: "Data & Artificial Intelligence",
      practice: "Data Engineering",
      subPractice: "Big Data & Governance",
      gradeLevel: "L5",
      employeeGroup: "Core Engineering",
      sourceId: referralSource.id,
      shiftTypeId: generalShift.id,
      dateOfJoining: new Date("2024-08-01"),
      hgvStartDate: new Date("2024-08-01"),
      email: "meera.krishnan@hgv.com",
      personalEmail: "meera.k.ml@gmail.com",
      mobile: "+91 98450 12003",
      emergencyContactName: "Ramesh Krishnan",
      emergencyContactPhone: "+91 98450 12097",
      qualification: "M.S. in Data Science & Machine Learning",
      bloodGroup: "A+",
      maritalStatus: "Single",
      baseLocation: "Bangalore - GCC Tech Park",
      currentAddress: "Villa 12, Adarsh Palm Meadows, Varthur Road, Bangalore 560066",
      fixedCtc: 3400000,
      variablePayMode: "FLAT_PERCENT",
      variablePayPercent: 10.0,
      // Skill Ratings
      skills: [
        { name: "Python", rating: 5, years: 7.0, comment: "Advanced Pandas, PySpark, PyTorch" },
        { name: "SQL", rating: 5, years: 7.0, comment: "Complex analytical queries & data models" },
        { name: "Data Engineering", rating: 5, years: 6.5, comment: "ETL pipelines, Apache Airflow, Databricks" },
        { name: "Machine Learning", rating: 4, years: 4.5, comment: "Predictive modeling and feature stores" },
        { name: "Stakeholder Mgmt", rating: 4, years: 3.5, comment: "Business intelligence & executive presentations" },
      ],
      // Project Allocation (70% allocation, 30% capacity)
      allocation: {
        projectId: dataProj?.id,
        projectName: dataProj?.name || "HGV Core Data Platform",
        projectRole: "Staff Data Pipeline Architect",
        allocationPct: 0.7,
      },
      // Certification
      certification: {
        name: "Databricks Certified Data Engineer Professional",
        certificationId: "CERT-DBX-DEP-9003",
        issuingBody: "Databricks",
      },
      // LMS Profile (Overdue Cyber security demonstrates SLA escalation banner & nudges)
      compliancePersona: "Overdue Compliance Alert",
      enrollments: [
        { course: cyberCourse, status: "OVERDUE", progress: 20, score: null, dueDaysAgo: 5, cert: false },
        { course: gdprCourse, status: "COMPLETED", progress: 100, score: 95, completedDaysAgo: 20, cert: true },
        { course: poshCourse, status: "IN_PROGRESS", progress: 30, score: null, dueInDays: 10, cert: false },
        { course: oshaCourse, status: "ASSIGNED", progress: 0, score: null, dueInDays: 15, cert: false },
      ],
      nudge: {
        channel: "SLACK",
        message: "Compliance Alert: Annual Cybersecurity Awareness 2027 is 5 days overdue. Please complete the assessment today.",
      },
    },

    // ----------------------------------------------------
    // Employee 4: Vikramaditya Nair (T-30 Recertification Radar)
    // ----------------------------------------------------
    {
      index: 4,
      employeeId: "IN01809004",
      employeeName: "Vikramaditya Nair",
      oraclePersonNumber: "OPN9004",
      gender: "Male",
      engagementType: "NOC",
      employmentCategory: "Full Time",
      hgvRole: "24x7 NOC & SRE Lead",
      hgvDepartment: "Infrastructure & NOC",
      practice: "DevOps & Cloud Ops",
      subPractice: "Kubernetes & CI/CD",
      gradeLevel: "L4",
      employeeGroup: "Operations & NOC",
      sourceId: directSource.id,
      shiftTypeId: nocShift.id,
      dateOfJoining: new Date("2023-11-20"),
      hgvStartDate: new Date("2023-11-20"),
      email: "vikramaditya.nair@hgv.com",
      personalEmail: "vikram.nair.sre@gmail.com",
      mobile: "+91 98450 12004",
      emergencyContactName: "Ananya Nair",
      emergencyContactPhone: "+91 98450 12096",
      qualification: "B.Tech in Computer Engineering",
      bloodGroup: "AB+",
      maritalStatus: "Single",
      baseLocation: "Bangalore - GCC Tech Park",
      currentAddress: "Flat 502, Brigade Metropolis, Garudacharpalya, Bangalore 560048",
      fixedCtc: 2900000,
      variablePayMode: "FLAT_PERCENT",
      variablePayPercent: 8.0,
      // Skill Ratings
      skills: [
        { name: "DevOps / CI-CD", rating: 5, years: 6.5, comment: "Kubernetes CKA, Helm, ArgoCD, Prometheus" },
        { name: "Azure", rating: 4, years: 5.0, comment: "AKS cluster administration, VNet peering" },
        { name: "Python", rating: 3, years: 3.5, comment: "Automated alert healing and runbook scripts" },
        { name: "Test Automation", rating: 3, years: 3.0, comment: "Synthetic uptime and health check probes" },
        { name: "Mentoring", rating: 3, years: 3.0, comment: "Trains Tier-1 NOC analysts" },
      ],
      // Project Allocation (100% allocation)
      allocation: {
        projectId: nocProj?.id,
        projectName: nocProj?.name || "NOC Command Center 24x7",
        projectRole: "SRE Incident & Reliability Lead",
        allocationPct: 1.0,
      },
      // Certification
      certification: {
        name: "CKA - Certified Kubernetes Administrator",
        certificationId: "CERT-LF-CKA-9004",
        issuingBody: "Linux Foundation & CNCF",
      },
      // LMS Profile: Cyber certified 340 days ago, due for renewal in 25 days (T-30 radar)
      compliancePersona: "Recertification Lifecycle (T-30 Window)",
      enrollments: [
        { course: cyberCourse, status: "COMPLETED", progress: 100, score: 94, completedDaysAgo: 340, cert: true, isRecertRadar: true },
        { course: poshCourse, status: "COMPLETED", progress: 100, score: 100, completedDaysAgo: 60, cert: true },
        { course: gdprCourse, status: "COMPLETED", progress: 100, score: 92, completedDaysAgo: 50, cert: true },
        { course: oshaCourse, status: "COMPLETED", progress: 100, score: 96, completedDaysAgo: 45, cert: true },
      ],
    },

    // ----------------------------------------------------
    // Employee 5: Pooja Hegde (New Employee Onboarding)
    // ----------------------------------------------------
    {
      index: 5,
      employeeId: "IN01809005",
      employeeName: "Pooja Hegde",
      oraclePersonNumber: "OPN9005",
      gender: "Female",
      engagementType: "GCC",
      employmentCategory: "Full Time",
      hgvRole: "Lead QA Automation & Performance Engineer",
      hgvDepartment: "Quality Engineering & Testing",
      practice: "Testing",
      subPractice: "QA Automation & Performance",
      gradeLevel: "L4",
      employeeGroup: "Core Engineering",
      sourceId: directSource.id,
      shiftTypeId: generalShift.id,
      dateOfJoining: new Date("2026-11-01"), // Joined recently
      hgvStartDate: new Date("2026-11-01"),
      email: "pooja.hegde@hgv.com",
      personalEmail: "pooja.hegde.qa@gmail.com",
      mobile: "+91 98450 12005",
      emergencyContactName: "Sunil Hegde",
      emergencyContactPhone: "+91 98450 12095",
      qualification: "B.E. in Electronics & Communication",
      bloodGroup: "O-",
      maritalStatus: "Single",
      baseLocation: "Bangalore - GCC Tech Park",
      currentAddress: "Tower 3, Flat 1102, Salarpuria Sattva Magnificence, Bangalore 560068",
      fixedCtc: 2600000,
      variablePayMode: "FLAT_PERCENT",
      variablePayPercent: 7.0,
      // Skill Ratings
      skills: [
        { name: "Test Automation", rating: 5, years: 6.0, comment: "Playwright, Cypress, Selenium Grid" },
        { name: "Python", rating: 4, years: 4.5, comment: "PyTest, API test suites, load test scripts" },
        { name: "Java", rating: 3, years: 3.5, comment: "JUnit, RestAssured frameworks" },
        { name: "SQL", rating: 3, years: 3.0, comment: "Data validation and ETL verification" },
        { name: "Domain: Hospitality", rating: 4, years: 4.0, comment: "Hospitality booking and PMS testing" },
      ],
      // Project Allocation (90% allocation, 10% capacity)
      allocation: {
        projectId: qaProj?.id,
        projectName: qaProj?.name || "Hospitality Tech QA Suite",
        projectRole: "Automation Lead & Test Architect",
        allocationPct: 0.9,
      },
      // Certification
      certification: {
        name: "ISTQB Certified Advanced Technical Test Analyst",
        certificationId: "CERT-ISTQB-CTAL-9005",
        issuingBody: "ISTQB",
      },
      // LMS Profile: Freshly onboarded, 4 mandatory courses assigned with 30-day compliance clocks
      compliancePersona: "New Onboarding Compliance",
      enrollments: [
        { course: cyberCourse, status: "ASSIGNED", progress: 0, score: null, dueInDays: 13, cert: false },
        { course: poshCourse, status: "ASSIGNED", progress: 0, score: null, dueInDays: 13, cert: false },
        { course: gdprCourse, status: "ASSIGNED", progress: 0, score: null, dueInDays: 13, cert: false },
        { course: oshaCourse, status: "ASSIGNED", progress: 0, score: null, dueInDays: 13, cert: false },
      ],
    },
  ];

  for (const empData of employeesData) {
    console.log(`\nProcessing [${empData.index}/5] ${empData.employeeName} (${empData.employeeId})...`);

    // Clean any prior records for idempotence
    const existingEmp = await prisma.employee.findUnique({ where: { employeeId: empData.employeeId } });
    if (existingEmp) {
      await prisma.projectAllocation.deleteMany({ where: { employeeId: existingEmp.id } });
      await prisma.employeeSkill.deleteMany({ where: { employeeId: existingEmp.id } });
      await prisma.employeeCertification.deleteMany({ where: { employeeId: existingEmp.id } });
      await prisma.employeeCompensation.deleteMany({ where: { employeeId: existingEmp.id } });
      await prisma.employeeContact.deleteMany({ where: { employeeId: existingEmp.id } });
      await prisma.employeeAddress.deleteMany({ where: { employeeId: existingEmp.id } });
      await prisma.lmsEnrollment.deleteMany({ where: { employeeId: existingEmp.id } });
      await prisma.employee.delete({ where: { id: existingEmp.id } });
    }
    await prisma.lmsEnrollment.deleteMany({ where: { userEmail: empData.email } });
    await prisma.appUser.deleteMany({ where: { email: empData.email } });

    // 1. Create AppUser (for LMS & Portal login)
    const appUser = await prisma.appUser.create({
      data: {
        email: empData.email,
        displayName: empData.employeeName,
        roleId: learnerRole.id,
        status: "ACTIVE",
        passwordHash: "dummy_hash",
      },
    });

    // 2. Create Employee in Workforce Master Data
    const employee = await prisma.employee.create({
      data: {
        employeeId: empData.employeeId,
        employeeName: empData.employeeName,
        oraclePersonNumber: empData.oraclePersonNumber,
        assignmentStatus: "Active",
        gender: empData.gender,
        engagementType: empData.engagementType,
        employmentCategory: empData.employmentCategory,
        gccPresence: true,
        hgvRole: empData.hgvRole,
        hgvDepartment: empData.hgvDepartment,
        domainLeadId: domainLead.id,
        reportingManager: "Jeff Chu",
        businessUnit: "Global Capability Center",
        practice: empData.practice,
        subPractice: empData.subPractice,
        gradeLevel: empData.gradeLevel,
        employeeGroup: empData.employeeGroup,
        sourceId: empData.sourceId,
        shiftTypeId: empData.shiftTypeId,
        dateOfJoining: empData.dateOfJoining,
        hgvStartDate: empData.hgvStartDate,
        noticePeriod: "60 Days",
        skills: empData.skills.map((s) => s.name).join(", "),
        bgvStatus: "Passed",
      },
    });

    // 3. Create Contact
    await prisma.employeeContact.create({
      data: {
        employeeId: employee.id,
        hgvEmail: empData.email,
        personalEmail: empData.personalEmail,
        mobile: empData.mobile,
        emergencyContactName: empData.emergencyContactName,
        emergencyContactPhone: empData.emergencyContactPhone,
        qualification: empData.qualification,
        bloodGroup: empData.bloodGroup,
        maritalStatus: empData.maritalStatus,
      },
    });

    // 4. Create Address
    await prisma.employeeAddress.create({
      data: {
        employeeId: employee.id,
        baseLocation: empData.baseLocation,
        currentAddress: empData.currentAddress,
        permanentAddress: empData.currentAddress,
      },
    });

    // 5. Create Compensation
    await prisma.employeeCompensation.create({
      data: {
        employeeId: employee.id,
        fixedCtcInrAnnual: empData.fixedCtc,
        variablePayMode: empData.variablePayMode,
        variablePayPercent: empData.variablePayPercent,
      },
    });

    console.log(`  ✔ [Workforce] Created master data, contact, address, compensation`);

    // 6. Create Skill Matrix Entries (EmployeeSkill)
    for (const sk of empData.skills) {
      const skillId = skillMap[sk.name];
      if (skillId) {
        await prisma.employeeSkill.create({
          data: {
            employeeId: employee.id,
            skillId: skillId,
            selfRating: sk.rating,
            validatedRating: sk.rating,
            yearsOfExperience: sk.years,
            ratingSource: "MANAGER",
            validatedBy: "Jeff Chu",
            validatedAt: new Date(),
            evidence: sk.comment,
          },
        });
      }
    }

    // 7. Create Project Allocation
    if (empData.allocation) {
      await prisma.projectAllocation.create({
        data: {
          employeeId: employee.id,
          projectId: empData.allocation.projectId,
          projectName: empData.allocation.projectName,
          projectRole: empData.allocation.projectRole,
          allocationPct: empData.allocation.allocationPct,
          status: "CONFIRMED",
          confirmedBy: "Jeff Chu",
        },
      });
    }

    // 8. Create Employee Certification
    if (empData.certification) {
      await prisma.employeeCertification.create({
        data: {
          employeeId: employee.id,
          name: empData.certification.name,
          certificationId: empData.certification.certificationId,
          issuingBody: empData.certification.issuingBody,
          issueDate: new Date("2025-06-15"),
          expiryDate: new Date("2028-06-15"),
          status: "Valid",
          verified: true,
        },
      });
    }

    console.log(`  ✔ [Skill Matrix] Created ${empData.skills.length} skills, project allocation, and certifications`);

    // 9. Create LMS Enrollments, Progress, Quizzes, & Certificates
    for (const enr of empData.enrollments) {
      if (!enr.course) continue;

      let dueDate = new Date();
      if (enr.dueInDays) {
        dueDate.setDate(dueDate.getDate() + enr.dueInDays);
      } else if (enr.dueDaysAgo) {
        dueDate.setDate(dueDate.getDate() - enr.dueDaysAgo);
      } else {
        dueDate.setDate(dueDate.getDate() + 30);
      }

      let completedAt = null;
      if (enr.completedDaysAgo !== undefined) {
        completedAt = new Date();
        completedAt.setDate(completedAt.getDate() - enr.completedDaysAgo);
      }

      const enrollment = await prisma.lmsEnrollment.create({
        data: {
          userId: appUser.id,
          employeeId: employee.id,
          userEmail: empData.email,
          userName: empData.employeeName,
          department: empData.hgvDepartment,
          courseId: enr.course.id,
          status: enr.status,
          dueDate: dueDate,
          completedAt: completedAt,
          progressPercent: enr.progress,
        },
      });

      // If completed with certificate, create verifiable certificate
      if (enr.cert && completedAt) {
        const certNumber = generateCertNumber(enr.course.slug, empData.index);
        const issuedAt = completedAt;
        const expiresAt = new Date(issuedAt);
        expiresAt.setDate(expiresAt.getDate() + (enr.course.recertificationDays || 365));

        const sha256Hash = computeCertificateHash(
          certNumber,
          empData.email,
          enr.course.title,
          issuedAt
        );

        await prisma.lmsCertificate.create({
          data: {
            enrollmentId: enrollment.id,
            certificateNumber: certNumber,
            userId: appUser.id,
            userEmail: empData.email,
            userName: empData.employeeName,
            courseId: enr.course.id,
            scorePercent: enr.score || 100,
            issuedAt: issuedAt,
            expiresAt: expiresAt,
            verificationHash: sha256Hash,
            status: "VALID",
          },
        });
      }

      // If nudge log present
      if (empData.nudge && enr.status === "OVERDUE") {
        await prisma.lmsNudgeLog.create({
          data: {
            enrollmentId: enrollment.id,
            managerName: "Jeff Chu",
            targetUserEmail: empData.email,
            targetUserName: empData.employeeName,
            channel: empData.nudge.channel,
            message: empData.nudge.message,
            sentAt: new Date(),
          },
        });
      }
    }

    console.log(`  ✔ [LMS] Configured ${empData.enrollments.length} course enrollments (${empData.compliancePersona})`);
  }

  // Update seed_lms package script or log summary
  const totalEmps = await prisma.employee.count();
  const totalRatings = await prisma.employeeSkill.count();
  const totalEnrollments = await prisma.lmsEnrollment.count();
  const totalCerts = await prisma.lmsCertificate.count();

  console.log("\n=========================================================");
  console.log(" 🎉 ALL 5 EMPLOYEES FULLY SEEDED & INTERCONNECTED!");
  console.log("=========================================================");
  console.log(`- Total Employees in Workforce Master Data: ${totalEmps}`);
  console.log(`- Total Employee Skill Ratings in Skill Matrix: ${totalRatings}`);
  console.log(`- Total LMS Enrollments: ${totalEnrollments}`);
  console.log(`- Total Cryptographically Verifiable Certificates: ${totalCerts}`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
