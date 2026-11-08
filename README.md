# HGV GCC Workforce Master Data & Billing Platform

An enterprise full-stack web application designed to replace fragmented Excel workbooks with a centralized, single source of truth for workforce master data, compensation tracking, configurable billing calculations, bulk CSV imports, and finance-ready reports.

---

## 📌 Table of Contents
- [Executive Overview](#-executive-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Environment Configuration](#environment-configuration)
  - [Database Initialization & Seeding](#database-initialization--seeding)
  - [Running the Application](#running-the-application)
- [Demo / Seed Accounts](#-demo--seed-accounts)
- [Testing & Quality Assurance](#-testing--qa)
- [Project Documentation](#-project-documentation)
- [License](#-license)

---

## 🚀 Executive Overview

The **HGV GCC Workforce Master Data & Billing Platform** centralizes workforce administration across multiple engagement models:
* **GCC & NOC:** Salary-based billing with compensation tracking, shift allowances, and joining bonus amortization.
* **Rebadge & Colocation:** Facility and user-bundle billing.
* **Non-GCC Fixed Bid:** Workforce master data retention without automated billing calculations.

It enforces strict data validation, prevents data drift, automates complex billing rules, and provides auditable tracking across all master data updates.

---

## ✨ Key Features

* **Workforce Master Data:**
  * Complete lifecycle management (Active, Inactive, Attrition tracking).
  * Dynamic mandatory fields dependent on engagement type.
  * Controlled reference data (Domain Leads, Sources, Shift Types).
* **Configurable Billing Engine:**
  * Configurable rate cards and effective-dated rule versions.
  * Automated joining bonus amortization across the first 3 billing months.
  * Flexible variable pay modeling (None, Flat %, Custom Amount).
  * Shift allowance overrides with PMO monthly validation.
* **Bulk Upload & Data Ingestion (`/bulk-upload`):**
  * Master data onboarding via CSV.
  * Bulk updates and monthly shift allowance adjustments.
  * Staging validation with row-level error reporting and partial-success processing.
* **Reporting & Export Engine (`/reports`):**
  * Headcount Reports, Billing Summary, and Master Data dumps.
  * Formatted export to **Excel (.xlsx)** via ExcelJS and **PDF** via jsPDF.
* **Security & Governance:**
  * Role-Based Access Control (RBAC): `HR Manager`, `HR Team Member`, `GCC Lead`.
  * Comprehensive Audit Trail (`/audit`) capturing user actions, timestamps, and previous/new values.

---

## 🛠 Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript 5 |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) icons |
| **Backend / API** | Next.js API Routes (RESTful architecture) |
| **Database & ORM** | [Prisma ORM 5](https://www.prisma.io/) with SQLite (local development / isolated clone) |
| **Data Parsing & Reports** | [PapaParse](https://www.papaparse.com/) (CSV parsing), [ExcelJS](https://github.com/exceljs/exceljs), [jsPDF](https://github.com/parallax/jsPDF) |
| **Validation** | [Zod](https://zod.dev/) runtime schema validation |

---

## 📁 Repository Structure

```text
├── App_Flow_v1.0.docx / .txt                 # Application architecture and user flows
├── Content_Guidelines_v1.0.docx / .txt       # Copywriting and field guidelines
├── HGV_Workforce_Platform_Presentation.docx  # Platform walkthrough and demo script
├── Implementation_Plan_v1.0.docx / .txt      # Phase 1 milestones and timeline
├── PRD_v1.0.docx / .txt                      # Product Requirements Document
├── Tech_Stack_Backend_Schema_v1.0.docx / .txt# Technical specs and schema design
├── CHANGES.md                                # Isolated clone log (port 3001 & dev_3001.db)
├── README.md                                 # Project documentation
│
└── hgv-workforce-app/                        # Next.js Application Root
    ├── prisma/
    │   ├── schema.prisma                     # Prisma data model
    │   ├── seed.js                           # Database seeder (roles, users, sample data)
    │   └── dev_3001.db                       # Local SQLite database
    ├── public/                               # Sample and validation CSV files
    ├── src/
    │   ├── app/                              # App Router pages and API endpoints
    │   │   ├── api/v1/                       # RESTful API routes (audit, billing, imports...)
    │   │   ├── bulk-upload/                  # CSV bulk upload screens
    │   │   ├── billing-configuration/        # Billing rule configuration screen
    │   │   ├── dashboard/                    # Overview metrics and KPI cards
    │   │   ├── reports/                      # Headcount and billing reports
    │   │   ├── workforce/                    # Employee management screens
    │   │   ├── audit/                        # Audit log viewer
    │   │   └── login/                        # Authentication screen
    │   ├── components/                       # Shared UI and layout components
    │   ├── context/                          # Client AuthContext and state providers
    │   └── lib/                              # Billing engine, audit utils, and Prisma client
    ├── package.json                          # Dependencies and npm scripts
    ├── test_billing.js                       # Billing calculation test script
    └── test_e2e_api.js                       # End-to-end API test script
```

---

## 🏁 Getting Started

### Prerequisites
* **Node.js**: v18.17.0 or higher (v20.x recommended)
* **npm**: v9.x or higher

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mihika21/FullStackApplication.git
   cd FullStackApplication/hgv-workforce-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file inside the `hgv-workforce-app` directory:

```env
PORT=3001
DATABASE_URL="file:./dev_3001.db"
```

> **Note:** If running in a standalone environment without port conflicts, you can set `PORT=3000` and use `dev.db`.

### Database Initialization & Seeding

Generate Prisma client, apply schema migrations, and seed initial reference data:

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Push Schema to Database
npm run prisma:push

# 3. Seed Reference Data & Demo Users
npm run prisma:seed
```

### Running the Application

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 👥 Demo / Seed Accounts

The database seeder provisions predefined accounts covering all role permissions:

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **HR Manager** | `sarah.jenkins@hgv.com` | Full master data, compensation, Billing Configuration, user admin, and audit logs. |
| **HR Team Member** | `alex.rivera@hgv.com` | Master data, compensation, bulk uploads, and standard reports. |
| **GCC Lead** | `jeff.chu@hgv.com` | Read-only access to workforce data, compensation, billing figures, and reports. |

---

## 🧪 Testing & QA

Run the automated integration and billing verification scripts:

```bash
# Verify End-to-End API Routes
node test_e2e_api.js

# Verify Billing Engine Calculations
node test_billing.js
```

---

## 📚 Project Documentation

Detailed specification files are located at the root of the repository:
* [PRD_v1.0.txt](PRD_v1.0.txt): Full product specifications, acceptance criteria, and business logic.
* [Tech_Stack_Backend_Schema_v1.0.txt](Tech_Stack_Backend_Schema_v1.0.txt): Entity relationships, schema design, and technical decisions.
* [App_Flow_v1.0.txt](App_Flow_v1.0.txt): Page navigation hierarchies and user interactions.
* [CHANGES.md](CHANGES.md): Port allocation and multi-instance isolation details.

---

## 📄 License

Proprietary and confidential. Internal enterprise use only.
