import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/prisma.js';

const app = createApp();

let adminToken: string;
let teacherSarahToken: string;
let teacherMichaelToken: string;
let guardianJohnToken: string;
let guardianMariaToken: string;

let teacherSarahId: string;
let teacherMichaelId: string;
let guardianJohnId: string;
let guardianMariaId: string;

let class10Id: string;
let class9Id: string;
let section10AId: string;
let section10BId: string;
let studentAliceId: string; // Alice is linked to John Smith
let studentBobId: string;   // Bob is linked to John Smith
let studentCarlosId: string; // Carlos is linked to Maria Garcia

let midTermExamId: string;
let mathExamSubjectId: string;
let invoiceBobId: string;

beforeAll(async () => {
  // Login Admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@edumanage.academy', password: 'Password123!' });
  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.data.token;

  // Login Teacher Sarah Jenkins (assigned to 10-A Math)
  const sarahRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sarah.jenkins@edumanage.academy', password: 'Password123!' });
  expect(sarahRes.status).toBe(200);
  teacherSarahToken = sarahRes.body.data.token;
  teacherSarahId = sarahRes.body.data.user.profile.id;

  // Login Teacher Michael Adams (assigned only to Computer Science)
  const michaelRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'michael.adams@edumanage.academy', password: 'Password123!' });
  expect(michaelRes.status).toBe(200);
  teacherMichaelToken = michaelRes.body.data.token;
  teacherMichaelId = michaelRes.body.data.user.profile.id;

  // Login Guardian John Smith (parent of Alice and Bob)
  const johnRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'john.smith.parent@example.com', password: 'Password123!' });
  expect(johnRes.status).toBe(200);
  guardianJohnToken = johnRes.body.data.token;
  guardianJohnId = johnRes.body.data.user.profile.id;

  // Login Guardian Maria Garcia (parent of Carlos)
  const mariaRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'maria.garcia.parent@example.com', password: 'Password123!' });
  expect(mariaRes.status).toBe(200);
  guardianMariaToken = mariaRes.body.data.token;
  guardianMariaId = mariaRes.body.data.user.profile.id;

  // Fetch IDs for testing
  const classes = await prisma.class.findMany({ include: { sections: true } });
  const cls10 = classes.find((c) => c.name === 'Class 10')!;
  class10Id = cls10.id;
  section10AId = cls10.sections.find((s) => s.name === 'A')!.id;
  section10BId = cls10.sections.find((s) => s.name === 'B')!.id;

  const cls9 = classes.find((c) => c.name === 'Class 9')!;
  class9Id = cls9.id;

  const alice = await prisma.student.findUnique({ where: { admissionNumber: 'ADM-2026-001' } });
  const bob = await prisma.student.findUnique({ where: { admissionNumber: 'ADM-2026-002' } });
  const carlos = await prisma.student.findUnique({ where: { admissionNumber: 'ADM-2026-003' } });

  studentAliceId = alice!.id;
  studentBobId = bob!.id;
  studentCarlosId = carlos!.id;

  const exam = await prisma.examination.findFirst({
    where: { name: 'Mid-Term Examination 2026' },
    include: { examSubjects: true },
  });
  midTermExamId = exam!.id;
  mathExamSubjectId = exam!.examSubjects[0].id;

  const invBob = await prisma.feeInvoice.findUnique({ where: { invoiceNumber: 'INV-2026-0002' } });
  invoiceBobId = invBob!.id;
});

