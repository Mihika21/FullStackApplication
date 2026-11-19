import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()

    # Set Margins (1 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Base Colors
    COLOR_NAVY = RGBColor(15, 23, 42)     # #0F172A
    COLOR_TEAL = RGBColor(13, 148, 136)   # #0D9488
    COLOR_SLATE = RGBColor(71, 85, 105)   # #475569
    COLOR_MUTED = RGBColor(100, 116, 139) # #64748B

    # Document Header / Pre-title
    p_meta = doc.add_paragraph()
    r_badge = p_meta.add_run("ENTERPRISE WORKFORCE & LEARNING PLATFORM (HGV ELMS)")
    r_badge.font.size = Pt(9)
    r_badge.font.bold = True
    r_badge.font.color.rgb = COLOR_TEAL

    # Document Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("End-to-End Cycle & Navigation Guide for 5 Configured Employees")
    r_title.font.size = Pt(24)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_NAVY

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(18)
    r_sub = p_sub.add_run(
        "A Comprehensive Verification Manual Across Workforce Master Data, Skill Matrix & Capability Management, "
        "and Enterprise Learning & Compliance Platform (ELMS)"
    )
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = COLOR_SLATE

    # Metadata Block Table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    meta_data = [
        ("Application Instance:", "http://localhost:3001 (Isolated Port 3001)"),
        ("Specification Standards:", "PRD-CORP-LMS-2026-V1.0 | AICPA SOC 2 Type II | ISO/IEC 27001:2022"),
        ("Configured Employees:", "Aanya Sen, Rohan Deshmukh, Meera Krishnan, Vikramaditya Nair, Pooja Hegde"),
        ("Author & Verification Suite:", "Enterprise QA & Engineering Core Automation Team"),
    ]

    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = COLOR_NAVY
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 1: EXECUTIVE SUMMARY & TRI-MODULE UNIFIED ARCHITECTURE
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. Executive Summary & Tri-Module Unified Data Architecture")
    r.font.color.rgb = COLOR_NAVY
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run(
        "The Enterprise Learning & Compliance Platform (ELMS) operates as a deeply interconnected layer within the "
        "existing HGV Workforce Ecosystem. Rather than operating in an isolated silo, every employee record flows "
        "seamlessly through a three-stage lifecycle:"
    )

    p_flow1 = doc.add_paragraph(style='List Bullet')
    r = p_flow1.add_run("Module 1: Workforce Master Data (/workforce): ")
    r.font.bold = True
    p_flow1.add_run(
        "Serves as the Single Source of Truth (SSOT) for workforce identity, legal engagement model (GCC, NOC, Rebadge), "
        "departmental classification, grade level, reporting manager (Jeff Chu), shift allowance rules (General vs. 24x7 NOC), "
        "and compensation parameters."
    )

    p_flow2 = doc.add_paragraph(style='List Bullet')
    r = p_flow2.add_run("Module 2: Skill Matrix & Capability Management (/skills): ")
    r.font.bold = True
    p_flow2.add_run(
        "Tracks employee competencies across 12 standardized enterprise skills (Levels 0 to 5), confirmed project allocations "
        "across active enterprise initiatives (e.g. Cloud Migration, Core Data Platform), verified external industry certifications, "
        "and real-time bench capacity calculations."
    )

    p_flow3 = doc.add_paragraph(style='List Bullet')
    r = p_flow3.add_run("Module 3: Learning Management System (/lms): ")
    r.font.bold = True
    p_flow3.add_run(
        "Consumes the workforce identity and management hierarchy to enforce regulatory compliance tracks (Annual Cybersecurity, "
        "POSH, GDPR, OSHA), interactive video/slide lessons, question-level remediation quizzes, automated 365-day recertification "
        "lifecycles, people manager heatmaps with 1-click single/bulk nudges, and tamper-evident SHA-256 digital certificate wallets."
    )

    # -------------------------------------------------------------
    # SECTION 2: THE 5 CONFIGURED EMPLOYEES AT A GLANCE
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("2. The 5 Test Employees Matrix & Compliance Personas")
    r.font.color.rgb = COLOR_NAVY
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run(
        "To enable rigorous end-to-end testing across every edge case and lifecycle state, five high-fidelity employee profiles "
        "have been seeded into the system. Each employee represents a distinct organizational role, project allocation, and LMS compliance state:"
    )

    # 5 Employees Table
    emp_table = doc.add_table(rows=6, cols=6)
    emp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    emp_table.autofit = False

    headers = ["Emp ID", "Employee Name", "Role & Dept", "Skill Highlights", "LMS Persona & State", "Login Email"]
    widths = [Inches(0.9), Inches(1.1), Inches(1.3), Inches(1.3), Inches(1.3), Inches(1.1)]

    # Header Row
    hdr_row = emp_table.rows[0]
    for j, h_text in enumerate(headers):
        cell = hdr_row.cells[j]
        cell.width = widths[j]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 100, 100, 80, 80)
        p = cell.paragraphs[0]
        r = p.add_run(h_text)
        r.font.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    emp_rows = [
        ("IN01809001", "Aanya Sen", "Lead Cloud Architect\n(Cloud Platform)", "Azure (L5), DevOps (L4), Python (L4), Mentoring (L4)", "100% Exemplary Certified\nAll 4 mandatory courses complete with SHA-256 certs", "aanya.sen@hgv.com"),
        ("IN01809002", "Rohan Deshmukh", "Senior Full Stack Eng.\n(Software Eng.)", "React (L5), Java (L4), SQL (L4), Python (L3)", "Active In-Progress\nCyber complete, POSH at 65%, 2 assigned (80% alloc)", "rohan.deshmukh@hgv.com"),
        ("IN01809003", "Meera Krishnan", "Staff Data & ML Eng.\n(Data & AI)", "Python (L5), SQL (L5), Data Eng (L5), ML (L4)", "Overdue Compliance Alert\nCybersecurity 5 days overdue (triggers SLA banner & nudges)", "meera.krishnan@hgv.com"),
        ("IN01809004", "Vikramaditya Nair", "24x7 NOC & SRE Lead\n(Infrastructure/NOC)", "DevOps (L5), Azure (L4), Test Auto (L3), 24x7 Shift", "T-30 Recertification Radar\nCertified 340 days ago; due in 25 days (renewal radar)", "vikramaditya.nair@hgv.com"),
        ("IN01809005", "Pooja Hegde", "Lead QA Automation Eng.\n(Quality Eng.)", "Test Auto (L5), Python (L4), Hospitality (L4), Java (L3)", "New Hire Onboarding\nFresh hire (17d ago); 4 mandatory courses with 30d clock", "pooja.hegde@hgv.com"),
    ]

    for i, data in enumerate(emp_rows):
        row = emp_table.rows[i + 1]
        bg = "FFFFFF" if i % 2 == 0 else "F8FAFC"
        for j, val in enumerate(data):
            cell = row.cells[j]
            cell.width = widths[j]
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if j == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_NAVY
            elif j == 4 and "Overdue" in val:
                r.font.bold = True
                r.font.color.rgb = RGBColor(190, 18, 60) # Red
            elif j == 4 and "100%" in val:
                r.font.bold = True
                r.font.color.rgb = RGBColor(13, 148, 136) # Teal
            else:
                r.font.color.rgb = COLOR_SLATE

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # SECTION 3: MODULE 1 NAVIGATION - WORKFORCE MASTER DATA
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. Step-by-Step Navigation: Module 1 — Workforce Master Data")
    r.font.color.rgb = COLOR_NAVY
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run(
        "Workforce Master Data serves as the foundation of employee records. Follow these exact steps to inspect "
        "and verify how the 5 employees are reflected in the master roster and individual profiles:"
    )

    steps_wf = [
        ("Step 1.1: Open Workforce Master Roster", "Navigate to http://localhost:3001/workforce in your web browser, or click 'Workforce' in the left-hand navigation sidebar under CORE WORKFORCE."),
        ("Step 1.2: Search by Employee ID or Name", "In the search input box above the table, type 'IN018090' or search by individual names: 'Aanya', 'Rohan', 'Meera', 'Vikramaditya', or 'Pooja'. The table instantly filters down to the 5 records."),
        ("Step 1.3: Inspect Reporting Hierarchy", "Notice that all 5 employees list 'Jeff Chu' as their Reporting Manager and Domain Lead. This ensures they automatically link into Jeff Chu's Team Compliance Heatmap in the LMS module."),
        ("Step 1.4: View Detailed Employee Profile", "Click the 'Eye' (View) icon or the employee name on any row (e.g. Aanya Sen) to navigate to /workforce/[id]. Verify the tabs: Personal & Contact Details (hgvEmail, mobile, emergency contact), Organization & Job (Practice, Sub-Practice, Grade Level), Compensation (Fixed CTC & Variable Pay), and Address (Bangalore - GCC Tech Park)."),
        ("Step 1.5: Validate Shift Allowance Configuration", "Navigate to /workforce/[id] for Vikramaditya Nair (IN01809004). Note that his Shift Type is configured as '24x7 NOC Rotational', entitling him to the $250/mo shift allowance under the deterministic billing engine."),
    ]

    for title, desc in steps_wf:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(f"• {title}: ")
        r.font.bold = True
        r.font.color.rgb = COLOR_TEAL
        p.add_run(desc)

    # -------------------------------------------------------------
    # SECTION 4: MODULE 2 NAVIGATION - SKILL MATRIX & CAPABILITY MANAGEMENT
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. Step-by-Step Navigation: Module 2 — Skill Matrix & Capability Platform")
    r.font.color.rgb = COLOR_NAVY
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run(
        "The Skill Matrix connects each employee's core technical competencies, verified proficiency levels, project allocations, "
        "and bench capacity. Follow these steps to verify skill mappings:"
    )

    steps_sk = [
        ("Step 2.1: Open Skill Matrix Hub", "Navigate to http://localhost:3001/skills in your browser or click 'Skill Matrix' in the sidebar."),
        ("Step 2.2: Filter by Employee in the Matrix View", "In the 'Search Employee by Name...' search box, type 'Aanya'. Observe her row in the matrix: Practice shows 'Cloud Architecture', Confirmed Allocation is '100%' on Project 'HGV Cloud Migration', and Free Capacity is '0%'."),
        ("Step 2.3: Verify Competency Badges & Levels", "Inspect the skill columns. Aanya displays Azure (L5 Expert - dark green badge), DevOps / CI-CD (L4 Advanced - indigo badge), Python (L4 Advanced), SQL (L3 Proficient), and Mentoring (L4 Advanced)."),
        ("Step 2.4: Verify Partial Allocations & Bench Capacity", "Search for 'Rohan Deshmukh' or 'Meera Krishnan'. Rohan shows 80% confirmed allocation on 'HGV Core Data Platform' with 20% available capacity. Meera shows 70% allocation with 30% available capacity, demonstrating real-time bench tracking."),
        ("Step 2.5: Test Practice & Domain Filtering", "In the top filter bar, select Practice 'Data Engineering'. The matrix dynamically filters to display Meera Krishnan and relevant data engineers with their SQL, Data Engineering, and Machine Learning ratings."),
    ]

    for title, desc in steps_sk:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(f"• {title}: ")
        r.font.bold = True
        r.font.color.rgb = COLOR_TEAL
        p.add_run(desc)

    # -------------------------------------------------------------
    # SECTION 5: MODULE 3 NAVIGATION - LEARNING MANAGEMENT SYSTEM (LMS)
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("5. Step-by-Step Navigation: Module 3 — Learning Management System (LMS)")
    r.font.color.rgb = COLOR_NAVY
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run(
        "The LMS provides compliance tracking across learners, managers, and auditors. Test the end-to-end cycle using these sub-views:"
    )

    h2 = doc.add_heading(level=2)
    r = h2.add_run("5.1 People Manager Command Center & Team Heatmap (/lms/manager)")
    r.font.color.rgb = COLOR_TEAL

    p = doc.add_paragraph()
    p.add_run(
        "The Manager Command Center allows People Managers (Jeff Chu) to monitor direct report compliance across mandatory statutory tracks:"
    )

    steps_mgr = [
        ("Step 3.1: Switch Persona to Jeff Chu", "Click the 'Active Role' dropdown in the top navbar and select 'Jeff Chu (People Manager)'. The navbar updates with JC avatar and GCC Lead persona."),
        ("Step 3.2: Open Manager Heatmap", "Click 'Manager Heatmap' in the sidebar or navigate to http://localhost:3001/lms/manager. Ensure the Manager filter is set to 'Jeff Chu'."),
        ("Step 3.3: Inspect Direct Reports Matrix", "Locate the 5 employees in the heatmap. Note the distinct status badges across all 4 mandatory statutory courses:"),
        ("  • Aanya Sen", "Shows all Green checkmarks (Completed) with 100% scores and issued certificate IDs."),
        ("  • Rohan Deshmukh", "Shows Cybersecurity (Green Completed), Anti-Harassment (Blue In-Progress at 65%), and GDPR / OSHA (Gray Assigned)."),
        ("  • Meera Krishnan", "Shows Cybersecurity with a RED badge (OVERDUE - 5 days past due date)."),
        ("  • Vikramaditya Nair", "Shows all Green Completed badges. Cybersecurity was certified 340 days ago, flagged under the T-30 recertification radar."),
        ("  • Pooja Hegde", "Shows all Blue/Gray Assigned badges with active 30-day onboarding countdowns."),
        ("Step 3.4: Test 1-Click Single Nudge", "On Meera Krishnan's row, click the 'Send Nudge' button next to her Overdue Cybersecurity course. A modal opens with pre-populated multi-channel options (Email, Slack, MS Teams). Select Slack, review the alert message, and click 'Confirm & Dispatch Nudge'. A confirmation toast appears and the audit log records the dispatch."),
        ("Step 3.5: Test Bulk Overdue Nudges", "Click the 'Nudge All Overdue (1)' button at the top of the heatmap table to test mass dispatching across all delinquent direct reports."),
        ("Step 3.6: Export Team Compliance CSV", "Click 'Export Team Matrix (CSV)'. Open the downloaded CSV to verify employee IDs, names, course codes, completion percentages, and due dates."),
    ]

    for item in steps_mgr:
        title, desc = item
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(f"{title}: ")
        r.font.bold = True
        r.font.color.rgb = COLOR_NAVY if "•" in title else COLOR_TEAL
        p.add_run(desc)

    h2 = doc.add_heading(level=2)
    r = h2.add_run("5.2 Learner Portal & Digital Certificate Wallet (/lms)")
    r.font.color.rgb = COLOR_TEAL

    p = doc.add_paragraph()
    p.add_run(
        "The Learner Portal is the personal dashboard where workforce members track deadlines, launch lessons, attempt quizzes, and download credentials:"
    )

    steps_learn = [
        ("Step 3.7: Open Learner Portal", "Navigate to http://localhost:3001/lms or click 'Learner Portal' in the sidebar."),
        ("Step 3.8: Inspect KPI Dashboard Cards", "Review the 4 primary KPI cards at the top: Completed Courses, In Progress, Certificates Earned, and Overdue Alerts."),
        ("Step 3.9: Experience the Urgent Overdue Alert Banner", "When viewing as an employee with delinquent courses (e.g. Meera Krishnan), an eye-catching red gradient alert banner appears at the top: 'High-Priority Compliance Deadlines - Action Required', detailing days overdue and direct links to resume."),
        ("Step 3.10: Open Digital Certificate Wallet", "Click the 'Digital Certificate Wallet' button in the top-right header. A modal opens listing all earned statutory credentials with certificate numbers, issue dates, 365-day expiration dates, scores, and cryptographic SHA-256 hashes."),
        ("Step 3.11: Download Official Landscape Certificate PDF", "Click 'Download Official PDF' on any certificate (e.g. Aanya Sen's Cybersecurity certificate). The client-side jsPDF engine generates a high-resolution landscape certificate featuring executive signatures, royal navy/teal borders, and the SHA-256 integrity block."),
    ]

    for title, desc in steps_learn:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(f"• {title}: ")
        r.font.bold = True
        r.font.color.rgb = COLOR_TEAL
        p.add_run(desc)

    h2 = doc.add_heading(level=2)
    r = h2.add_run("5.3 Interactive Course Player & Graded Quiz Studio (/lms/learn/[courseId])")
    r.font.color.rgb = COLOR_TEAL

    steps_player = [
        ("Step 3.12: Launch Course Player", "On the Learner Portal, click 'Start Course' or 'Resume Learning' on 'Annual Cybersecurity Awareness 2027'. You are taken to /lms/learn/895b6d57-94d8-43de-a5b7-adbc93db3951."),
        ("Step 3.13: Experience Multi-Format Lessons", "Switch between lessons in the left sidebar: Lesson 1 (Enterprise Video with Fast-Forward compliance lockout), Lesson 2 (Rich Markdown Security Policies), and Lesson 3 (Interactive PDF Slide Carousel)."),
        ("Step 3.14: Attempt Graded Quiz", "Click 'Final Assessment' in the course curriculum. Answer the multiple choice questions (single-select, multi-select, and true/false). Click 'Submit Final Assessment'."),
        ("Step 3.15: Review Instant Remediation", "Upon submission, the engine scores the attempt against the 80% passing threshold. If passed, congratulations confetti appears and the certificate is immediately issued into your wallet. Each question displays an explanatory remediation note citing the regulatory standard."),
    ]

    for title, desc in steps_player:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(f"• {title}: ")
        r.font.bold = True
        r.font.color.rgb = COLOR_TEAL
        p.add_run(desc)

    h2 = doc.add_heading(level=2)
    r = h2.add_run("5.4 Statutory Certificate Verification Registry (/lms/verify)")
    r.font.color.rgb = COLOR_TEAL

    steps_verify = [
        ("Step 3.16: Open Verification Portal", "Navigate to http://localhost:3001/lms/verify or click 'Verify Certificate' in the sidebar."),
        ("Step 3.17: Verify Certificate Number", "In the search input, enter certificate number 'CERT-2026-ANNUA-9001' (Aanya Sen's Cybersecurity certificate) and click 'Verify Credential'."),
        ("Step 3.18: Inspect Integrity Card", "The registry renders an official green verification badge: 'VERIFIED AUTHENTIC'. It displays Recipient: Aanya Sen, Course: Annual Cybersecurity Awareness 2027, Score: 100%, Issue Date, Expiration Date, and the exact 64-character SHA-256 cryptographic hash."),
        ("Step 3.19: Test Negative Verification", "Type an invalid certificate number such as 'CERT-FAKE-9999'. The system displays a red 'No Verified Credential Found' error banner, proving anti-tampering validation."),
    ]

    for title, desc in steps_verify:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(f"• {title}: ")
        r.font.bold = True
        r.font.color.rgb = COLOR_TEAL
        p.add_run(desc)

    # -------------------------------------------------------------
    # SECTION 6: EXECUTIVE COMPLIANCE SCORECARD & AUDIT PACKAGE EXPORT
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("6. Executive Scorecard & SOC 2 / ISO 27001 Audit Evidence Export")
    r.font.color.rgb = COLOR_NAVY
    r.font.bold = True

    p = doc.add_paragraph()
    p.add_run(
        "For compliance auditors (Marcus Vance) and Super Admins (Sarah Jenkins), the platform provides automated recertification "
        "and statutory audit export tools:"
    )

    steps_audit = [
        ("Step 4.1: Switch Persona to Sarah Jenkins or Marcus Vance", "In the TopNavbar, switch to 'Sarah Jenkins (Super Admin)' or 'Marcus Vance (Compliance Auditor)'."),
        ("Step 4.2: Open Compliance Scorecard", "Navigate to http://localhost:3001/lms/analytics or click 'Compliance Scorecard' in the sidebar."),
        ("Step 4.3: Inspect Executive Metrics", "Review the radial compliance gauge showing organizational compliance against the 99.5% statutory target SLA, department ranking bars, and the overdue escalation tracker."),
        ("Step 4.4: Trigger Automated 365-Day Recertification Scan", "Click 'Run Recertification Scan'. The backend scans all active certificates, automatically flags delinquent records, and identifies certificates within the T-30 pre-expiry radar (such as Vikramaditya Nair). A success toast reports scan outcomes."),
        ("Step 4.5: Export Official SOC 2 / ISO 27001 CSV Package", "Click 'Export Audit Package (CSV)'. The API streams a standardized CSV evidence file containing employee IDs, legal names, course codes, completion timestamps, scores, and SHA-256 hash proofs ready for regulatory audit presentation."),
        ("Step 4.6: Inspect Immutable Audit Trail", "Scroll down to the 'Immutable Statutory Audit Trail' table. View timestamped entries for every action: ENROLLMENT_CREATED, VIDEO_PROGRESS, QUIZ_SUBMIT, CERTIFICATE_ISSUED, and NUDGE_SENT with actor roles and IP addresses."),
    ]

    for title, desc in steps_audit:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(f"• {title}: ")
        r.font.bold = True
        r.font.color.rgb = COLOR_TEAL
        p.add_run(desc)

    # -------------------------------------------------------------
    # SECTION 7: DETAILED EMPLOYEE-BY-EMPLOYEE TESTING RUNBOOK
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("7. Detailed Employee-by-Employee Testing Runbook")
    r.font.color.rgb = COLOR_NAVY
    r.font.bold = True

    employees_runbook = [
        {
            "name": "Employee 1: Aanya Sen (IN01809001)",
            "persona": "100% Exemplary Certified Leader",
            "desc": "Demonstrates a pristine, high-performing senior cloud architect who is 100% compliant across all statutory mandates.",
            "workforce": "Search 'Aanya' in /workforce. Verify Role: Lead Cloud Solutions Architect, Department: Cloud & Platform Engineering, Practice: Cloud Architecture, Grade Level: L5, CTC: ₹36,00,000, Reporting Manager: Jeff Chu.",
            "skills": "Search 'Aanya' in /skills. Verify Azure (L5), DevOps/CI-CD (L4), Python (L4), SQL (L3), Mentoring (L4). Project allocation: 100% confirmed on 'HGV Cloud Migration'.",
            "lms_mgr": "In /lms/manager (Jeff Chu), Aanya shows 4/4 Green Completed checkmarks with 100% scores. Team compliance status: 'Fully Compliant'.",
            "lms_portal": "In /lms, her Certificate Wallet contains 4 active credentials. Test verifying 'CERT-2026-ANNUA-9001' at /lms/verify to inspect her SHA-256 hash. She is also self-enrolled in the elective 'Enterprise Leadership' at 50% progress.",
        },
        {
            "name": "Employee 2: Rohan Deshmukh (IN01809002)",
            "persona": "Active In-Progress Software Engineer",
            "desc": "Demonstrates an active engineer progressing through curriculum with partial completion and available bench capacity.",
            "workforce": "Search 'Rohan' in /workforce. Verify Role: Senior Full Stack Software Engineer, Department: Software Engineering, Practice: Full Stack Development, CTC: ₹28,00,000.",
            "skills": "Search 'Rohan' in /skills. Verify React (L5), Java (L4), SQL (L4). Project allocation on 'HGV Core Data Platform' is 80%, with 20% free bench capacity.",
            "lms_mgr": "In /lms/manager, Rohan shows Cybersecurity (Green Completed), Anti-Harassment (Blue In-Progress - 65%), and GDPR / OSHA (Gray Assigned with due dates in ~20 days).",
            "lms_portal": "In /lms/learn/[courseId], Rohan can resume Lesson 2 of Anti-Harassment and complete the POSH quiz to earn his second certificate.",
        },
        {
            "name": "Employee 3: Meera Krishnan (IN01809003)",
            "persona": "Overdue Compliance Alert & Managerial Escalation",
            "desc": "Demonstrates SLA breach detection, manager alert indicators, and the multi-channel 1-click nudge workflow.",
            "workforce": "Search 'Meera' in /workforce. Verify Role: Staff Data & Machine Learning Engineer, Department: Data & AI, Practice: Data Engineering, CTC: ₹34,00,000.",
            "skills": "Search 'Meera' in /skills. Verify Python (L5), SQL (L5), Data Engineering (L5), ML (L4). Allocation: 70% confirmed, 30% capacity.",
            "lms_mgr": "In /lms/manager, Meera displays a prominent RED badge for Annual Cybersecurity Awareness (5 days overdue). Click 'Send Nudge' on her row to test dispatching Slack/Email/Teams reminders.",
            "lms_portal": "In /lms, the urgent red banner highlights her overdue Cybersecurity course, with a direct 'Resume Course' action button.",
        },
        {
            "name": "Employee 4: Vikramaditya Nair (IN01809004)",
            "persona": "T-30 Recertification Lifecycle Radar",
            "desc": "Demonstrates 24x7 NOC operational shifts with shift allowance, plus the automated 365-day recertification renewal radar.",
            "workforce": "Search 'Vikramaditya' in /workforce. Verify Shift Type: NOC_24X7 ($250/mo allowance), Department: Infrastructure & NOC, Practice: DevOps & Cloud Ops.",
            "skills": "Search 'Vikramaditya' in /skills. Verify DevOps / CI-CD (L5), Azure (L4). Project allocation: 100% on 'NOC Command Center 24x7'.",
            "lms_mgr": "In /lms/manager, all 4 courses show Completed. Cybersecurity was issued 340 days ago, making it due for annual re-certification in 25 days.",
            "lms_portal": "When running the Recertification Scan in /lms/analytics, Vikramaditya is automatically flagged under the T-30 pre-expiry radar for re-certification.",
        },
        {
            "name": "Employee 5: Pooja Hegde (IN01809005)",
            "persona": "New Employee Compliance Onboarding",
            "desc": "Demonstrates the automated compliance assignment workflow for newly joined workforce members.",
            "workforce": "Search 'Pooja' in /workforce. Verify Date of Joining: 2026-11-01 (joined 17 days ago), Role: Lead QA Automation Engineer, Department: Quality Engineering & Testing.",
            "skills": "Search 'Pooja' in /skills. Verify Test Automation (L5), Python (L4), Hospitality Domain (L4). Allocation: 90% on 'Hospitality Tech QA Suite'.",
            "lms_mgr": "In /lms/manager, Pooja shows all 4 courses in Assigned state with active 30-day onboarding countdown clocks.",
            "lms_portal": "In /lms, all 4 mandatory tracks are listed under her active queue with 'Start Course' buttons, ready for onboarding completion.",
        },
    ]

    for item in employees_runbook:
        h2 = doc.add_heading(level=2)
        r = h2.add_run(item["name"])
        r.font.color.rgb = COLOR_NAVY
        
        p = doc.add_paragraph()
        r_p = p.add_run(f"Persona: {item['persona']}")
        r_p.font.bold = True
        r_p.font.color.rgb = COLOR_TEAL
        p.add_run(f"\n{item['desc']}")

        p_wf = doc.add_paragraph(style='List Bullet')
        r = p_wf.add_run("Workforce Master Data: ")
        r.font.bold = True
        p_wf.add_run(item["workforce"])

        p_sk = doc.add_paragraph(style='List Bullet')
        r = p_sk.add_run("Skill Matrix: ")
        r.font.bold = True
        p_sk.add_run(item["skills"])

        p_lm = doc.add_paragraph(style='List Bullet')
        r = p_lm.add_run("Manager Heatmap: ")
        r.font.bold = True
        p_lm.add_run(item["lms_mgr"])

        p_lp = doc.add_paragraph(style='List Bullet')
        r = p_lp.add_run("Learner Portal & Verification: ")
        r.font.bold = True
        p_lp.add_run(item["lms_portal"])

    # -------------------------------------------------------------
    # SECTION 8: QA TESTING VERIFICATION CHECKLIST
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r = h1.add_run("8. QA Verification & End-to-End Acceptance Checklist")
    r.font.color.rgb = COLOR_NAVY
    r.font.bold = True

    checklist_items = [
        "Workforce Roster (/workforce) lists all 5 employees with accurate employee IDs, departments, and reporting managers.",
        "Employee Profile (/workforce/[id]) renders personal, contact, address, compensation, and shift details for each employee.",
        "Shift Allowance Engine correctly identifies Vikramaditya Nair's 24x7 NOC rotational shift allowance ($250/mo).",
        "Capability Matrix (/skills) displays skill ratings across Technical, Functional, and Behavioural categories for all 5 employees.",
        "Project Allocations are confirmed on real enterprise projects with accurate allocation % and free capacity tracking.",
        "Manager Heatmap (/lms/manager) accurately displays all 5 employees under Jeff Chu with status badges (Green, Blue, Red, Gray).",
        "1-Click Single Nudge modal successfully sends multi-channel reminders (Email, Slack, Teams) for Meera Krishnan's overdue course.",
        "Bulk Nudge trigger successfully identifies delinquent learners and logs multi-channel reminder dispatches.",
        "Learner Portal (/lms) displays urgent priority alert banners for overdue compliance courses.",
        "Interactive Course Player (/lms/learn/[courseId]) enforces video completion lockout on statutory courses and records second-by-second progress.",
        "Graded Quiz Engine scores attempts accurately against 80% passing thresholds and renders question-level remediation notes.",
        "Digital Certificate Wallet generates and downloads crisp landscape PDF certificates via jsPDF with official signatures.",
        "Certificate Verification Portal (/lms/verify) validates authentic SHA-256 hashes and rejects tampered or invalid certificate numbers.",
        "Compliance Scorecard (/lms/analytics) calculates compliance SLA against 99.5% target and tracks overdue escalation SLAs.",
        "Automated Recertification Engine successfully flags certificates nearing the 365-day cadence (T-30 radar).",
        "SOC 2 / ISO 27001 CSV Export streams complete audit evidence records with tamper-evident cryptographic checksums.",
    ]

    for item in checklist_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run("[  ] ")
        r.font.bold = True
        r.font.color.rgb = COLOR_TEAL
        p.add_run(item)

    # Save document
    out_dir = "D:\\Anitgravity\\Application_cloned\\hgv-workforce-app\\docs"
    out_path = os.path.join(out_dir, "HGV_5_Employees_End_To_End_Testing_Guide.docx")
    doc.save(out_path)
    print(f"[SUCCESS] Document saved successfully to: {out_path}")

    # Also copy to artifacts directory
    artifact_dir = "C:\\Users\\mihika.verma\\.gemini\\antigravity\\brain\\9cc5af42-4f5b-4a1b-92e0-36a433d9e5fa"
    if os.path.exists(artifact_dir):
        artifact_path = os.path.join(artifact_dir, "HGV_5_Employees_End_To_End_Testing_Guide.docx")
        shutil.copyfile(out_path, artifact_path)
        print(f"[SUCCESS] Document also copied to artifact directory: {artifact_path}")

if __name__ == "__main__":
    create_document()
