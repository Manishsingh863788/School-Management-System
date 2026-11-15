import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';
import { calculateExamReport, DEFAULT_GRADE_RULES } from '../../utils/grading.js';
import { env } from '../../config/env.js';

// ==========================================
// EXAMS & SCHEDULES
// ==========================================
export const listExaminations = async (req: Request, res: Response) => {
  const exams = await prisma.examination.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      academicYear: { select: { id: true, name: true } },
      examSubjects: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true } },
          _count: { select: { results: true } },
        },
      },
    },
  });

  return sendSuccess(res, 'Examinations retrieved', exams);
};

export const getExaminationById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const exam = await prisma.examination.findUnique({
    where: { id },
    include: {
      academicYear: { select: { id: true, name: true } },
      examSubjects: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true } },
          results: {
            include: {
              student: {
                select: {
                  id: true,
                  fullName: true,
                  admissionNumber: true,
                  section: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!exam) {
    return sendError(res, 'Examination not found', 404);
  }

  return sendSuccess(res, 'Examination details retrieved', exam);
};

export const createExamination = async (req: Request, res: Response) => {
  const { name, academicYearId, term, startDate, endDate, status, examSubjects } = req.body;

  const exam = await prisma.$transaction(async (tx) => {
    const created = await tx.examination.create({
      data: {
        name: name.trim(),
        academicYearId,
        term: term || 'MID_TERM',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'UPCOMING',
        ...(examSubjects && examSubjects.length > 0
          ? {
              examSubjects: {
                create: examSubjects.map((es: any) => ({
                  subjectId: es.subjectId,
                  classId: es.classId,
                  maxMarks: es.maxMarks || 100,
                  passMarks: es.passMarks || 40,
                  examDate: es.examDate ? new Date(es.examDate) : null,
                })),
              },
            }
          : {}),
      },
      include: {
        academicYear: { select: { name: true } },
        examSubjects: {
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    });

    return created;
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'EXAMINATION_CREATED',
    entityType: 'Examination',
    entityId: exam.id,
    details: { name: exam.name, term: exam.term },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Examination created successfully', exam, 201);
};

// ==========================================
// MARKS ENTRY & SUBMISSION
// ==========================================
export const getMarksForExamSubject = async (req: Request, res: Response) => {
  const { examSubjectId } = req.params;

  const examSubject = await prisma.examSubject.findUnique({
    where: { id: examSubjectId },
    include: {
      examination: { select: { id: true, name: true, status: true } },
      subject: { select: { id: true, name: true, code: true } },
      class: {
        select: {
          id: true,
          name: true,
          students: {
            where: { status: 'ACTIVE' },
            orderBy: { fullName: 'asc' },
            select: {
              id: true,
              fullName: true,
              admissionNumber: true,
              section: { select: { id: true, name: true } },
            },
          },
        },
      },
      results: true,
    },
  });

  if (!examSubject) {
    return sendError(res, 'Exam subject not found', 404);
  }

  // If TEACHER, verify access
  if (req.user?.role === 'TEACHER') {
    const isAssigned = await prisma.classSubjectAssignment.findFirst({
      where: {
        teacherId: req.user.teacherId,
        classId: examSubject.classId,
        subjectId: examSubject.subjectId,
      },
    });
    const isClassTeacher = await prisma.class.findFirst({
      where: {
        id: examSubject.classId,
        classTeacherId: req.user.teacherId,
      },
    });

    if (!isAssigned && !isClassTeacher) {
      return sendError(res, 'Access denied: You are not assigned to this subject or class.', 403);
    }
  }

  // Map results to students
  const resultMap = new Map(examSubject.results.map((r) => [r.studentId, r]));
  const studentRows = examSubject.class.students.map((st) => {
    const resEntry = resultMap.get(st.id);
    return {
      studentId: st.id,
      fullName: st.fullName,
      admissionNumber: st.admissionNumber,
      section: st.section.name,
      marksObtained: resEntry ? resEntry.marksObtained : null,
      isAbsent: resEntry ? resEntry.isAbsent : false,
      remarks: resEntry?.remarks || '',
    };
  });

  return sendSuccess(res, 'Exam marks sheet retrieved', {
    examSubject: {
      id: examSubject.id,
      examName: examSubject.examination.name,
      subjectName: examSubject.subject.name,
      subjectCode: examSubject.subject.code,
      className: examSubject.class.name,
      maxMarks: examSubject.maxMarks,
      passMarks: examSubject.passMarks,
      examDate: examSubject.examDate,
    },
    students: studentRows,
  });
};

export const submitMarks = async (req: Request, res: Response) => {
  const { examSubjectId, marks } = req.body;

  const examSubject = await prisma.examSubject.findUnique({
    where: { id: examSubjectId },
    include: {
      subject: true,
      class: true,
    },
  });

  if (!examSubject) {
    return sendError(res, 'Exam subject not found', 404);
  }

  // Teacher authorization check
  if (req.user?.role === 'TEACHER') {
    const isAssigned = await prisma.classSubjectAssignment.findFirst({
      where: {
        teacherId: req.user.teacherId,
        classId: examSubject.classId,
        subjectId: examSubject.subjectId,
      },
    });
    const isClassTeacher = await prisma.class.findFirst({
      where: {
        id: examSubject.classId,
        classTeacherId: req.user.teacherId,
      },
    });

    if (!isAssigned && !isClassTeacher) {
      return sendError(res, 'Access denied: You are not authorized to enter marks for this exam subject.', 403);
    }
  }

  // Strictly validate marks values
  for (const m of marks) {
    if (m.marksObtained < 0) {
      return sendError(res, `Marks cannot be negative. Invalid for student ${m.studentId}`, 400);
    }
    if (m.marksObtained > examSubject.maxMarks) {
      return sendError(
        res,
        `Marks obtained (${m.marksObtained}) cannot exceed maximum marks (${examSubject.maxMarks}).`,
        400
      );
    }
  }

  // Bulk upsert marks in transaction
  const upserted = await prisma.$transaction(
    marks.map((m: any) =>
      prisma.examResult.upsert({
        where: {
          studentId_examSubjectId: {
            studentId: m.studentId,
            examSubjectId,
          },
        },
        update: {
          marksObtained: m.isAbsent ? 0 : m.marksObtained,
          isAbsent: m.isAbsent || false,
          remarks: m.remarks || null,
        },
        create: {
          studentId: m.studentId,
          examSubjectId,
          marksObtained: m.isAbsent ? 0 : m.marksObtained,
          isAbsent: m.isAbsent || false,
          remarks: m.remarks || null,
        },
      })
    )
  );

  await recordAuditLog({
    userId: req.user?.id,
    action: 'EXAM_MARKS_SUBMITTED',
    entityType: 'ExamSubject',
    entityId: examSubjectId,
    details: {
      count: upserted.length,
      maxMarks: examSubject.maxMarks,
    },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Exam marks saved successfully', {
    examSubjectId,
    submittedCount: upserted.length,
  });
};

// ==========================================
// REPORT CARD ENGINE & CALCULATIONS
// ==========================================
export const getStudentReportCard = async (req: Request, res: Response) => {
  const { studentId, examId } = req.params;

  const [student, exam, gradeRules] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: { select: { id: true, name: true, academicYear: { select: { name: true } } } },
        section: { select: { id: true, name: true } },
      },
    }),
    prisma.examination.findUnique({
      where: { id: examId },
      include: {
        academicYear: { select: { name: true } },
        examSubjects: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            results: {
              where: { studentId },
            },
          },
        },
      },
    }),
    prisma.gradeRule.findMany({
      orderBy: { minPercentage: 'desc' },
    }),
  ]);

  if (!student) return sendError(res, 'Student not found', 404);
  if (!exam) return sendError(res, 'Examination not found', 404);

  // Filter exam subjects relevant to the student's class
  const classExamSubjects = exam.examSubjects.filter((es) => es.classId === student.classId);

  const rawSubjects = classExamSubjects.map((es) => {
    const result = es.results[0];
    return {
      subjectId: es.subject.id,
      subjectName: es.subject.name,
      subjectCode: es.subject.code,
      marksObtained: result ? result.marksObtained : 0,
      maxMarks: es.maxMarks,
      passMarks: es.passMarks,
      isAbsent: result ? result.isAbsent : true,
    };
  });

  const rules = gradeRules.length > 0 ? gradeRules : DEFAULT_GRADE_RULES;
  const calculations = calculateExamReport(rawSubjects, rules);

  return sendSuccess(res, 'Report card generated', {
    school: {
      name: env.SCHOOL_NAME,
      address: env.SCHOOL_ADDRESS,
      phone: env.SCHOOL_PHONE,
      email: env.SCHOOL_EMAIL,
    },
    student: {
      id: student.id,
      admissionNumber: student.admissionNumber,
      fullName: student.fullName,
      dob: student.dob,
      gender: student.gender,
      className: student.class.name,
      sectionName: student.section.name,
      academicYear: student.class.academicYear.name,
    },
    examination: {
      id: exam.id,
      name: exam.name,
      term: exam.term,
      startDate: exam.startDate,
      endDate: exam.endDate,
    },
    results: calculations,
  });
};

