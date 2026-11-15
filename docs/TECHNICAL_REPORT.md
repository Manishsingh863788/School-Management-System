# EduManage – School Management System: Technical Architecture & Engineering Report

**Author**: Senior Full-Stack Software Engineer & System Architect  
**Project**: ALGIONS AI LABS PRIVATE LIMITED Full-Stack Web Development Assessment  
**Application Name**: EduManage – School Management System  

---

## 1. Problem Statement & Objectives
School management systems require multi-tenant security boundaries where distinct user personas (Administrators, Teachers, Guardians) interact with the same underlying educational datasets under divergent operational constraints:
- **Administrative overhead**: Complex manual orchestration of academic years, fee structures, class assignments, and enrollments.
- **Data integrity & concurrency**: Preventing conflicting attendance sessions, duplicate student identifiers, and double-billing or ledger desynchronization.
- **Granular Security Boundaries**: Ensuring absolute isolation so guardians cannot access records of unlinked students, and teachers cannot manipulate marks or attendance for classes outside their assignments.
- **Deterministic Business Logic**: Moving grading algorithms and invoice balance reconciliation from client-side approximations into server-enforced, transactional database routines.

---

## 2. Architecture & Design Principles

### 2.1 Monorepo Architecture
EduManage utilizes a clean monorepo architecture:
- `client/`: Single-Page Application (SPA) driven by React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, and Recharts.
- `server/`: Modular Node.js + Express + TypeScript service exposing versioned REST APIs.
- `prisma/`: Declarative relational database modeling, version-controlled migrations, and comprehensive deterministic database seeding.

### 2.2 Security & Role-Based Access Control (RBAC)
1. **Multi-Layer Authorization**:
   - Layer 1: JWT token validation and role verification (`ADMIN`, `TEACHER`, `GUARDIAN`).
   - Layer 2: Entity ownership and scoped relationship validation (e.g. verifying that a Guardian ID matches the `StudentGuardian` junction table for the requested student ID).
2. **Password Security**: Passwords hashed using `bcrypt` with work factor 10.
3. **Audit Trails**: Non-repudiation audit logging for mutations across student records, attendance, exam marks, and fee payments.

### 2.3 Attendance Business Rules
- Composite uniqueness on `(studentId, date, session)` ensures no student can have multiple conflicting attendance records for the same session.
- Database transactions wrap bulk submissions.
- Teachers are verified against `ClassSubjectAssignment` or class teacher designations before submission is authorized.

### 2.4 Examination & Grading Engine
- Examination subjects configure `maxMarks` and `passMarks`.
- Scores submitted by teachers are strictly validated on the backend (`0 <= marksObtained <= maxMarks`).
- Grading boundaries evaluate overall student performance into letter grades (`A+` to `F`), computing exact percentage, total obtained marks, and pass/fail indicators.

### 2.5 Fee Ledger, Transactions & Idempotency
- Double-entry balance guarantee: `Invoice Amount = Total Successful Payments + Outstanding Balance`.
- Simulated payments mandate client-generated UUID `idempotencyKey` values. If an identical payment request is repeated (e.g., due to network retry), the existing transaction is returned without re-debiting.
- Rejection of overpayments and negative amounts.
