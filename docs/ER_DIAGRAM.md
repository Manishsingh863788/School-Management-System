# EduManage Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o| Teacher : "profile (if TEACHER)"
    User ||--o| Guardian : "profile (if GUARDIAN)"
    User ||--o{ AuditLog : "performed by"

    AcademicYear ||--o{ Class : "academic period"
    AcademicYear ||--o{ Examination : "conducted during"
    AcademicYear ||--o{ FeeStructure : "scheduled for"

    Class ||--o{ Section : "contains"
    Class ||--o{ Student : "enrolled in"
    Class ||--o{ ClassSubjectAssignment : "teaches"
    Teacher ||--o{ Class : "class teacher"
    Teacher ||--o{ ClassSubjectAssignment : "assigned to teach"
    Subject ||--o{ ClassSubjectAssignment : "included in"
    Section ||--o{ ClassSubjectAssignment : "section cohort"

    Section ||--o{ Student : "assigned section"

    Student ||--o{ StudentGuardian : "linked to"
    Guardian ||--o{ StudentGuardian : "has children"

    Student ||--o{ Attendance : "attendance records"
    Teacher ||--o{ Attendance : "marked by"

    Examination ||--o{ ExamSubject : "schedules subjects"
    Subject ||--o{ ExamSubject : "examined"
    Class ||--o{ ExamSubject : "target class"
    ExamSubject ||--o{ ExamResult : "receives marks"
    Student ||--o{ ExamResult : "obtained by"

    FeeStructure ||--o{ FeeStructureItem : "line items"
    Class ||--o{ FeeStructure : "fee rate for"
    FeeStructure ||--o{ FeeInvoice : "billed via"
    Student ||--o{ FeeInvoice : "invoiced to"
    FeeInvoice ||--o{ FeeInvoiceItem : "bill items"
    FeeInvoice ||--o{ Payment : "settled with"
    User ||--o{ Payment : "received by"

    User {
        string id PK
        string email UK
        string passwordHash
        string role "ADMIN | TEACHER | GUARDIAN"
        string status "ACTIVE | INACTIVE"
        datetime createdAt
        datetime updatedAt
    }

    Teacher {
        string id PK
        string userId FK,UK
        string employeeId UK
        string fullName
        string phone
        string qualification
        datetime joiningDate
        string status
    }

    Guardian {
        string id PK
        string userId FK,UK
        string fullName
        string phone
        string address
        string occupation
    }

    Student {
        string id PK
        string admissionNumber UK
        string fullName
        datetime dob
        string gender
        string email
        string phone
        string address
        datetime admissionDate
        string status "ACTIVE | INACTIVE | SUSPENDED"
        string classId FK
        string sectionId FK
    }

    StudentGuardian {
        string id PK
        string studentId FK
        string guardianId FK
        string relationship "FATHER | MOTHER | LEGAL_GUARDIAN"
        boolean isPrimary
    }

    AcademicYear {
        string id PK
        string name UK "e.g. 2026-2027"
        datetime startDate
        datetime endDate
        boolean isCurrent
    }

    Class {
        string id PK
        string name "e.g. Class 10"
        string academicYearId FK
        string classTeacherId FK
        string description
    }

    Section {
        string id PK
        string name "e.g. A"
        int capacity
        string classId FK
    }

    Subject {
        string id PK
        string name "e.g. Mathematics"
        string code UK "e.g. MATH101"
        string description
    }

    ClassSubjectAssignment {
        string id PK
        string classId FK
        string sectionId FK
        string subjectId FK
        string teacherId FK
    }

    Attendance {
        string id PK
        string studentId FK
        datetime date
        string session "MORNING | AFTERNOON"
        string status "PRESENT | ABSENT | LATE | EXCUSED"
        string recordedById FK
        string remarks
    }

    Examination {
        string id PK
        string name "e.g. Mid-Term Examination 2026"
        string academicYearId FK
        string term "FIRST_TERM | MID_TERM | FINAL_TERM"
        datetime startDate
        datetime endDate
        string status "UPCOMING | ONGOING | COMPLETED"
    }

    ExamSubject {
        string id PK
        string examinationId FK
        string subjectId FK
        string classId FK
        float maxMarks
        float passMarks
        datetime examDate
    }

    GradeRule {
        string id PK
        float minPercentage
        float maxPercentage
        string grade "A+ | A | B+ | B | C | D | F"
        float gradePoint
        string description
    }

    ExamResult {
        string id PK
        string studentId FK
        string examSubjectId FK
        float marksObtained
        boolean isAbsent
        string remarks
        datetime recordedAt
    }

    FeeStructure {
        string id PK
        string name
        string academicYearId FK
        string classId FK
        float totalAmount
        string description
    }

    FeeStructureItem {
        string id PK
        string feeStructureId FK
        string category "TUITION | ADMISSION | EXAM | TRANSPORT | LIBRARY | OTHER"
        float amount
    }

    FeeInvoice {
        string id PK
        string invoiceNumber UK
        string studentId FK
        string feeStructureId FK
        datetime dueDate
        float totalAmount
        float paidAmount
        float balanceAmount
        string status "UNPAID | PARTIALLY_PAID | PAID"
    }

    FeeInvoiceItem {
        string id PK
        string invoiceId FK
        string category
        float amount
    }

    Payment {
        string id PK
        string invoiceId FK
        float amount
        string paymentMethod "CASH | UPI | CARD"
        string transactionReference
        string idempotencyKey UK
        string status "SUCCESS | FAILED"
        string recordedById FK
        datetime paymentDate
        string notes
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
        string details "JSON (sanitized)"
        string ipAddress
        datetime createdAt
    }
```
