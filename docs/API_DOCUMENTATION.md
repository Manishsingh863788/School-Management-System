# EduManage REST API Documentation

EduManage provides a RESTful API architecture following standard HTTP methods, JSON payloads, and standard response envelopes.

## Base URL
`/api`

## Response Envelopes

### Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Envelope
```json
{
  "success": false,
  "message": "Error description message",
  "errors": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Allowed Roles |
|---|---|---|---|---|
| POST | `/api/auth/login` | Authenticate user & issue JWT | No | Public |
| GET | `/api/auth/me` | Fetch authenticated user profile & active role details | Yes | ADMIN, TEACHER, GUARDIAN |
| POST | `/api/auth/logout` | Terminate session / client token invalidation | Yes | All |

### POST `/api/auth/login`
**Request Payload**:
```json
{
  "email": "admin@edumanage.academy",
  "password": "Password123!"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cly101...",
      "email": "admin@edumanage.academy",
      "role": "ADMIN",
      "fullName": "System Administrator",
      "profile": {}
    }
  }
}
```

---

## 2. Student Management (`/api/students`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/students` | List paginated students with filters (class, section, status, search) | ADMIN, TEACHER |
| POST | `/api/students` | Create student with admission number, class & guardians | ADMIN |
| GET | `/api/students/:id` | Get detailed student profile (Attendance, Exams, Fees) | ADMIN, TEACHER (if assigned), GUARDIAN (if linked child) |
| PUT | `/api/students/:id` | Update student details | ADMIN |
| DELETE | `/api/students/:id` | Deactivate student safely | ADMIN |

---

## 3. Guardian Management (`/api/guardians`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/guardians` | List guardians | ADMIN |
| POST | `/api/guardians` | Create guardian and optionally link students | ADMIN |
| GET | `/api/guardians/:id` | Get guardian profile with linked students | ADMIN, GUARDIAN (self only) |
| PUT | `/api/guardians/:id` | Update guardian details | ADMIN |
| POST | `/api/guardians/link-student` | Link or update student-guardian relationship | ADMIN |

---

## 4. Teacher Management (`/api/teachers`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/teachers` | List all teachers with assignments | ADMIN |
| POST | `/api/teachers` | Create teacher record with employee ID | ADMIN |
| GET | `/api/teachers/:id` | Get teacher profile and teaching schedule | ADMIN, TEACHER (self) |
| PUT | `/api/teachers/:id` | Update teacher details | ADMIN |

---

## 5. Classes, Sections & Subjects (`/api/classes`, `/api/sections`, `/api/subjects`, `/api/assignments`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/classes` | List academic classes with sections and class teacher | ADMIN, TEACHER |
| POST | `/api/classes` | Create new class | ADMIN |
| GET | `/api/sections` | List sections | ADMIN, TEACHER |
| POST | `/api/sections` | Create new section with capacity | ADMIN |
| GET | `/api/subjects` | List subjects | ADMIN, TEACHER |
| POST | `/api/subjects` | Create subject with unique code | ADMIN |
| GET | `/api/assignments` | List class-section-subject-teacher assignments | ADMIN, TEACHER |
| POST | `/api/assignments` | Assign subject & class/section to teacher | ADMIN |

---

## 6. Attendance Management (`/api/attendance`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| POST | `/api/attendance` | Record or bulk update attendance | TEACHER (for assigned classes), ADMIN |
| GET | `/api/attendance` | Query attendance by date, class, section, student | ADMIN, TEACHER |
| GET | `/api/attendance/student/:studentId` | Get attendance history & stats for student | ADMIN, TEACHER, GUARDIAN (linked only) |
| GET | `/api/attendance/summary` | Get aggregated class/school attendance stats | ADMIN, TEACHER |

---

## 7. Examination & Results (`/api/examinations`, `/api/results`, `/api/report-cards`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/examinations` | List examinations | ADMIN, TEACHER, GUARDIAN |
| POST | `/api/examinations` | Create examination schedule & max marks | ADMIN |
| GET | `/api/results/class/:classId/exam/:examId` | Fetch marks matrix for class & exam | ADMIN, TEACHER (if assigned) |
| POST | `/api/results/bulk` | Enter/update marks for students | TEACHER (if assigned), ADMIN |
| GET | `/api/results/student/:studentId/exam/:examId` | View student exam calculation & grade | ADMIN, TEACHER, GUARDIAN (linked only) |
| GET | `/api/report-cards/:studentId/exam/:examId` | Generate & download student report card (JSON/PDF) | ADMIN, TEACHER, GUARDIAN (linked only) |

---

## 8. Fee Management & Payments (`/api/fees`, `/api/invoices`, `/api/payments`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/fees/structures` | List fee structures | ADMIN |
| POST | `/api/fees/structures` | Create fee structure with line items | ADMIN |
| GET | `/api/invoices` | List invoices with status, class, student filters | ADMIN, GUARDIAN (linked only) |
| POST | `/api/invoices/generate` | Generate invoices for class or student | ADMIN |
| GET | `/api/invoices/:id` | Get detailed invoice with line items & payment history | ADMIN, GUARDIAN (linked only) |
| POST | `/api/payments` | Record simulated payment (idempotency key required) | ADMIN, GUARDIAN (for own invoice) |
| GET | `/api/payments` | Query payment ledger | ADMIN |

---

## 9. Reports & Analytics (`/api/reports`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/reports/dashboard` | Aggregated dashboard KPI counters and charts | ADMIN |
| GET | `/api/reports/enrollment` | Student enrollment breakdown | ADMIN |
| GET | `/api/reports/attendance` | Attendance trends and summary | ADMIN |
| GET | `/api/reports/fees` | Fee collection vs outstanding summary | ADMIN |
| GET | `/api/reports/performance` | Class-wise academic performance | ADMIN |

---

## 10. Audit Logs (`/api/audit-logs`)

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| GET | `/api/audit-logs` | Retrieve chronological audit logs with entity filters | ADMIN |
