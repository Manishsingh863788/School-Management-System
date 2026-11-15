# EduManage – Enterprise School Management System
**ALGIONS AI LABS PRIVATE LIMITED – Full-Stack Web Development Assessment**

EduManage is an enterprise-grade, production-style, database-backed School Management System built using React, TypeScript, Tailwind CSS, Node.js, Express, Prisma ORM, and PostgreSQL.

It features robust role-based access control (RBAC), multi-tenant security boundaries, a double-entry fee ledger with idempotency support, deterministic examination grading calculations, PDF report card generation, and automated acceptance tests.

---

## 1. Key Features & Role Personas

### 🛡️ Administrator
- **Executive Analytics Dashboard**: Real-time KPI counters (active students, teachers, guardians, cohorts, today's roll call percentage, fee collections, outstanding debt) and interactive Recharts visualizations (Monthly Collections, Weekly Attendance, Class Distribution).
- **Student Information System (SIS)**: Full student lifecycle management, unique admission number enforcement, class/section enrollment, guardian linking, profile inspection, and soft deactivation.
- **Faculty & Academic Staff**: Employee ID tracking, academic credentials, assignment matrices, and schedule mapping.
- **Academic Structure Management**: Academic years, classes, sections with capacity limits, course subjects, and class-section-subject-teacher assignments.
- **Examinations Engine**: Examination scheduling, subject configurations, maximum/passing marks, and configurable grading boundary scales (`A+` to `F`).
- **Fee Management & Simulated Payments**: Itemized fee structures (Tuition, Laboratory, Library, Examination), bulk invoice generation, double-entry payment ledger with idempotency key protection against duplicate charges or overpayments.
- **Compliance Reporting**: CSV data exports for student enrollment, attendance logs, and fee reconciliations.
- **Non-Repudiation Audit Logging**: Chronological trail of all material business events with sanitized metadata (zero credential leakage).

### 🎓 Teacher
- **Scoped Operational Access**: Teachers can access **only** the classes, sections, and subjects explicitly assigned to them.
- **Attendance Roll Call**: Daily session roll call (Morning / Afternoon) marking students as `PRESENT`, `ABSENT`, `LATE`, or `EXCUSED` with transaction-safe upserts.
- **Marks Entry**: Controlled subject marks entry with server-side validation rejecting negative marks or marks exceeding maximum configured thresholds.

### 👨‍👩‍👧 Guardian / Parent
- **Strict Data Isolation**: Guardians can **only** access data belonging to their linked children. Direct URL manipulation or tampering with student IDs is rejected with `403 Forbidden`.
- **Multi-Child Switcher**: Parents with multiple enrolled children can seamlessly toggle between student profiles without re-authenticating.
- **Academic Report Cards**: Immediate view of subject-wise scores, percentages, computed letter grades, pass/fail indicators, and one-click **official PDF Report Card downloads**.
- **Attendance Calendar**: Real-time attendance rate and historical session logs.
- **Fee Statements & Simulated Checkout**: Itemized bill inspection and simulated multi-method payments (`Cash`, `UPI`, `Card`) with automatic invoice balance updates.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, Axios, React Hook Form, Zod.
- **Backend**: Node.js 20, Express.js, TypeScript, RESTful architecture, JWT Authentication, bcrypt password hashing, Zod validation, PDFKit.
- **Database**: PostgreSQL / SQLite dev fallback, Prisma ORM, versioned migrations, comprehensive database seed scripts.
- **Testing**: Vitest, Supertest, automated end-to-end acceptance test suite verifying all 5 core assessment criteria.

---

## 3. Demo Credentials

For quick evaluation, one-click login buttons are available on the login page (`/login`), or use the credentials below:

| Role | Email | Password | Details |
|---|---|---|---|
| **ADMIN** | `admin@edumanage.academy` | `Password123!` | System Administrator (Full Access) |
| **TEACHER** | `sarah.jenkins@edumanage.academy` | `Password123!` | Sarah Jenkins (Assigned to Class 10-A, 10-B Math) |
| **TEACHER** | `robert.chen@edumanage.academy` | `Password123!` | Robert Chen (Assigned to Class 10-A, 9-A Science) |
| **TEACHER** | `michael.adams@edumanage.academy` | `Password123!` | Michael Adams (Assigned to Computer Science) |
| **GUARDIAN** | `john.smith.parent@example.com` | `Password123!` | John Smith (Parent of Alice Smith & Bob Smith) |
| **GUARDIAN** | `maria.garcia.parent@example.com` | `Password123!` | Maria Garcia (Parent of Carlos Garcia) |

---

## 4. Getting Started & Installation

### Prerequisites
- Node.js v18+ (tested on Node v20.20.2)
- npm v9+

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd "school management system"

# Install all workspace dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration values:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edumanage?schema=public"
JWT_SECRET="edumanage_jwt_super_secret_production_key_2026_algions"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="http://localhost:5173"
SCHOOL_NAME="EduManage International Academy"
```

---

## 5. Database Setup, Migrations & Seeding

### PostgreSQL Migration & Seeding
If you have a local or hosted PostgreSQL instance running:
```bash
# Apply migrations to PostgreSQL
npx prisma migrate dev --schema=./prisma/schema.prisma

# Seed initial synthetic records
npx tsx prisma/seed.ts
```

### Embedded Local Development Mode (Zero Configuration)
If running on a machine without a standalone PostgreSQL service running:
```bash
# Push schema into zero-dependency dev database
npx prisma db push --schema=./prisma/schema.sqlite.prisma

# Seed synthetic demo dataset
npx tsx prisma/seed.ts
```

The database seed populates:
- 1 Administrator account
- 4 Teachers with assignment matrices
- 5 Guardians
- 16 Students enrolled in Class 10-A, 10-B, 9-A, 9-B, 8-A
- 5 Subjects (Mathematics, Science, English, Social Studies, Computer Science)
- 10 instructional days of realistic attendance records
- Mid-Term Examination 2026 with marks and grading rules
- Class 10 annual fee structures, student invoices, and cleared simulated payments

---

## 6. Running the Application

### Start Both Backend & Frontend Simultaneously
```bash
npm run dev
```

### Or Run Individually:
```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
npm run dev --workspace=server

# Terminal 2: Frontend Client (runs on http://localhost:5173)
cd client
npx vite
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **REST API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Interactive Swagger Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 7. Automated Acceptance & Security Tests

Run the comprehensive Vitest test suite covering all 5 mandatory acceptance criteria and negative security tests:

```bash
npx vitest run
```

### Test Suite Results:
- `TEST 1`: Teacher can access only assigned classes and record attendance (Passed).
- `TEST 2`: Duplicate attendance for the same student/date/session safely updates without conflict (Passed).
- `TEST 3`: Examination results calculated on backend according to configured grade boundaries (Passed).
- `TEST 4`: Guardian can access only linked student profiles and report cards; unlinked requests receive `403 Forbidden` (Passed).
- `TEST 5`: Fee balance reconciles with payments ledger (`Invoice Amount = Paid Amount + Balance Amount`); overpayment and negative payments rejected; idempotent requests handled safely (Passed).
- `Security`: Duplicate admission numbers rejected (`409`); invalid passwords rejected (`401`); marks exceeding maximum marks rejected (`400`).

---

## 8. REST API Documentation Overview

EduManage provides structured REST endpoints with standardized JSON response envelopes:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Detailed endpoint contracts are documented in [`docs/API_DOCUMENTATION.md`](file:///c:/Users/singh/OneDrive/Desktop/school%20managemnet%20system/docs/API_DOCUMENTATION.md) and viewable interactively via Swagger UI at `http://localhost:5000/api/docs`.

---

## 9. Architecture & Design Documentation

- **Mermaid Entity Relationship Diagram**: [`docs/ER_DIAGRAM.md`](file:///c:/Users/singh/OneDrive/Desktop/school%20managemnet%20system/docs/ER_DIAGRAM.md)
- **REST API Specifications**: [`docs/API_DOCUMENTATION.md`](file:///c:/Users/singh/OneDrive/Desktop/school%20managemnet%20system/docs/API_DOCUMENTATION.md)
- **Technical Architecture & Engineering Report**: [`docs/TECHNICAL_REPORT.md`](file:///c:/Users/singh/OneDrive/Desktop/school%20managemnet%20system/docs/TECHNICAL_REPORT.md)
- **3-5 Minute Demonstration Video Script**: [`docs/DEMO_SCRIPT.md`](file:///c:/Users/singh/OneDrive/Desktop/school%20managemnet%20system/docs/DEMO_SCRIPT.md)
