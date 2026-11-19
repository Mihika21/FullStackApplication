# Changes Log (Cloned Instance)

This document tracks all files modified, created, and configured in this cloned workspace (`d:\Anitgravity\Application_cloned`).

## Strict Guardrails Followed
- The original project at `D:\Projects\GCC\AI Initiatives_GCC\GCC_Fullstack_applications\Documents\Documents_v.0.1` was only accessed in read-only mode during the copy operation.
- No files in the original project were modified, moved, deleted, or restarted.
- The original application running on `localhost:3000` remains active and untouched.

---

## File Modifications & Additions

### 1. `hgv-workforce-app/.env`
- **Action**: Created
- **Rationale**: Next.js and Prisma environment configuration. Specifies `PORT=3001` to bind the cloned server to port 3001, and `DATABASE_URL="file:./dev_3001.db"` to point the Prisma SQLite client to a separate isolated database file.

### 2. `hgv-workforce-app/package.json`
- **Action**: Modified
- **Lines changed**:
  - `"dev": "next dev -p 3000"` -> `"dev": "next dev -p 3001"`
  - `"start": "next start -p 3000"` -> `"start": "next start -p 3001"`
- **Rationale**: Sets the application's dev and production start port explicitly to 3001 to prevent collisions with the original application running on 3000.

### 3. `hgv-workforce-app/prisma/schema.prisma`
- **Action**: Modified
- **Lines changed**:
  - `url = "file:./dev.db"` -> `url = env("DATABASE_URL")`
- **Rationale**: Enables configurable database connection string via environment variables, allowing this instance to use `dev_3001.db` rather than the default `dev.db`.

### 4. `hgv-workforce-app/prisma/dev_3001.db`
- **Action**: Created (cloned from `dev.db`)
- **Rationale**: Provides a separate SQLite database instance for port 3001 so any read/write/recalculation operations performed in this workspace do not mutate the live database used by the original application on port 3000.

### 5. `hgv-workforce-app/test_e2e_api.js`
- **Action**: Modified
- **Rationale**: Updated default test target port from hardcoded `3000` to `PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001`, allowing integration/E2E test scripts in this workspace to verify the cloned application on port 3001 without hitting port 3000.

### 6. `CHANGES.md`
- **Action**: Created
- **Rationale**: Comprehensive log of changes made to the cloned repository as mandated by project requirements.

---

## Enterprise Learning & Compliance Platform (ELMS) Module Integration

Conforming strictly to **PRD-CORP-LMS-2026-V1.0** and enterprise regulatory standards (SOC 2 Type II, ISO/IEC 27001:2022, GDPR, POSH, OSHA):

### 1. Database Schema (`prisma/schema.prisma`)
- Added 12 new relational data models for ELMS:
  - `LmsCourse`: Master course records with compliance metadata, category, mandatory flag, 365-day recertification intervals, passing threshold, and video lock flag.
  - `LmsModule`: Hierarchical curriculum grouping.
  - `LmsLesson`: Multi-format lesson assets (VIDEO with skip-lock, TEXT/markdown, PDF slide decks).
  - `LmsLessonProgress`: Second-by-second playback tracking and lesson completion bookmarks.
  - `LmsQuiz`: Assessment configuration with passing percentage, attempt limits, and cooldown intervals.
  - `LmsQuestion`: Question bank supporting Single-Choice (MCQ_SINGLE), Multi-Select (MCQ_MULTI), and True/False (TRUE_FALSE).
  - `LmsQuestionOption`: Question choices with correct flags.
  - `LmsQuizAttempt`: Immutable submission records and scoring telemetry.
  - `LmsEnrollment`: Workflow state machine (ASSIGNED, IN_PROGRESS, COMPLETED, OVERDUE, EXPIRED) with due-date tracking.
  - `LmsCertificate`: Cryptographically hashed credentials with unique certificate numbers and SHA-256 digital verification hashes.
  - `LmsNudgeLog`: Audit trail of managerial reminder actions.
  - `LmsAuditTrail`: Write-once, append-only regulatory log with 7-year retention.

### 2. Backend REST API Routes (`src/app/api/v1/lms/...`)
- `/api/v1/lms/courses`: Catalog listing and admin course creation.
- `/api/v1/lms/courses/[id]`: Course details with nested modules, lessons, and quizzes.
- `/api/v1/lms/enrollments`: Enrollment queries and rule-based dynamic assignment.
- `/api/v1/lms/lessons/progress`: Watch duration tracking and progress calculation.
- `/api/v1/lms/quiz/submit`: Real-time assessment grading, remediation feedback, and automatic certificate issuance upon passing.
- `/api/v1/lms/certificates`: Certified credential wallet retrieval.
- `/api/v1/lms/verify`: Public/internal statutory certificate verification engine.
- `/api/v1/lms/manager/heatmap`: Team compliance matrix and department aggregation.
- `/api/v1/lms/manager/nudge`: 1-click individual and bulk multi-channel reminder dispatcher.
- `/api/v1/lms/recertification/run`: 365-day recertification lifecycle engine (T-30 auto-re-enrollment).
- `/api/v1/lms/analytics`: Executive compliance scorecard and department rankings.
- `/api/v1/lms/audit`: Filterable immutable audit trail viewer.
- `/api/v1/lms/reports/export`: 1-click SOC 2 / ISO 27001 regulatory compliance evidence export (CSV).

### 3. Frontend Web Applications (`src/app/lms/...`)
- `/lms` (**Learner Portal**): Priority-driven dashboard with urgent overdue alert banner, course progress tracking, and digital certificate wallet with client-side PDF downloads.
- `/lms/learn/[courseId]` (**Interactive Learning Player**): Multi-format player with video fast-forward lockout for compliance, slide carousel, rich text notes, and interactive quiz with remediation review.
- `/lms/manager` (**People Manager Command Center**): Team compliance heatmap matrix, summary KPI gauges, 1-click individual and bulk nudge triggers, and team CSV exports.
- `/lms/courses` (**Course Authoring & CMS**): Management hub for L&D admins to create, edit, and publish courses.
- `/lms/analytics` (**Executive Compliance Scorecard**): Company-wide compliance % gauge vs ≥ 99.5% target SLA, department rankings, recertification engine triggers, and immutable audit explorer.
- `/lms/verify` (**Certificate Verification Registry**): Public/internal verification portal by certificate number, UUID, or SHA-256 hash.

### 4. Seed Data & Verification
- `prisma/seed_lms.js`: Seeded 6 realistic courses (4 mandatory compliance, 2 electives), realistic workforce enrollments, certificates with SHA-256 signatures, past nudge logs, and audit entries.
- `test_lms_e2e.js`: 44 automated end-to-end verification checks covering the full ELMS lifecycle (100% pass rate).

