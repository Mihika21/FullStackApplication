const http = require('http');

const PORT = 3001;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('application/json')
            ? JSON.parse(data)
            : data;
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   ENTERPRISE LEARNING & COMPLIANCE (ELMS) E2E SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details}`);
      failed++;
    }
  }

  try {
    // Test 1: Fetch Courses (FR-CMS)
    console.log('[1/10] Testing Course Catalog (FR-CMS)...');
    const coursesRes = await request('/api/v1/lms/courses');
    assert(coursesRes.status === 200, 'GET /api/v1/lms/courses status 200');
    assert(Array.isArray(coursesRes.data.courses), 'Returns courses array');
    assert(coursesRes.data.courses.length >= 4, `Has seeded courses (found ${coursesRes.data.courses?.length})`);

    const cyberCourse = coursesRes.data.courses.find((c) => c.slug.includes('cybersecurity'));
    assert(!!cyberCourse, 'Annual Cybersecurity course exists');
    assert(cyberCourse?.isMandatory === true, 'Cybersecurity marked as mandatory');
    assert(cyberCourse?.recertificationDays === 365, 'Recertification cadence is 365 days');

    // Test 2: Course Details & Curriculum Structure
    console.log('\n[2/10] Testing Course Hierarchy & Modules (FR-CMS-01)...');
    const courseDetailRes = await request(`/api/v1/lms/courses/${cyberCourse.id}`);
    assert(courseDetailRes.status === 200, 'GET /api/v1/lms/courses/[id] status 200');
    assert(courseDetailRes.data.course.modules?.length > 0, 'Course contains modules');
    const mod1 = courseDetailRes.data.course.modules[0];
    assert(mod1.lessons?.length >= 2, 'Module contains multi-format lessons');
    assert(!!mod1.quiz, 'Module contains graded assessment');
    assert(mod1.quiz?.questions?.length >= 3, 'Quiz contains questions bank');

    // Test 3: Learner Enrollments (FR-ENROLL, FR-LEARN)
    console.log('\n[3/10] Testing Learner Enrollments (FR-ENROLL)...');
    const enrRes = await request('/api/v1/lms/enrollments?userEmail=alex.rivera@hgv.com');
    assert(enrRes.status === 200, 'GET /api/v1/lms/enrollments status 200');
    assert(enrRes.data.enrollments?.length > 0, `Alex Rivera has enrollments (found ${enrRes.data.enrollments?.length})`);

    const alexCyberEnr = enrRes.data.enrollments.find((e) => e.courseId === cyberCourse.id);
    assert(!!alexCyberEnr, 'Alex Rivera enrolled in Cybersecurity');
    assert(alexCyberEnr?.status === 'IN_PROGRESS', `Enrollment status is IN_PROGRESS (got ${alexCyberEnr?.status})`);

    // Test 4: Video / Lesson Progress Tracking (FR-CMS-03)
    console.log('\n[4/10] Testing Lesson Progress Recording (FR-CMS-03)...');
    const lesson1 = mod1.lessons[0];
    const progressRes = await request('/api/v1/lms/lessons/progress', {
      method: 'POST',
      headers: { 'x-hgv-role': 'HR_TEAM_MEMBER', 'x-hgv-email': 'alex.rivera@hgv.com' },
      body: {
        enrollmentId: alexCyberEnr.id,
        lessonId: lesson1.id,
        secondsWatched: 180,
        completed: true,
      },
    });
    assert(progressRes.status === 200, 'POST /api/v1/lms/lessons/progress status 200');
    assert(progressRes.data.success === true, 'Lesson progress successfully recorded');

    // Test 5: Graded Quiz Submission & Certificate Generation (FR-QUIZ, FR-LEARN-03)
    console.log('\n[5/10] Testing Quiz Evaluation & Digital Certificate Awarding (FR-QUIZ)...');
    // Prepare answers for all questions
    const answers = {};
    for (const q of mod1.quiz.questions) {
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (q.type === 'MCQ_MULTI') {
        const correctOpts = q.options.filter((o) => o.isCorrect).map((o) => o.id);
        answers[q.id] = correctOpts;
      } else if (correctOpt) {
        answers[q.id] = correctOpt.id;
      }
    }

    const quizRes = await request('/api/v1/lms/quiz/submit', {
      method: 'POST',
      headers: { 'x-hgv-role': 'HR_TEAM_MEMBER', 'x-hgv-email': 'alex.rivera@hgv.com' },
      body: {
        quizId: mod1.quiz.id,
        enrollmentId: alexCyberEnr.id,
        answers,
      },
    });
    assert(quizRes.status === 200, 'POST /api/v1/lms/quiz/submit status 200');
    assert(quizRes.data.isPassed === true, 'Quiz passed (score meets threshold)');
    assert(quizRes.data.scorePercent >= 80, `Score is ${quizRes.data.scorePercent}%`);
    assert(!!quizRes.data.certificate, 'Certificate generated upon passing');
    assert(!!quizRes.data.certificate?.certificateNumber, `Certificate number generated: ${quizRes.data.certificate?.certificateNumber}`);
    assert(!!quizRes.data.certificate?.verificationHash, 'Cryptographic SHA-256 hash created');

    const awardedCertNumber = quizRes.data.certificate.certificateNumber;

    // Test 6: Digital Certificate Verification Portal (FR-LEARN-04)
    console.log('\n[6/10] Testing Certificate Verification Registry (FR-LEARN-04)...');
    const verifyRes = await request(`/api/v1/lms/verify?query=${awardedCertNumber}`);
    assert(verifyRes.status === 200, 'GET /api/v1/lms/verify status 200');
    assert(verifyRes.data.verified === true, 'Verification status is verified: true');
    assert(verifyRes.data.status === 'VERIFIED_AUTHENTIC', 'Status: VERIFIED_AUTHENTIC');
    assert(verifyRes.data.certificate.recipientEmail === 'alex.rivera@hgv.com', 'Recipient email matches');
    assert(verifyRes.data.certificate.verificationHash === quizRes.data.certificate.verificationHash, 'SHA-256 hash verified');

    // Test 7: People Manager Command Center & Heatmap (FR-MGR-01)
    console.log('\n[7/10] Testing Manager Compliance Heatmap (FR-MGR-01)...');
    const heatmapRes = await request('/api/v1/lms/manager/heatmap', {
      headers: { 'x-hgv-role': 'GCC_LEAD', 'x-hgv-email': 'jeff.chu@hgv.com' },
    });
    assert(heatmapRes.status === 200, 'GET /api/v1/lms/manager/heatmap status 200');
    assert(Array.isArray(heatmapRes.data.teamMatrix), 'Team matrix returned');
    assert(heatmapRes.data.summary?.totalTeamMembers > 0, `Team members found (${heatmapRes.data.summary?.totalTeamMembers})`);
    assert(typeof heatmapRes.data.summary?.teamCompliancePercent === 'number', `Team compliance rate calculated: ${heatmapRes.data.summary?.teamCompliancePercent}%`);

    // Test 8: 1-Click Multi-Channel Nudge (FR-MGR-02, FR-MGR-03)
    console.log('\n[8/10] Testing 1-Click Nudge System (FR-MGR-02)...');
    const nudgeRes = await request('/api/v1/lms/manager/nudge', {
      method: 'POST',
      headers: { 'x-hgv-role': 'GCC_LEAD', 'x-hgv-email': 'jeff.chu@hgv.com' },
      body: {
        enrollmentId: alexCyberEnr.id,
        channel: 'MULTI_CHANNEL',
        customMessage: 'Automated test: please complete mandatory annual compliance.',
      },
    });
    assert(nudgeRes.status === 200, 'POST /api/v1/lms/manager/nudge status 200');
    assert(nudgeRes.data.success === true, 'Nudge successfully dispatched');
    assert(nudgeRes.data.nudgesSent === 1, '1 nudge log created');

    // Test 9: Automated Recertification Cadence Engine (FR-COMP-01, FR-COMP-02)
    console.log('\n[9/10] Testing Recertification Lifecycle Engine (FR-COMP)...');
    const recertRes = await request('/api/v1/lms/recertification/run', {
      method: 'POST',
      headers: { 'x-hgv-role': 'HR_MANAGER', 'x-hgv-email': 'sarah.jenkins@hgv.com' },
    });
    assert(recertRes.status === 200, 'POST /api/v1/lms/recertification/run status 200');
    assert(recertRes.data.success === true, 'Recertification scan completed');
    assert(typeof recertRes.data.overdueFlaggedCount === 'number', `Delinquent non-compliant records flagged: ${recertRes.data.overdueFlaggedCount}`);

    // Test 10: Executive Analytics & Regulatory Audit Package Export (FR-REP-01, FR-REP-03)
    console.log('\n[10/10] Testing Executive Scorecard & Audit Package Export (FR-REP)...');
    const analyticsRes = await request('/api/v1/lms/analytics');
    assert(analyticsRes.status === 200, 'GET /api/v1/lms/analytics status 200');
    assert(typeof analyticsRes.data.scorecard?.overallCompliancePercent === 'number', `Overall compliance score: ${analyticsRes.data.scorecard?.overallCompliancePercent}%`);
    assert(analyticsRes.data.departmentRankings?.length > 0, 'Department rankings calculated');

    const exportRes = await request('/api/v1/lms/reports/export');
    assert(exportRes.status === 200, 'GET /api/v1/lms/reports/export status 200');
    assert(exportRes.headers['content-type']?.includes('text/csv'), 'Content-Type is text/csv');
    assert(typeof exportRes.data === 'string' && exportRes.data.includes('SHA-256 Verification Hash'), 'CSV contains regulatory audit proof columns');

    console.log('\n====================================================');
    console.log(`  E2E TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test run error:', err);
    process.exit(1);
  }
}

runTests();