export const downloadReportCardPdf = async (req: Request, res: Response) => {
  const { studentId, examId } = req.params;

  const [student, exam, gradeRules] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: { select: { id: true, name: true, academicYear: { select: { name: true } } } },
        section: { select: { id: true, name: true } },
      },
    }),
    prisma.examination.findUnique({
      where: { id: examId },
      include: {
        academicYear: { select: { name: true } },
        examSubjects: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            results: { where: { studentId } },
          },
        },
      },
    }),
    prisma.gradeRule.findMany({ orderBy: { minPercentage: 'desc' } }),
  ]);

  if (!student || !exam) {
    return sendError(res, 'Report card details not found', 404);
  }

  const classExamSubjects = exam.examSubjects.filter((es) => es.classId === student.classId);
  const rawSubjects = classExamSubjects.map((es) => {
    const result = es.results[0];
    return {
      subjectId: es.subject.id,
      subjectName: es.subject.name,
      subjectCode: es.subject.code,
      marksObtained: result ? result.marksObtained : 0,
      maxMarks: es.maxMarks,
      passMarks: es.passMarks,
      isAbsent: result ? result.isAbsent : true,
    };
  });

  const rules = gradeRules.length > 0 ? gradeRules : DEFAULT_GRADE_RULES;
  const calculations = calculateExamReport(rawSubjects, rules);

  // Generate PDF via PDFKit
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ReportCard_${student.admissionNumber}_${exam.name.replace(/\s+/g, '_')}.pdf"`
  );

  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text(env.SCHOOL_NAME, { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(env.SCHOOL_ADDRESS, { align: 'center' });
  doc.text(`Email: ${env.SCHOOL_EMAIL} | Tel: ${env.SCHOOL_PHONE}`, { align: 'center' });
  doc.moveDown(1);
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(1);

  // Title
  doc.fontSize(15).font('Helvetica-Bold').fillColor('#2563eb').text('STUDENT PROGRESS REPORT CARD', { align: 'center' });
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(exam.name.toUpperCase(), { align: 'center' });
  doc.moveDown(1);

  // Student Details Grid
  const startY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b');
  doc.text(`Student Name:`, 40, startY);
  doc.font('Helvetica').text(student.fullName, 140, startY);

  doc.font('Helvetica-Bold').text(`Admission No:`, 320, startY);
  doc.font('Helvetica').text(student.admissionNumber, 420, startY);

  doc.font('Helvetica-Bold').text(`Class & Section:`, 40, startY + 18);
  doc.font('Helvetica').text(`${student.class.name} - ${student.section.name}`, 140, startY + 18);

  doc.font('Helvetica-Bold').text(`Academic Year:`, 320, startY + 18);
  doc.font('Helvetica').text(student.class.academicYear.name, 420, startY + 18);

  doc.moveDown(3);

  // Table Header
  const tableTop = doc.y + 10;
  doc.rect(40, tableTop, 515, 22).fill('#f1f5f9');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
  doc.text('Subject', 50, tableTop + 6);
  doc.text('Code', 200, tableTop + 6);
  doc.text('Max Marks', 270, tableTop + 6);
  doc.text('Pass Marks', 340, tableTop + 6);
  doc.text('Marks Obtained', 410, tableTop + 6);
  doc.text('Grade', 490, tableTop + 6);

  let currentY = tableTop + 24;
  doc.font('Helvetica').fontSize(9);

  calculations.subjects.forEach((sub, i) => {
    if (i % 2 === 1) {
      doc.rect(40, currentY, 515, 20).fill('#f8fafc');
    }
    doc.fillColor('#334155');
    doc.text(sub.subjectName, 50, currentY + 5);
    doc.text(sub.subjectCode, 200, currentY + 5);
    doc.text(sub.maxMarks.toString(), 270, currentY + 5);
    doc.text(sub.passMarks.toString(), 340, currentY + 5);
    doc.text(sub.isAbsent ? 'ABSENT' : sub.marksObtained.toString(), 410, currentY + 5);
    doc.font('Helvetica-Bold').text(sub.grade, 490, currentY + 5);
    doc.font('Helvetica');

    currentY += 20;
  });

  // Table Total Row
  doc.rect(40, currentY, 515, 24).fill('#e2e8f0');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
  doc.text('OVERALL TOTAL', 50, currentY + 7);
  doc.text(calculations.totalMaxMarks.toString(), 270, currentY + 7);
  doc.text(calculations.totalObtainedMarks.toString(), 410, currentY + 7);
  doc.text(calculations.overallGrade, 490, currentY + 7);

  currentY += 35;

  // Summary Cards
  doc.rect(40, currentY, 250, 60).fill('#f8fafc').stroke('#cbd5e1');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
  doc.text('Overall Performance', 55, currentY + 12);
  doc.font('Helvetica').fontSize(9).text(`Percentage: ${calculations.overallPercentage}%`, 55, currentY + 28);
  doc.text(`Final Grade: ${calculations.overallGrade}`, 55, currentY + 42);

  const statusColor = calculations.overallPassed ? '#16a34a' : '#dc2626';
  doc.rect(305, currentY, 250, 60).fill('#f8fafc').stroke('#cbd5e1');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
  doc.text('Result Status', 320, currentY + 12);
  doc.fillColor(statusColor).fontSize(14).text(calculations.overallPassed ? 'PASSED' : 'NEEDS IMPROVEMENT', 320, currentY + 30);

  // Signatures
  const sigY = 720;
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(60, sigY).lineTo(200, sigY).stroke();
  doc.fillColor('#64748b').font('Helvetica').fontSize(9).text('Class Teacher Signature', 60, sigY + 6, { width: 140, align: 'center' });

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(360, sigY).lineTo(500, sigY).stroke();
  doc.text('Principal / Headmaster Signature', 360, sigY + 6, { width: 140, align: 'center' });

  doc.end();
};

export const listGradeRules = async (req: Request, res: Response) => {
  const rules = await prisma.gradeRule.findMany({
    orderBy: { minPercentage: 'desc' },
  });
  return sendSuccess(res, 'Grade rules retrieved', rules.length > 0 ? rules : DEFAULT_GRADE_RULES);
};
