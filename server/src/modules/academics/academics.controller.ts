import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';

// ==========================================
// ACADEMIC YEARS
// ==========================================
export const listAcademicYears = async (req: Request, res: Response) => {
  const years = await prisma.academicYear.findMany({
    orderBy: { startDate: 'desc' },
  });
  return sendSuccess(res, 'Academic years retrieved', years);
};

export const createAcademicYear = async (req: Request, res: Response) => {
  const { name, startDate, endDate, isCurrent } = req.body;

  if (isCurrent) {
    // Demote any existing current year
    await prisma.academicYear.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const year = await prisma.academicYear.create({
    data: {
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: isCurrent || false,
    },
  });

  return sendSuccess(res, 'Academic year created', year, 201);
};

// ==========================================
// CLASSES
// ==========================================
export const listClasses = async (req: Request, res: Response) => {
  const classes = await prisma.class.findMany({
    orderBy: { name: 'asc' },
    include: {
      academicYear: { select: { id: true, name: true, isCurrent: true } },
      classTeacher: { select: { id: true, fullName: true, employeeId: true } },
      sections: {
        include: {
          _count: { select: { students: true } },
        },
      },
      _count: { select: { students: true } },
    },
  });
  return sendSuccess(res, 'Classes retrieved', classes);
};

export const createClass = async (req: Request, res: Response) => {
  const { name, academicYearId, classTeacherId, description } = req.body;

  const existing = await prisma.class.findUnique({
    where: {
      name_academicYearId: { name: name.trim(), academicYearId },
    },
  });

  if (existing) {
    return sendError(res, `A class named '${name}' already exists in this academic year.`, 409);
  }

  const newClass = await prisma.class.create({
    data: {
      name: name.trim(),
      academicYearId,
      classTeacherId: classTeacherId || null,
      description: description?.trim() || null,
    },
    include: {
      academicYear: { select: { name: true } },
      classTeacher: { select: { fullName: true } },
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'CLASS_CREATED',
    entityType: 'Class',
    entityId: newClass.id,
    details: { name: newClass.name },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Class created successfully', newClass, 201);
};

// ==========================================
// SECTIONS
// ==========================================
export const listSections = async (req: Request, res: Response) => {
  const classId = req.query.classId as string;
  const where: any = classId ? { classId } : {};

  const sections = await prisma.section.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      class: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });
  return sendSuccess(res, 'Sections retrieved', sections);
};

export const createSection = async (req: Request, res: Response) => {
  const { name, capacity, classId } = req.body;

  const existing = await prisma.section.findUnique({
    where: {
      name_classId: { name: name.trim(), classId },
    },
  });

  if (existing) {
    return sendError(res, `Section '${name}' already exists for this class.`, 409);
  }

  const section = await prisma.section.create({
    data: {
      name: name.trim(),
      capacity: capacity || 40,
      classId,
    },
    include: {
      class: { select: { name: true } },
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'SECTION_CREATED',
    entityType: 'Section',
    entityId: section.id,
    details: { name: section.name, classId },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Section created successfully', section, 201);
};

// ==========================================
// SUBJECTS
// ==========================================
export const listSubjects = async (req: Request, res: Response) => {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  });
  return sendSuccess(res, 'Subjects retrieved', subjects);
};

export const createSubject = async (req: Request, res: Response) => {
  const { name, code, description } = req.body;

  const existing = await prisma.subject.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (existing) {
    return sendError(res, `Subject code '${code}' already exists.`, 409);
  }

  const subject = await prisma.subject.create({
    data: {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'SUBJECT_CREATED',
    entityType: 'Subject',
    entityId: subject.id,
    details: { name: subject.name, code: subject.code },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Subject created successfully', subject, 201);
};

// ==========================================
// CLASS-SUBJECT-TEACHER ASSIGNMENTS
// ==========================================
export const listAssignments = async (req: Request, res: Response) => {
  const teacherId = req.query.teacherId as string;
  const classId = req.query.classId as string;
  const sectionId = req.query.sectionId as string;

  const where: any = {};
  if (teacherId) where.teacherId = teacherId;
  if (classId) where.classId = classId;
  if (sectionId) where.sectionId = sectionId;

  // If caller is TEACHER, filter only to their assignments
  if (req.user?.role === 'TEACHER') {
    where.teacherId = req.user.teacherId;
  }

  const assignments = await prisma.classSubjectAssignment.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, fullName: true, employeeId: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { section: { name: 'asc' } }],
  });

  return sendSuccess(res, 'Assignments retrieved', assignments);
};

export const createAssignment = async (req: Request, res: Response) => {
  const { classId, sectionId, subjectId, teacherId } = req.body;

  // Check section belongs to class
  const section = await prisma.section.findFirst({
    where: { id: sectionId, classId },
  });
  if (!section) {
    return sendError(res, 'Selected section does not belong to the selected class.', 400);
  }

  // Check unique assignment: (classId, sectionId, subjectId)
  const existing = await prisma.classSubjectAssignment.findUnique({
    where: {
      classId_sectionId_subjectId: { classId, sectionId, subjectId },
    },
  });

  if (existing) {
    // If updating teacher for this assignment
    const updated = await prisma.classSubjectAssignment.update({
      where: { id: existing.id },
      data: { teacherId },
      include: {
        class: { select: { name: true } },
        section: { select: { name: true } },
        subject: { select: { name: true } },
        teacher: { select: { fullName: true } },
      },
    });
    return sendSuccess(res, 'Assignment updated with new teacher', updated);
  }

  const assignment = await prisma.classSubjectAssignment.create({
    data: { classId, sectionId, subjectId, teacherId },
    include: {
      class: { select: { name: true } },
      section: { select: { name: true } },
      subject: { select: { name: true } },
      teacher: { select: { fullName: true } },
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'TEACHER_ASSIGNMENT_CREATED',
    entityType: 'ClassSubjectAssignment',
    entityId: assignment.id,
    details: { classId, sectionId, subjectId, teacherId },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Teacher assigned to class and subject', assignment, 201);
};