describe('MANDATORY ACCEPTANCE TESTS (Algions Assessment Criteria)', () => {
  // TEST 1: A teacher can access only assigned classes and record attendance
  describe('TEST 1: Teacher Class Scoping and Attendance Recording', () => {
    it('allows assigned teacher (Sarah) to record attendance for Class 10-A', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${teacherSarahToken}`)
        .send({
          classId: class10Id,
          sectionId: section10AId,
          date: '2026-11-13',
          session: 'MORNING',
          records: [
            { studentId: studentAliceId, status: 'PRESENT' },
            { studentId: studentBobId, status: 'LATE', remarks: 'Bus delay' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.present).toBe(1);
      expect(res.body.data.summary.late).toBe(1);
    });

    it('rejects attendance recording by a teacher who is NOT assigned to the class (Negative Test)', async () => {
      // Michael Adams is NOT assigned to Class 9-A
      const section9A = await prisma.section.findFirst({ where: { classId: class9Id, name: 'A' } });

      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${teacherMichaelToken}`)
        .send({
          classId: class9Id,
          sectionId: section9A!.id,
          date: '2026-11-13',
          session: 'MORNING',
          records: [{ studentId: studentAliceId, status: 'PRESENT' }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });
  });

  // TEST 2: Duplicate attendance for same student/date/session is rejected or safely updated
  describe('TEST 2: Attendance Idempotency and Safe Upsert Updates', () => {
    it('safely updates existing attendance record without duplicate key error', async () => {
      // First submission: Bob is LATE
      const firstRes = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: class10Id,
          sectionId: section10AId,
          date: '2026-11-14',
          session: 'AFTERNOON',
          records: [{ studentId: studentBobId, status: 'LATE' }],
        });
      expect(firstRes.status).toBe(200);

      // Second submission for same student, date, and session: Update Bob to PRESENT
      const updateRes = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: class10Id,
          sectionId: section10AId,
          date: '2026-11-14',
          session: 'AFTERNOON',
          records: [{ studentId: studentBobId, status: 'PRESENT', remarks: 'Late slip verified' }],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.summary.present).toBe(1);

      // Verify in DB that only 1 record exists for (studentBobId, 2026-11-14, AFTERNOON)
      const count = await prisma.attendance.count({
        where: {
          studentId: studentBobId,
          date: new Date(Date.UTC(2026, 10, 14)),
          session: 'AFTERNOON',
        },
      });
      expect(count).toBe(1);
    });
  });

  // TEST 3: Examination results are calculated correctly using configured marks and grading rules
  describe('TEST 3: Examination Results Calculations & Server Validation', () => {
    it('calculates subject-wise marks, totals, percentage, grade, and pass/fail correctly', async () => {
      // Alice has marks: Math=95, Science=92, English=88. Total = 275/300 = 91.67% -> A+, Passed
      const res = await request(app)
        .get(`/api/examinations/report-cards/${studentAliceId}/exam/${midTermExamId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const calculations = res.body.data.results;
      expect(calculations.totalMaxMarks).toBe(300);
      expect(calculations.totalObtainedMarks).toBe(275);
      expect(calculations.overallPercentage).toBe(91.67);
      expect(calculations.overallGrade).toBe('A+');
      expect(calculations.overallPassed).toBe(true);
    });

    it('rejects marks exceeding maximum marks (Negative Test)', async () => {
      const res = await request(app)
        .post('/api/examinations/marks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          examSubjectId: mathExamSubjectId,
          marks: [{ studentId: studentAliceId, marksObtained: 105 }], // Max marks is 100!
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot exceed maximum marks');
    });

    it('rejects negative marks (Negative Test)', async () => {
      const res = await request(app)
        .post('/api/examinations/marks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          examSubjectId: mathExamSubjectId,
          marks: [{ studentId: studentAliceId, marksObtained: -5 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // TEST 4: A guardian can see only their linked student's permitted information
  describe('TEST 4: Guardian Strict Isolation & Access Control', () => {
    it('allows Guardian John to view his linked student (Alice)', async () => {
      const res = await request(app)
        .get(`/api/students/${studentAliceId}`)
        .set('Authorization', `Bearer ${guardianJohnToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admissionNumber).toBe('ADM-2026-001');
    });

    it('blocks Guardian John from viewing an unlinked student (Carlos) (Negative Test)', async () => {
      const res = await request(app)
        .get(`/api/students/${studentCarlosId}`)
        .set('Authorization', `Bearer ${guardianJohnToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    it('blocks Guardian John from viewing an unlinked student report card (Negative Test)', async () => {
      const res = await request(app)
        .get(`/api/examinations/report-cards/${studentCarlosId}/exam/${midTermExamId}`)
        .set('Authorization', `Bearer ${guardianJohnToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // TEST 5: Fee due and paid totals reconcile with the payment ledger
  describe('TEST 5: Fee Reconciliation, Overpayment Rejection & Idempotency', () => {
    it('verifies that total invoice amount = paid amount + outstanding balance', async () => {
      const res = await request(app)
        .get(`/api/fees/invoices/${invoiceBobId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const inv = res.body.data;
      expect(inv.totalAmount).toBe(inv.paidAmount + inv.balanceAmount);
    });

    it('rejects overpayment exceeding outstanding balance (Negative Test)', async () => {
      const invoice = await prisma.feeInvoice.findUnique({ where: { id: invoiceBobId } });
      const overAmount = invoice!.balanceAmount + 500;

      const res = await request(app)
        .post('/api/fees/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoiceBobId,
          amount: overAmount,
          paymentMethod: 'CASH',
          idempotencyKey: `IDEMP-TEST-OVERPAY-${Date.now()}`,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('exceeds outstanding balance');
    });

    it('rejects negative or zero payment amount (Negative Test)', async () => {
      const res = await request(app)
        .post('/api/fees/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoiceBobId,
          amount: -100,
          paymentMethod: 'CASH',
          idempotencyKey: `IDEMP-TEST-NEG-${Date.now()}`,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('handles idempotent payment requests safely without double-charging', async () => {
      const uniqueKey = `IDEMP-TEST-RETRY-${Date.now()}`;
      const payAmount = 200;

      // First request
      const firstRes = await request(app)
        .post('/api/fees/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoiceBobId,
          amount: payAmount,
          paymentMethod: 'UPI',
          idempotencyKey: uniqueKey,
        });

      expect(firstRes.status).toBe(201);
      const paymentId = firstRes.body.data.payment.id;

      // Duplicate retry request with same idempotency key
      const duplicateRes = await request(app)
        .post('/api/fees/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          invoiceId: invoiceBobId,
          amount: payAmount,
          paymentMethod: 'UPI',
          idempotencyKey: uniqueKey,
        });

      expect(duplicateRes.status).toBe(200);
      expect(duplicateRes.body.data.id).toBe(paymentId);
      expect(duplicateRes.body.message).toContain('Duplicate payment request detected');
    });
  });

  // Additional Security & Integrity Tests
  describe('Additional Security & System Integrity Tests', () => {
    it('rejects duplicate student admission number', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          admissionNumber: 'ADM-2026-001', // Alice's admission number
          fullName: 'Duplicate Student',
          dob: '2010-01-01',
          gender: 'MALE',
          classId: class10Id,
          sectionId: section10AId,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid login credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@edumanage.academy', password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
