const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function main() {
  console.log('Seeding Enterprise Learning & Compliance Platform (ELMS)...');

  // 1. Ensure Auditor Role & User exist
  let auditorRole = await prisma.role.findUnique({ where: { code: 'AUDITOR' } });
  if (!auditorRole) {
    auditorRole = await prisma.role.create({
      data: {
        code: 'AUDITOR',
        name: 'Compliance Auditor',
        description: 'Read-only access to immutable compliance logs, audit scorecards, and verifiable certificate registry',
      },
    });
  }

  let auditorUser = await prisma.appUser.findUnique({ where: { email: 'marcus.vance@hgv.com' } });
  if (!auditorUser) {
    auditorUser = await prisma.appUser.create({
      data: {
        email: 'marcus.vance@hgv.com',
        displayName: 'Marcus Vance',
        roleId: auditorRole.id,
        status: 'ACTIVE',
        passwordHash: 'dummy_hash',
      },
    });
  }

  // 2. Clean existing LMS tables
  await prisma.lmsAuditTrail.deleteMany();
  await prisma.lmsNudgeLog.deleteMany();
  await prisma.lmsCertificate.deleteMany();
  await prisma.lmsQuizAttempt.deleteMany();
  await prisma.lmsLessonProgress.deleteMany();
  await prisma.lmsEnrollment.deleteMany();
  await prisma.lmsQuestionOption.deleteMany();
  await prisma.lmsQuestion.deleteMany();
  await prisma.lmsQuiz.deleteMany();
  await prisma.lmsLesson.deleteMany();
  await prisma.lmsModule.deleteMany();
  await prisma.lmsCourse.deleteMany();

  // 3. Create Courses
  // Course 1: Annual Cybersecurity Awareness 2027
  const cyberCourse = await prisma.lmsCourse.create({
    data: {
      title: 'Annual Cybersecurity Awareness 2027',
      slug: 'annual-cybersecurity-awareness-2027',
      description: 'Mandatory annual information security and threat defense certification conforming to ISO/IEC 27001:2022 and SOC 2 Type II trust criteria.',
      category: 'Cybersecurity & IT',
      isMandatory: true,
      recertificationDays: 365,
      passingScore: 80,
      estimatedDurationMinutes: 45,
      enforceVideoCompletion: true,
      status: 'PUBLISHED',
      version: 1,
    },
  });

  const cyberModule = await prisma.lmsModule.create({
    data: {
      courseId: cyberCourse.id,
      title: 'Module 1: Enterprise Threat Defense & Credential Hygiene',
      description: 'Phishing recognition, MFA enforcement, social engineering defense, and incident response escalation.',
      orderIndex: 1,
    },
  });

  const cyberLesson1 = await prisma.lmsLesson.create({
    data: {
      moduleId: cyberModule.id,
      title: 'Lesson 1: Recognizing Advanced Spear-Phishing & Social Engineering',
      contentType: 'VIDEO',
      contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      textContent: "### Key Principles of Phishing Defense\n1. **Header Inspection**: Always inspect the true sender envelope ('Return-Path' & 'SPF/DKIM/DMARC') rather than just the friendly display name.\n2. **Urgency Cues**: Attackers routinely simulate urgency (e.g., 'Urgent wire transfer', 'Payroll portal password expires in 1 hour').\n3. **Out-of-Band Verification**: Never execute financial actions or password resets based on unverified email requests without verbal or secondary confirmation.\n4. **Immediate Incident Escalation**: Forward suspicious emails directly to security-incident@hgv.com within 15 minutes.",
      durationSec: 180,
      orderIndex: 1,
    },
  });

  const cyberLesson2 = await prisma.lmsLesson.create({
    data: {
      moduleId: cyberModule.id,
      title: 'Lesson 2: Clean Desk Policy & Zero-Trust MFA Guidelines',
      contentType: 'TEXT',
      textContent: "### Enterprise Password & Access Control Rules\n- **Minimum 16 Characters**: Passphrases must combine uppercase, lowercase, numbers, and symbols.\n- **Strict Prohibition of Shared MFA**: Never approve an authenticator push notification unless you actively initiated the login request.\n- **Screen Lock Mandate**: Lock workstation (Win + L or Cmd + Ctrl + Q) whenever leaving your desk, even for 30 seconds.\n- **Physical Security**: Confidential documents must be shredded or stored in locked file cabinets at end-of-day.",
      durationSec: 120,
      orderIndex: 2,
    },
  });

  const cyberLesson3 = await prisma.lmsLesson.create({
    data: {
      moduleId: cyberModule.id,
      title: 'Lesson 3: Incident Response & Data Breach Escalation Playbook',
      contentType: 'PDF',
      contentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      textContent: "### SOC 2 & ISO 27001 Breach Reporting Timelines\n- **Hour 0-1 (Detection)**: Disconnect compromised device from Wi-Fi/Ethernet immediately. Do NOT power off.\n- **Hour 1-4 (Triage)**: Security Operations Center (SOC) isolates affected network segment and analyzes endpoint telemetry.\n- **Hour 4-24 (Executive Escalation)**: Incident Commander briefs CISO, Legal Counsel, and Data Protection Officer.\n- **Hour 24-72 (Regulatory Notification)**: If personal data is impacted, external notification is dispatched to relevant regulatory bodies under GDPR Article 33.",
      durationSec: 240,
      orderIndex: 3,
    },
  });

  const cyberQuiz = await prisma.lmsQuiz.create({
    data: {
      moduleId: cyberModule.id,
      title: 'Cybersecurity Awareness Final Assessment',
      description: 'Achieve at least 80% to earn your verifiable annual compliance certificate.',
      passingThresholdPercent: 80,
      maxAttempts: 3,
      cooldownHours: 2,
    },
  });

  // Cyber Quiz Questions
  const q1 = await prisma.lmsQuestion.create({
    data: {
      quizId: cyberQuiz.id,
      questionText: 'You receive an urgent message from "CEO Office" demanding immediate purchase of client gift cards. What is the compliant protocol?',
      type: 'MCQ_SINGLE',
      points: 1,
      orderIndex: 1,
      explanation: 'Executive impersonation is a classic BEC (Business Email Compromise) tactic. Always verify out-of-band and report to the security operations center.',
    },
  });
  await prisma.lmsQuestionOption.createMany({
    data: [
      { questionId: q1.id, optionText: 'Immediately purchase the cards using corporate credit card to avoid delay', isCorrect: false, orderIndex: 1 },
      { questionId: q1.id, optionText: 'Verify via secondary out-of-band channel and report email to Security SOC', isCorrect: true, orderIndex: 2 },
      { questionId: q1.id, optionText: 'Reply asking the CEO to provide their personal password as proof', isCorrect: false, orderIndex: 3 },
      { questionId: q1.id, optionText: 'Forward to all team members so someone else can handle it', isCorrect: false, orderIndex: 4 },
    ],
  });

  const q2 = await prisma.lmsQuestion.create({
    data: {
      quizId: cyberQuiz.id,
      questionText: 'Under HGV Zero-Trust policy, it is permissible to share MFA push approval codes with internal IT engineers over Slack if they are fixing your computer.',
      type: 'TRUE_FALSE',
      points: 1,
      orderIndex: 2,
      explanation: 'Never share MFA codes or approve unprompted push notifications under any circumstance. IT engineers will never ask for your MFA code.',
    },
  });
  await prisma.lmsQuestionOption.createMany({
    data: [
      { questionId: q2.id, optionText: 'True', isCorrect: false, orderIndex: 1 },
      { questionId: q2.id, optionText: 'False', isCorrect: true, orderIndex: 2 },
    ],
  });

  const q3 = await prisma.lmsQuestion.create({
    data: {
      quizId: cyberQuiz.id,
      questionText: 'Which of the following are mandatory endpoint security requirements for all workforce laptops? (Select all that apply)',
      type: 'MCQ_MULTI',
      points: 1,
      orderIndex: 3,
      explanation: 'Endpoint security mandates full disk encryption, automatic screensaver lock, and centralized EDR anti-malware telemetry.',
    },
  });
  await prisma.lmsQuestionOption.createMany({
    data: [
      { questionId: q3.id, optionText: 'Full disk encryption (BitLocker / FileVault) enabled at all times', isCorrect: true, orderIndex: 1 },
      { questionId: q3.id, optionText: 'Screen auto-lock configured after maximum 5 minutes of inactivity', isCorrect: true, orderIndex: 2 },
      { questionId: q3.id, optionText: 'Disabling company antivirus when compiling large code bases', isCorrect: false, orderIndex: 3 },
      { questionId: q3.id, optionText: 'Prohibition of plugging unauthorized external USB drives into corporate devices', isCorrect: true, orderIndex: 4 },
    ],
  });

  const q4 = await prisma.lmsQuestion.create({
    data: {
      quizId: cyberQuiz.id,
      questionText: 'What is the primary indicator of a spoofed sender address in an email?',
      type: 'MCQ_SINGLE',
      points: 1,
      orderIndex: 4,
      explanation: 'Display names can be easily forged; verifying the underlying RFC 5322 domain headers reveals true origin.',
    },
  });
  await prisma.lmsQuestionOption.createMany({
    data: [
      { questionId: q4.id, optionText: 'The email includes high-resolution company logos', isCorrect: false, orderIndex: 1 },
      { questionId: q4.id, optionText: 'Discrepancy between the friendly display name and the actual envelope sender domain', isCorrect: true, orderIndex: 2 },
      { questionId: q4.id, optionText: 'The email was sent on a weekend', isCorrect: false, orderIndex: 3 },
      { questionId: q4.id, optionText: 'The font size is slightly larger than usual', isCorrect: false, orderIndex: 4 },
    ],
  });

  const q5 = await prisma.lmsQuestion.create({
    data: {
      quizId: cyberQuiz.id,
      questionText: 'If you suspect your laptop has been infected by ransomware, you should immediately unplug from Wi-Fi/network and power it off completely.',
      type: 'TRUE_FALSE',
      points: 1,
      orderIndex: 5,
      explanation: 'Disconnect from network immediately, but do NOT power off, as volatile RAM contains crucial forensic keys needed by the DFIR team.',
    },
  });
  await prisma.lmsQuestionOption.createMany({
    data: [
      { questionId: q5.id, optionText: 'True', isCorrect: false, orderIndex: 1 },
      { questionId: q5.id, optionText: 'False', isCorrect: true, orderIndex: 2 },
    ],
  });

  // Course 2: Anti-Harassment & POSH Compliance
  const poshCourse = await prisma.lmsCourse.create({
    data: {
      title: 'Anti-Harassment & POSH Compliance (2026-2027)',
      slug: 'posh-anti-harassment-compliance-2026',
      description: 'Comprehensive Prevention of Sexual Harassment (POSH) training ensuring dignity, equality, and zero-tolerance workplace compliance.',
      category: 'Legal, Ethics & Compliance',
      isMandatory: true,
      recertificationDays: 365,
      passingScore: 80,
      estimatedDurationMinutes: 30,
      enforceVideoCompletion: true,
      status: 'PUBLISHED',
      version: 1,
    },
  });

  const poshModule = await prisma.lmsModule.create({
    data: {
      courseId: poshCourse.id,
      title: 'Module 1: Workplace Dignity & Legal Safeguards',
      description: 'Legal definitions, Internal Complaints Committee (ICC), bystander intervention, and non-retaliation policies.',
      orderIndex: 1,
    },
  });

  const poshLesson1 = await prisma.lmsLesson.create({
    data: {
      moduleId: poshModule.id,
      title: 'Lesson 1: Defining Sexual Harassment & Quid Pro Quo vs. Hostile Environment',
      contentType: 'VIDEO',
      contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      textContent: `### Core Legal Definitions
1. **Quid Pro Quo**: Demanding sexual favors in exchange for employment benefits (promotions, ratings, raises).
2. **Hostile Work Environment**: Unwelcome verbal, non-verbal, or physical conduct creating an intimidating or offensive atmosphere.
3. **Applicability**: Applies to all workspaces, including virtual video calls, official offsites, corporate chats, and client dinners.`,
      durationSec: 150,
      orderIndex: 1,
    },
  });

  const poshLesson2 = await prisma.lmsLesson.create({
    data: {
      moduleId: poshModule.id,
      title: 'Lesson 2: Internal Complaints Committee (ICC) & Non-Retaliation Protections',
      contentType: 'TEXT',
      textContent: `### Reporting Channels & ICC Investigation Process
- **Confidential Filing**: Employees can submit complaints directly to posh-icc@hgv.com.
- **Strict Non-Retaliation**: Any retaliatory action against an aggrieved individual or witness is a severe violation warranting immediate termination.
- **Fair Hearing**: Both parties receive impartial opportunity to present documentation and witness testimony within statutory timeframes.`,
      durationSec: 120,
      orderIndex: 2,
    },
  });

  const poshQuiz = await prisma.lmsQuiz.create({
    data: {
      moduleId: poshModule.id,
      title: 'POSH Compliance Certification Quiz',
      passingThresholdPercent: 80,
      maxAttempts: 3,
      cooldownHours: 1,
    },
  });

  const pq1 = await prisma.lmsQuestion.create({
    data: {
      quizId: poshQuiz.id,
      questionText: 'Can inappropriate comments or unwelcome jokes made on official Slack/Teams channels constitute workplace sexual harassment?',
      type: 'TRUE_FALSE',
      points: 1,
      orderIndex: 1,
      explanation: 'Yes, the definition of workplace explicitly includes digital communications and remote collaboration channels.',
    },
  });
  await prisma.lmsQuestionOption.createMany({
    data: [
      { questionId: pq1.id, optionText: 'True', isCorrect: true, orderIndex: 1 },
      { questionId: pq1.id, optionText: 'False', isCorrect: false, orderIndex: 2 },
    ],
  });

  const pq2 = await prisma.lmsQuestion.create({
    data: {
      quizId: poshQuiz.id,
      questionText: 'What protection is guaranteed to any employee who files a good-faith harassment complaint?',
      type: 'MCQ_SINGLE',
      points: 1,
      orderIndex: 2,
      explanation: 'Enterprise governance guarantees strict confidentiality and zero-tolerance protections against retaliation.',
    },
  });
  await prisma.lmsQuestionOption.createMany({
    data: [
      { questionId: pq2.id, optionText: 'Mandatory transfer to another department', isCorrect: false, orderIndex: 1 },
      { questionId: pq2.id, optionText: 'Strict confidentiality and absolute protection against retaliation', isCorrect: true, orderIndex: 2 },
      { questionId: pq2.id, optionText: 'Immediate public disclosure to team members', isCorrect: false, orderIndex: 3 },
      { questionId: pq2.id, optionText: 'Waiver of annual performance bonus', isCorrect: false, orderIndex: 4 },
    ],
  });

  // Course 3: Global Data Privacy & GDPR
  const gdprCourse = await prisma.lmsCourse.create({
    data: {
      title: 'Global Data Privacy, GDPR & CCPA Compliance',
      slug: 'global-data-privacy-gdpr-ccpa',
      description: 'Regulatory standards for processing Personal Identifiable Information (PII), data subject access rights, and cross-border safeguards.',
      category: 'Data Privacy',
      isMandatory: true,
      recertificationDays: 365,
      passingScore: 85,
      estimatedDurationMinutes: 40,
      enforceVideoCompletion: true,
      status: 'PUBLISHED',
      version: 1,
    },
  });

  const gdprModule = await prisma.lmsModule.create({
    data: {
      courseId: gdprCourse.id,
      title: 'Module 1: Principles of Lawful Data Processing',
      description: 'Understanding PII, lawful grounds, 72-hour breach disclosure, and subject rights.',
      orderIndex: 1,
    },
  });

  await prisma.lmsLesson.create({
    data: {
      moduleId: gdprModule.id,
      title: 'Lesson 1: The 7 Core Principles of GDPR & PII Handling',
      contentType: 'VIDEO',
      contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      textContent: `### GDPR Article 5 Principles
1. Lawfulness, fairness, and transparency
2. Purpose limitation
3. Data minimization
4. Accuracy
5. Storage limitation
6. Integrity and confidentiality (security)
7. Accountability`,
      durationSec: 180,
      orderIndex: 1,
    },
  });

  const gdprQuiz = await prisma.lmsQuiz.create({
    data: {
      moduleId: gdprModule.id,
      title: 'GDPR & Privacy Compliance Assessment',
      passingThresholdPercent: 85,
      maxAttempts: 3,
      cooldownHours: 2,
    },
  });

  const gq1 = await prisma.lmsQuestion.create({
    data: {
      quizId: gdprQuiz.id,
      questionText: 'Under GDPR Article 33, what is the maximum statutory timeframe to notify the supervisory authority of a confirmed personal data breach?',
      type: 'MCQ_SINGLE',
      points: 1,
      orderIndex: 1,
      explanation: 'GDPR mandates notification without undue delay and, where feasible, not later than 72 hours after becoming aware.',
    },
  });
  await prisma.lmsQuestionOption.createMany({
    data: [
      { questionId: gq1.id, optionText: '24 hours', isCorrect: false, orderIndex: 1 },
      { questionId: gq1.id, optionText: '72 hours', isCorrect: true, orderIndex: 2 },
      { questionId: gq1.id, optionText: '14 calendar days', isCorrect: false, orderIndex: 3 },
      { questionId: gq1.id, optionText: '30 business days', isCorrect: false, orderIndex: 4 },
    ],
  });

  // Course 4: Workplace Health, Safety & OSHA
  const safetyCourse = await prisma.lmsCourse.create({
    data: {
      title: 'Workplace Health, Safety & Ergonomics (OSHA)',
      slug: 'workplace-health-safety-osha-2026',
      description: 'Ergonomic workspace standards, emergency evacuation protocols, hazard reporting, and occupational safety.',
      category: 'Safety',
      isMandatory: true,
      recertificationDays: 180,
      passingScore: 80,
      estimatedDurationMinutes: 25,
      enforceVideoCompletion: false,
      status: 'PUBLISHED',
      version: 1,
    },
  });

  const safetyModule = await prisma.lmsModule.create({
    data: {
      courseId: safetyCourse.id,
      title: 'Module 1: Workplace Ergonomics & Emergency Evacuation',
      orderIndex: 1,
    },
  });

  await prisma.lmsLesson.create({
    data: {
      moduleId: safetyModule.id,
      title: 'Lesson 1: Ergonomic Alignment & Repetitive Strain Prevention',
      contentType: 'TEXT',
      textContent: `### Key Ergonomic Adjustments
- Top of monitor at or slightly below eye level.
- Elbows bent at 90-100 degrees with wrists in neutral position.
- Take a 20-second break every 20 minutes looking 20 feet away (20-20-20 rule).`,
      durationSec: 120,
      orderIndex: 1,
    },
  });

  const safetyQuiz = await prisma.lmsQuiz.create({
    data: {
      moduleId: safetyModule.id,
      title: 'Safety & Ergonomics Knowledge Check',
      passingThresholdPercent: 80,
      maxAttempts: 3,
      cooldownHours: 1,
    },
  });

  const sq1 = await prisma.lmsQuestion.create({
    data: {
      quizId: safetyQuiz.id,
      questionText: 'In the event of a facility fire alarm, it is acceptable to use the elevator if your office is above the 10th floor.',
      type: 'TRUE_FALSE',
      points: 1,
      orderIndex: 1,
      explanation: 'Never use elevators during a fire evacuation; always utilize emergency stairwells.',
    },
  });
  await prisma.lmsQuestionOption.createMany({
    data: [
      { questionId: sq1.id, optionText: 'True', isCorrect: false, orderIndex: 1 },
      { questionId: sq1.id, optionText: 'False', isCorrect: true, orderIndex: 2 },
    ],
  });

  // Course 5: Enterprise Leadership & Coaching (Elective)
  const leadershipCourse = await prisma.lmsCourse.create({
    data: {
      title: 'Enterprise Leadership & People Management',
      slug: 'enterprise-leadership-coaching',
      description: 'Modern people management frameworks, psychological safety, radical candor feedback, and talent enablement.',
      category: 'Leadership',
      isMandatory: false,
      recertificationDays: 0,
      passingScore: 75,
      estimatedDurationMinutes: 60,
      enforceVideoCompletion: false,
      status: 'PUBLISHED',
      version: 1,
    },
  });

  // Course 6: Secure Software Development (Elective)
  const ssdlcCourse = await prisma.lmsCourse.create({
    data: {
      title: 'Secure Code Architecture & OWASP Top 10',
      slug: 'secure-code-owasp-top-10',
      description: 'Hands-on mitigation of SQL Injection, Cross-Site Scripting, Broken Object Level Authorization, and dependency security.',
      category: 'Engineering',
      isMandatory: false,
      recertificationDays: 365,
      passingScore: 80,
      estimatedDurationMinutes: 50,
      enforceVideoCompletion: false,
      status: 'PUBLISHED',
      version: 1,
    },
  });

  // 4. Enrollments & Realistic Compliance Distribution
  console.log('Seeding Enrollments and Certificates...');
  const employees = await prisma.employee.findMany({ take: 60 });
  const now = new Date();

  // Helper date generators
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysAhead = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // A. Seed Alex Rivera (Demo Learner)
  // 1. Cybersecurity: IN_PROGRESS (66% complete)
  const alexCyber = await prisma.lmsEnrollment.create({
    data: {
      userEmail: 'alex.rivera@hgv.com',
      userName: 'Alex Rivera',
      department: 'Human Resources',
      courseId: cyberCourse.id,
      status: 'IN_PROGRESS',
      enrolledAt: daysAgo(10),
      dueDate: daysAhead(4),
      progressPercent: 66,
      currentLessonId: cyberLesson2.id,
    },
  });
  await prisma.lmsLessonProgress.create({
    data: {
      enrollmentId: alexCyber.id,
      lessonId: cyberLesson1.id,
      secondsWatched: 180,
      completed: true,
      completedAt: daysAgo(5),
    },
  });
  await prisma.lmsLessonProgress.create({
    data: {
      enrollmentId: alexCyber.id,
      lessonId: cyberLesson2.id,
      secondsWatched: 120,
      completed: true,
      completedAt: daysAgo(2),
    },
  });

  // 2. POSH: COMPLETED with Certificate
  const alexPosh = await prisma.lmsEnrollment.create({
    data: {
      userEmail: 'alex.rivera@hgv.com',
      userName: 'Alex Rivera',
      department: 'Human Resources',
      courseId: poshCourse.id,
      status: 'COMPLETED',
      enrolledAt: daysAgo(20),
      dueDate: daysAhead(10),
      completedAt: daysAgo(3),
      progressPercent: 100,
    },
  });
  const alexPoshCertNumber = `CERT-2026-POSH-${Math.floor(1000 + Math.random() * 9000)}`;
  const certRaw = `${alexPoshCertNumber}|alex.rivera@hgv.com|${poshCourse.title}|${daysAgo(3).toISOString()}`;
  await prisma.lmsCertificate.create({
    data: {
      certificateNumber: alexPoshCertNumber,
      enrollmentId: alexPosh.id,
      userEmail: 'alex.rivera@hgv.com',
      userName: 'Alex Rivera',
      courseId: poshCourse.id,
      issuedAt: daysAgo(3),
      expiresAt: daysAhead(362),
      scorePercent: 100,
      verificationHash: sha256(certRaw),
      qrPayload: `https://hgv.workforce/lms/verify/${alexPoshCertNumber}`,
      status: 'VALID',
    },
  });

  // 3. Safety: OVERDUE (Due 3 days ago!)
  const alexSafety = await prisma.lmsEnrollment.create({
    data: {
      userEmail: 'alex.rivera@hgv.com',
      userName: 'Alex Rivera',
      department: 'Human Resources',
      courseId: safetyCourse.id,
      status: 'OVERDUE',
      enrolledAt: daysAgo(35),
      dueDate: daysAgo(3),
      progressPercent: 0,
    },
  });

  // 4. GDPR: ASSIGNED (Due in 5 days)
  await prisma.lmsEnrollment.create({
    data: {
      userEmail: 'alex.rivera@hgv.com',
      userName: 'Alex Rivera',
      department: 'Human Resources',
      courseId: gdprCourse.id,
      status: 'ASSIGNED',
      enrolledAt: daysAgo(2),
      dueDate: daysAhead(5),
      progressPercent: 0,
    },
  });

  // B. Seed employees under Jeff Chu and other managers
  // Let's create realistic enrollments across employees
  let completedCount = 0;
  let overdueCount = 0;
  let inProgressCount = 0;

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const isDirectOfJeff = emp.reportingManager === 'Jeff Chu';

    // Assign Cybersecurity
    let cyberStatus = 'COMPLETED';
    let cyberProgress = 100;
    let cyberDue = daysAhead(20);
    let cyberCompleted = daysAgo(Math.floor(Math.random() * 30) + 1);

    if (i % 6 === 0) {
      // Overdue
      cyberStatus = 'OVERDUE';
      cyberProgress = Math.random() > 0.5 ? 33 : 0;
      cyberDue = daysAgo(Math.floor(Math.random() * 7) + 1);
      cyberCompleted = null;
      overdueCount++;
    } else if (i % 4 === 0) {
      // Due Soon / In Progress
      cyberStatus = 'IN_PROGRESS';
      cyberProgress = 50;
      cyberDue = daysAhead(Math.floor(Math.random() * 5) + 1);
      cyberCompleted = null;
      inProgressCount++;
    } else {
      completedCount++;
    }

    const enrollment = await prisma.lmsEnrollment.create({
      data: {
        employeeId: emp.id,
        userEmail: `${emp.employeeName.toLowerCase().replace(/[^a-z]/g, '.')}@hgv.com`,
        userName: emp.employeeName,
        department: emp.hgvDepartment || 'Engineering',
        courseId: cyberCourse.id,
        status: cyberStatus,
        enrolledAt: daysAgo(40),
        dueDate: cyberDue,
        completedAt: cyberCompleted,
        progressPercent: cyberProgress,
      },
    });

    if (cyberStatus === 'COMPLETED') {
      const certNum = `CERT-2026-CYBER-${1000 + i}`;
      const cRaw = `${certNum}|${enrollment.userEmail}|${cyberCourse.title}|${cyberCompleted.toISOString()}`;
      await prisma.lmsCertificate.create({
        data: {
          certificateNumber: certNum,
          enrollmentId: enrollment.id,
          userEmail: enrollment.userEmail,
          userName: emp.employeeName,
          courseId: cyberCourse.id,
          issuedAt: cyberCompleted,
          expiresAt: new Date(cyberCompleted.getTime() + 365 * 24 * 60 * 60 * 1000),
          scorePercent: 90,
          verificationHash: sha256(cRaw),
          qrPayload: `https://hgv.workforce/lms/verify/${certNum}`,
          status: 'VALID',
        },
      });
    }

    // Also assign POSH to first 30
    if (i < 30) {
      const poshStatus = i % 5 === 0 ? 'OVERDUE' : 'COMPLETED';
      const pDue = poshStatus === 'OVERDUE' ? daysAgo(2) : daysAhead(45);
      const pComp = poshStatus === 'COMPLETED' ? daysAgo(12) : null;
      const pEnroll = await prisma.lmsEnrollment.create({
        data: {
          employeeId: emp.id,
          userEmail: `${emp.employeeName.toLowerCase().replace(/[^a-z]/g, '.')}@hgv.com`,
          userName: emp.employeeName,
          department: emp.hgvDepartment || 'Engineering',
          courseId: poshCourse.id,
          status: poshStatus,
          enrolledAt: daysAgo(30),
          dueDate: pDue,
          completedAt: pComp,
          progressPercent: poshStatus === 'COMPLETED' ? 100 : 20,
        },
      });

      if (poshStatus === 'COMPLETED') {
        const certNum = `CERT-2026-POSH-${2000 + i}`;
        const cRaw = `${certNum}|${pEnroll.userEmail}|${poshCourse.title}|${pComp.toISOString()}`;
        await prisma.lmsCertificate.create({
          data: {
            certificateNumber: certNum,
            enrollmentId: pEnroll.id,
            userEmail: pEnroll.userEmail,
            userName: emp.employeeName,
            courseId: poshCourse.id,
            issuedAt: pComp,
            expiresAt: new Date(pComp.getTime() + 365 * 24 * 60 * 60 * 1000),
            scorePercent: 95,
            verificationHash: sha256(cRaw),
            qrPayload: `https://hgv.workforce/lms/verify/${certNum}`,
            status: 'VALID',
          },
        });
      }
    }
  }

  // 5. Seed Nudge Logs (past nudges from Jeff Chu & Sarah Jenkins)
  await prisma.lmsNudgeLog.createMany({
    data: [
      {
        enrollmentId: alexSafety.id,
        managerName: 'Jeff Chu',
        targetUserEmail: 'alex.rivera@hgv.com',
        targetUserName: 'Alex Rivera',
        channel: 'EMAIL',
        message: 'Friendly reminder that your Workplace Health, Safety & Ergonomics compliance certification is now 3 days overdue. Please complete it by EOD.',
        sentAt: daysAgo(1),
      },
      {
        enrollmentId: alexSafety.id,
        managerName: 'Jeff Chu',
        targetUserEmail: 'alex.rivera@hgv.com',
        targetUserName: 'Alex Rivera',
        channel: 'SLACK',
        message: '🚨 Urgent: Workplace Safety certification overdue. Required for SOC 2 compliance.',
        sentAt: daysAgo(0.5),
      },
    ],
  });

  // 6. Seed LMS Audit Trail entries
  await prisma.lmsAuditTrail.createMany({
    data: [
      {
        actorEmail: 'sarah.jenkins@hgv.com',
        actorRole: 'HR_MANAGER',
        action: 'COURSE_PUBLISHED',
        targetEntity: 'COURSE',
        entityId: cyberCourse.id,
        detailsJson: JSON.stringify({ courseTitle: cyberCourse.title, cadenceDays: 365, passingScore: 80 }),
        timestamp: daysAgo(45),
      },
      {
        actorEmail: 'system.worker@hgv.com',
        actorRole: 'SYSTEM',
        action: 'ENROLLMENT_CREATED',
        targetEntity: 'ENROLLMENT',
        entityId: alexCyber.id,
        detailsJson: JSON.stringify({ userEmail: 'alex.rivera@hgv.com', courseTitle: cyberCourse.title, rule: 'MANDATORY_ALL_EMPLOYEES' }),
        timestamp: daysAgo(10),
      },
      {
        actorEmail: 'alex.rivera@hgv.com',
        actorRole: 'HR_TEAM_MEMBER',
        action: 'LESSON_LAUNCH',
        targetEntity: 'LESSON',
        entityId: cyberLesson1.id,
        detailsJson: JSON.stringify({ lessonTitle: cyberLesson1.title }),
        timestamp: daysAgo(5),
      },
      {
        actorEmail: 'alex.rivera@hgv.com',
        actorRole: 'HR_TEAM_MEMBER',
        action: 'QUIZ_SUBMIT',
        targetEntity: 'QUIZ',
        entityId: poshQuiz.id,
        detailsJson: JSON.stringify({ scorePercent: 100, isPassed: true }),
        timestamp: daysAgo(3),
      },
      {
        actorEmail: 'system.worker@hgv.com',
        actorRole: 'SYSTEM',
        action: 'CERTIFICATE_ISSUED',
        targetEntity: 'CERTIFICATE',
        entityId: alexPoshCertNumber,
        detailsJson: JSON.stringify({ certificateNumber: alexPoshCertNumber, recipient: 'alex.rivera@hgv.com', validityDays: 365 }),
        timestamp: daysAgo(3),
      },
      {
        actorEmail: 'jeff.chu@hgv.com',
        actorRole: 'GCC_LEAD',
        action: 'NUDGE_SENT',
        targetEntity: 'NUDGE',
        entityId: alexSafety.id,
        detailsJson: JSON.stringify({ recipient: 'alex.rivera@hgv.com', channel: 'EMAIL', course: safetyCourse.title }),
        timestamp: daysAgo(1),
      },
    ],
  });

  console.log('✅ Enterprise Learning & Compliance Platform (ELMS) seeded successfully!');
  console.log(`- 6 Courses (4 Mandatory Compliance, 2 Electives)`);
  console.log(`- Alex Rivera: 1 In-Progress, 1 Completed + Certificate, 1 Overdue, 1 Assigned`);
  console.log(`- General Workforce: ${completedCount} Completed, ${inProgressCount} In-Progress, ${overdueCount} Overdue`);
  console.log(`- Nudge logs and Audit trails populated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
