import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('--- Starting EduManage Database Seeding ---');

  // Clear existing records in correct foreign-key order
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeInvoiceItem.deleteMany();
  await prisma.feeInvoice.deleteMany();
  await prisma.feeStructureItem.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.examSubject.deleteMany();
  await prisma.examination.deleteMany();
  await prisma.gradeRule.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classSubjectAssignment.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.section.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  const commonPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2026-2027',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2027-05-31'),
      isCurrent: true,
    },
  });
  console.log('✓ Academic Year created:', academicYear.name);

  // 2. Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@edumanage.academy',
      passwordHash: commonPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✓ Admin created:', adminUser.email);

  // 3. Teachers
  const teacherData = [
    {
      email: 'sarah.jenkins@edumanage.academy',
      fullName: 'Sarah Jenkins',
      employeeId: 'EMP-1001',
      phone: '+1 555-0101',
      qualification: 'M.Sc. Mathematics, B.Ed.',
    },
    {
      email: 'robert.chen@edumanage.academy',
      fullName: 'Robert Chen',
      employeeId: 'EMP-1002',
      phone: '+1 555-0102',
      qualification: 'Ph.D. Physics, M.Ed.',
    },
    {
      email: 'elena.rodriguez@edumanage.academy',
      fullName: 'Elena Rodriguez',
      employeeId: 'EMP-1003',
      phone: '+1 555-0103',
      qualification: 'M.A. English Literature',
    },
    {
      email: 'michael.adams@edumanage.academy',
      fullName: 'Michael Adams',
      employeeId: 'EMP-1004',
      phone: '+1 555-0104',
      qualification: 'B.Tech Computer Science',
    },
  ];

  const teachers = [];
  for (const t of teacherData) {
    const user = await prisma.user.create({
      data: {
        email: t.email,
        passwordHash: commonPasswordHash,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId: t.employeeId,
        fullName: t.fullName,
        phone: t.phone,
        qualification: t.qualification,
        status: 'ACTIVE',
      },
    });
    teachers.push(teacher);
  }
  console.log(`✓ ${teachers.length} Teachers created`);

  // 4. Classes and Sections
  const classGrade10 = await prisma.class.create({
    data: {
      name: 'Class 10',
      academicYearId: academicYear.id,
      classTeacherId: teachers[0].id,
      description: 'Senior Secondary Grade 10',
    },
  });

  const classGrade9 = await prisma.class.create({
    data: {
      name: 'Class 9',
      academicYearId: academicYear.id,
      classTeacherId: teachers[1].id,
      description: 'Secondary Grade 9',
    },
  });

  const classGrade8 = await prisma.class.create({
    data: {
      name: 'Class 8',
      academicYearId: academicYear.id,
      classTeacherId: teachers[2].id,
      description: 'Middle School Grade 8',
    },
  });

  const section10A = await prisma.section.create({
    data: { name: 'A', capacity: 35, classId: classGrade10.id },
  });
  const section10B = await prisma.section.create({
    data: { name: 'B', capacity: 35, classId: classGrade10.id },
  });
  const section9A = await prisma.section.create({
    data: { name: 'A', capacity: 35, classId: classGrade9.id },
  });
  const section9B = await prisma.section.create({
    data: { name: 'B', capacity: 35, classId: classGrade9.id },
  });
  const section8A = await prisma.section.create({
    data: { name: 'A', capacity: 35, classId: classGrade8.id },
  });
  console.log('✓ 3 Classes and 5 Sections created');

  // 5. Subjects
  const subjectsData = [
    { name: 'Mathematics', code: 'MATH101', description: 'Algebra, Geometry, and Calculus basics' },
    { name: 'Science', code: 'SCI101', description: 'Physics, Chemistry, and Biology' },
    { name: 'English Language', code: 'ENG101', description: 'Grammar, Reading comprehension, and Composition' },
    { name: 'Social Studies', code: 'SOC101', description: 'World History and Geography' },
    { name: 'Computer Science', code: 'CS101', description: 'Fundamentals of Computing and Programming' },
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const sub = await prisma.subject.create({ data: s });
    subjects.push(sub);
  }
  console.log(`✓ ${subjects.length} Subjects created`);

  // 6. Teacher Assignments
  // Teacher 0 (Sarah Jenkins) teaches Math to 10-A, 10-B, 9-A
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade10.id, sectionId: section10A.id, subjectId: subjects[0].id, teacherId: teachers[0].id },
  });
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade10.id, sectionId: section10B.id, subjectId: subjects[0].id, teacherId: teachers[0].id },
  });
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade9.id, sectionId: section9A.id, subjectId: subjects[0].id, teacherId: teachers[0].id },
  });

  // Teacher 1 (Robert Chen) teaches Science to 10-A, 9-A, 9-B
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade10.id, sectionId: section10A.id, subjectId: subjects[1].id, teacherId: teachers[1].id },
  });
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade9.id, sectionId: section9A.id, subjectId: subjects[1].id, teacherId: teachers[1].id },
  });
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade9.id, sectionId: section9B.id, subjectId: subjects[1].id, teacherId: teachers[1].id },
  });

  // Teacher 2 (Elena Rodriguez) teaches English to 10-A, 9-A, 8-A
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade10.id, sectionId: section10A.id, subjectId: subjects[2].id, teacherId: teachers[2].id },
  });
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade9.id, sectionId: section9A.id, subjectId: subjects[2].id, teacherId: teachers[2].id },
  });
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade8.id, sectionId: section8A.id, subjectId: subjects[2].id, teacherId: teachers[2].id },
  });

  // Teacher 3 (Michael Adams) teaches Computer Science to 10-A, 10-B
  await prisma.classSubjectAssignment.create({
    data: { classId: classGrade10.id, sectionId: section10A.id, subjectId: subjects[4].id, teacherId: teachers[3].id },
  });
  console.log('✓ Class-Subject-Teacher Assignments established');

  // 7. Guardians (5 guardians)
  const guardianData = [
    { email: 'john.smith.parent@example.com', fullName: 'John Smith', phone: '+1 555-0201', occupation: 'Civil Engineer', address: '124 Oak Street' },
    { email: 'maria.garcia.parent@example.com', fullName: 'Maria Garcia', phone: '+1 555-0202', occupation: 'Pediatrician', address: '456 Elm Court' },
    { email: 'david.wilson.parent@example.com', fullName: 'David Wilson', phone: '+1 555-0203', occupation: 'Software Architect', address: '789 Pine Avenue' },
    { email: 'priya.patel.parent@example.com', fullName: 'Priya Patel', phone: '+1 555-0204', occupation: 'Financial Analyst', address: '321 Maple Lane' },
    { email: 'thomas.brown.parent@example.com', fullName: 'Thomas Brown', phone: '+1 555-0205', occupation: 'High School Principal', address: '654 Cedar Drive' },
  ];

  const guardians = [];
  for (const g of guardianData) {
    const user = await prisma.user.create({
      data: {
        email: g.email,
        passwordHash: commonPasswordHash,
        role: 'GUARDIAN',
        status: 'ACTIVE',
      },
    });

    const guardian = await prisma.guardian.create({
      data: {
        userId: user.id,
        fullName: g.fullName,
        phone: g.phone,
        address: g.address,
        occupation: g.occupation,
      },
    });
    guardians.push(guardian);
  }
  console.log(`✓ ${guardians.length} Guardians created`);

  // 8. Students (16 students distributed across classes and linked to guardians)
  const studentData = [
    // Class 10-A
    { admissionNumber: 'ADM-2026-001', fullName: 'Alice Smith', dob: '2010-04-12', gender: 'FEMALE', classId: classGrade10.id, sectionId: section10A.id, guardianIdx: 0, relationship: 'FATHER' },
    { admissionNumber: 'ADM-2026-002', fullName: 'Bob Smith', dob: '2010-09-21', gender: 'MALE', classId: classGrade10.id, sectionId: section10A.id, guardianIdx: 0, relationship: 'FATHER' }, // Sibling!
    { admissionNumber: 'ADM-2026-003', fullName: 'Carlos Garcia', dob: '2010-02-15', gender: 'MALE', classId: classGrade10.id, sectionId: section10A.id, guardianIdx: 1, relationship: 'MOTHER' },
    { admissionNumber: 'ADM-2026-004', fullName: 'Diana Wilson', dob: '2010-07-30', gender: 'FEMALE', classId: classGrade10.id, sectionId: section10A.id, guardianIdx: 2, relationship: 'FATHER' },
    { admissionNumber: 'ADM-2026-005', fullName: 'Ethan Patel', dob: '2010-11-05', gender: 'MALE', classId: classGrade10.id, sectionId: section10A.id, guardianIdx: 3, relationship: 'MOTHER' },

    // Class 10-B
    { admissionNumber: 'ADM-2026-006', fullName: 'Fiona Brown', dob: '2010-01-18', gender: 'FEMALE', classId: classGrade10.id, sectionId: section10B.id, guardianIdx: 4, relationship: 'FATHER' },
    { admissionNumber: 'ADM-2026-007', fullName: 'George Miller', dob: '2010-05-25', gender: 'MALE', classId: classGrade10.id, sectionId: section10B.id, guardianIdx: 1, relationship: 'LEGAL_GUARDIAN' },
    { admissionNumber: 'ADM-2026-008', fullName: 'Hannah Davis', dob: '2010-08-14', gender: 'FEMALE', classId: classGrade10.id, sectionId: section10B.id, guardianIdx: 2, relationship: 'FATHER' },

    // Class 9-A
    { admissionNumber: 'ADM-2026-009', fullName: 'Ian Taylor', dob: '2011-03-22', gender: 'MALE', classId: classGrade9.id, sectionId: section9A.id, guardianIdx: 0, relationship: 'FATHER' },
    { admissionNumber: 'ADM-2026-010', fullName: 'Julia Anderson', dob: '2011-06-19', gender: 'FEMALE', classId: classGrade9.id, sectionId: section9A.id, guardianIdx: 3, relationship: 'MOTHER' },
    { admissionNumber: 'ADM-2026-011', fullName: 'Kevin Thomas', dob: '2011-10-08', gender: 'MALE', classId: classGrade9.id, sectionId: section9A.id, guardianIdx: 4, relationship: 'FATHER' },

    // Class 9-B
    { admissionNumber: 'ADM-2026-012', fullName: 'Lily Jackson', dob: '2011-02-28', gender: 'FEMALE', classId: classGrade9.id, sectionId: section9B.id, guardianIdx: 1, relationship: 'MOTHER' },
    { admissionNumber: 'ADM-2026-013', fullName: 'Mason White', dob: '2011-12-11', gender: 'MALE', classId: classGrade9.id, sectionId: section9B.id, guardianIdx: 2, relationship: 'FATHER' },

    // Class 8-A
    { admissionNumber: 'ADM-2026-014', fullName: 'Nora Harris', dob: '2012-04-03', gender: 'FEMALE', classId: classGrade8.id, sectionId: section8A.id, guardianIdx: 3, relationship: 'MOTHER' },
    { admissionNumber: 'ADM-2026-015', fullName: 'Oliver Martin', dob: '2012-07-16', gender: 'MALE', classId: classGrade8.id, sectionId: section8A.id, guardianIdx: 4, relationship: 'FATHER' },
    { admissionNumber: 'ADM-2026-016', fullName: 'Penelope Clark', dob: '2012-09-09', gender: 'FEMALE', classId: classGrade8.id, sectionId: section8A.id, guardianIdx: 0, relationship: 'FATHER' },
  ];

  const students = [];
  for (const s of studentData) {
    const student = await prisma.student.create({
      data: {
        admissionNumber: s.admissionNumber,
        fullName: s.fullName,
        dob: new Date(s.dob),
        gender: s.gender as any,
        email: `${s.fullName.toLowerCase().replace(' ', '.')}@student.edumanage.academy`,
        status: 'ACTIVE',
        classId: s.classId,
        sectionId: s.sectionId,
        guardians: {
          create: {
            guardianId: guardians[s.guardianIdx].id,
            relationship: s.relationship as any,
            isPrimary: true,
          },
        },
      },
    });
    students.push(student);
  }
  console.log(`✓ ${students.length} Students created with guardian linkages`);

  // 9. Grade Rules
  const gradeRulesData = [
    { minPercentage: 90, maxPercentage: 100, grade: 'A+', gradePoint: 4.0, description: 'Outstanding Academic Excellence' },
    { minPercentage: 80, maxPercentage: 89.99, grade: 'A', gradePoint: 3.7, description: 'Excellent Performance' },
    { minPercentage: 70, maxPercentage: 79.99, grade: 'B+', gradePoint: 3.3, description: 'Very Good' },
    { minPercentage: 60, maxPercentage: 69.99, grade: 'B', gradePoint: 3.0, description: 'Good' },
    { minPercentage: 50, maxPercentage: 59.99, grade: 'C', gradePoint: 2.5, description: 'Satisfactory' },
    { minPercentage: 40, maxPercentage: 49.99, grade: 'D', gradePoint: 2.0, description: 'Minimum Pass' },
    { minPercentage: 0, maxPercentage: 39.99, grade: 'F', gradePoint: 0.0, description: 'Fail / Needs Remedial' },
  ];

  for (const r of gradeRulesData) {
    await prisma.gradeRule.create({ data: r });
  }
  console.log('✓ Grade rules configured');

  // 10. Attendance Records (Last 10 instructional days for 10-A)
  const class10AStudents = students.filter((s) => s.classId === classGrade10.id && s.sectionId === section10A.id);
  const instructionalDates = [
    '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07',
    '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'
  ];

  let attendanceCount = 0;
  for (const dateStr of instructionalDates) {
    const aDate = new Date(dateStr);
    for (const st of class10AStudents) {
      // Alice is always present, Bob had 1 late and 1 absent, Carlos has 1 excused
      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' = 'PRESENT';
      if (st.admissionNumber === 'ADM-2026-002' && dateStr === '2026-11-06') status = 'ABSENT';
      if (st.admissionNumber === 'ADM-2026-002' && dateStr === '2026-11-11') status = 'LATE';
      if (st.admissionNumber === 'ADM-2026-003' && dateStr === '2026-11-12') status = 'EXCUSED';

      await prisma.attendance.create({
        data: {
          studentId: st.id,
          date: aDate,
          session: 'MORNING',
          status,
          recordedById: teachers[0].id,
          remarks: status !== 'PRESENT' ? `Remark: ${status} recorded on morning roll` : null,
        },
      });
      attendanceCount++;
    }
  }
  console.log(`✓ ${attendanceCount} Attendance records seeded`);

  // 11. Examinations & Results
  const midTermExam = await prisma.examination.create({
    data: {
      name: 'Mid-Term Examination 2026',
      academicYearId: academicYear.id,
      term: 'MID_TERM',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-24'),
      status: 'PUBLISHED',
    },
  });

  // Exam Subjects for Class 10
  const mathExamSub = await prisma.examSubject.create({
    data: {
      examinationId: midTermExam.id,
      subjectId: subjects[0].id,
      classId: classGrade10.id,
      maxMarks: 100,
      passMarks: 40,
      examDate: new Date('2026-10-16'),
    },
  });

  const sciExamSub = await prisma.examSubject.create({
    data: {
      examinationId: midTermExam.id,
      subjectId: subjects[1].id,
      classId: classGrade10.id,
      maxMarks: 100,
      passMarks: 40,
      examDate: new Date('2026-10-18'),
    },
  });

  const engExamSub = await prisma.examSubject.create({
    data: {
      examinationId: midTermExam.id,
      subjectId: subjects[2].id,
      classId: classGrade10.id,
      maxMarks: 100,
      passMarks: 40,
      examDate: new Date('2026-10-20'),
    },
  });

  // Seed marks for Class 10-A students
  const studentScores: Record<string, { math: number; sci: number; eng: number }> = {
    'ADM-2026-001': { math: 95, sci: 92, eng: 88 }, // Alice: 275/300 = 91.67% -> A+
    'ADM-2026-002': { math: 82, sci: 79, eng: 85 }, // Bob: 246/300 = 82% -> A
    'ADM-2026-003': { math: 74, sci: 78, eng: 71 }, // Carlos: 223/300 = 74.33% -> B+
    'ADM-2026-004': { math: 65, sci: 68, eng: 62 }, // Diana: 195/300 = 65% -> B
    'ADM-2026-005': { math: 55, sci: 52, eng: 58 }, // Ethan: 165/300 = 55% -> C
  };

  for (const st of class10AStudents) {
    const scores = studentScores[st.admissionNumber];
    if (scores) {
      await prisma.examResult.create({
        data: { studentId: st.id, examSubjectId: mathExamSub.id, marksObtained: scores.math, isAbsent: false },
      });
      await prisma.examResult.create({
        data: { studentId: st.id, examSubjectId: sciExamSub.id, marksObtained: scores.sci, isAbsent: false },
      });
      await prisma.examResult.create({
        data: { studentId: st.id, examSubjectId: engExamSub.id, marksObtained: scores.eng, isAbsent: false },
      });
    }
  }
  console.log('✓ Mid-Term Examination, subjects, and marks seeded');

  // 12. Fee Structures, Invoices, and Payments
  const feeStructure10 = await prisma.feeStructure.create({
    data: {
      name: 'Class 10 Annual Comprehensive Fee',
      academicYearId: academicYear.id,
      classId: classGrade10.id,
      totalAmount: 3200,
      description: 'Annual composite fee including tuition, science lab, library, and sports',
      items: {
        create: [
          { category: 'TUITION', amount: 2000, description: 'Core curriculum tuition' },
          { category: 'LABORATORY', amount: 500, description: 'Physics & Chemistry lab fee' },
          { category: 'LIBRARY', amount: 300, description: 'Digital and print library access' },
          { category: 'EXAMINATION', amount: 400, description: 'Term exam & assessment fees' },
        ],
      },
    },
  });

  // Invoice 1: Alice Smith (Fully Paid via Card)
  const invoiceAlice = await prisma.feeInvoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      studentId: class10AStudents[0].id,
      feeStructureId: feeStructure10.id,
      dueDate: new Date('2026-12-01'),
      totalAmount: 3200,
      paidAmount: 3200,
      balanceAmount: 0,
      status: 'PAID',
      items: {
        create: [
          { category: 'TUITION', amount: 2000 },
          { category: 'LABORATORY', amount: 500 },
          { category: 'LIBRARY', amount: 300 },
          { category: 'EXAMINATION', amount: 400 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoiceAlice.id,
      amount: 3200,
      paymentMethod: 'CARD',
      transactionReference: 'SIM-TXN-CARD-9921',
      idempotencyKey: 'IDEMP-ALICE-PAY-001',
      status: 'SUCCESS',
      recordedById: adminUser.id,
      notes: 'Full annual fee settlement',
    },
  });

  // Invoice 2: Bob Smith (Partially Paid via UPI: $1,600 paid, $1,600 balance)
  const invoiceBob = await prisma.feeInvoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      studentId: class10AStudents[1].id,
      feeStructureId: feeStructure10.id,
      dueDate: new Date('2026-12-01'),
      totalAmount: 3200,
      paidAmount: 1600,
      balanceAmount: 1600,
      status: 'PARTIALLY_PAID',
      items: {
        create: [
          { category: 'TUITION', amount: 2000 },
          { category: 'LABORATORY', amount: 500 },
          { category: 'LIBRARY', amount: 300 },
          { category: 'EXAMINATION', amount: 400 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoiceBob.id,
      amount: 1600,
      paymentMethod: 'UPI',
      transactionReference: 'SIM-TXN-UPI-4819',
      idempotencyKey: 'IDEMP-BOB-PAY-001',
      status: 'SUCCESS',
      recordedById: adminUser.id,
      notes: 'Term 1 installment payment',
    },
  });

  // Invoice 3: Carlos Garcia (Unpaid: $3,200 balance)
  await prisma.feeInvoice.create({
    data: {
      invoiceNumber: 'INV-2026-0003',
      studentId: class10AStudents[2].id,
      feeStructureId: feeStructure10.id,
      dueDate: new Date('2026-12-15'),
      totalAmount: 3200,
      paidAmount: 0,
      balanceAmount: 3200,
      status: 'UNPAID',
      items: {
        create: [
          { category: 'TUITION', amount: 2000 },
          { category: 'LABORATORY', amount: 500 },
          { category: 'LIBRARY', amount: 300 },
          { category: 'EXAMINATION', amount: 400 },
        ],
      },
    },
  });
  console.log('✓ Fee structure, invoices, and payments seeded');

  // 13. Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'System',
      entityId: 'ROOT',
      details: JSON.stringify({ message: 'Database populated with initial demo dataset' }),
      ipAddress: '127.0.0.1',
    },
  });

  console.log('--- Database Seeding Completed Successfully! ---');
}

// Auto-run if executed directly
if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('Seeding error:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
