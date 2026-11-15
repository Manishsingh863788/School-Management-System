import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { prisma } from '../config/prisma.js';

export const requireRole = (allowedRoles: ('ADMIN' | 'TEACHER' | 'GUARDIAN')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        403
      );
    }

    next();
  };
};

/**
 * Middleware ensuring a teacher can only access classes/sections assigned to them.
 * Admin bypasses this check.
 */
export const verifyTeacherClassAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  if (req.user.role === 'ADMIN') return next();

  if (req.user.role !== 'TEACHER' || !req.user.teacherId) {
    return sendError(res, 'Forbidden: Teacher access only', 403);
  }

  const classId = req.params.classId || req.body.classId || req.query.classId as string;
  const sectionId = req.params.sectionId || req.body.sectionId || req.query.sectionId as string;

  if (!classId) {
    return sendError(res, 'Class ID parameter is required for access verification', 400);
  }

  // Check if teacher is the designated class teacher
  const isClassTeacher = await prisma.class.findFirst({
    where: { id: classId, classTeacherId: req.user.teacherId },
  });

  if (isClassTeacher) return next();

  // Check if teacher has an active assignment in this class (and section if provided)
  const assignmentWhere: any = {
    classId,
    teacherId: req.user.teacherId,
  };
  if (sectionId) {
    assignmentWhere.sectionId = sectionId;
  }

  const assignment = await prisma.classSubjectAssignment.findFirst({
    where: assignmentWhere,
  });

  if (!assignment) {
    return sendError(
      res,
      'Access denied: You are not assigned to this class or section.',
      403
    );
  }

  next();
};

/**
 * Middleware ensuring a guardian can ONLY access records belonging to their linked students.
 * Admin bypasses this check.
 */
export const verifyGuardianStudentAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  if (req.user.role === 'ADMIN') return next();

  // If teacher, they may view if the student is in their assigned class
  if (req.user.role === 'TEACHER') {
    const studentId = req.params.studentId || req.params.id || req.body.studentId;
    if (!studentId) return sendError(res, 'Student ID parameter required', 400);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true, sectionId: true },
    });

    if (!student) return sendError(res, 'Student not found', 404);

    const hasAccess = await prisma.classSubjectAssignment.findFirst({
      where: {
        teacherId: req.user.teacherId,
        classId: student.classId,
        sectionId: student.sectionId,
      },
    }) || await prisma.class.findFirst({
      where: { id: student.classId, classTeacherId: req.user.teacherId },
    });

    if (!hasAccess) {
      return sendError(res, 'Access denied: Student is not in your assigned classes', 403);
    }

    return next();
  }

  if (req.user.role === 'GUARDIAN') {
    if (!req.user.guardianId) {
      return sendError(res, 'Guardian profile not found for this account', 403);
    }

    const studentId = req.params.studentId || req.params.id || req.body.studentId || req.query.studentId as string;
    if (!studentId) {
      return sendError(res, 'Student identifier required', 400);
    }

    const link = await prisma.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId,
          guardianId: req.user.guardianId,
        },
      },
    });

    if (!link) {
      return sendError(
        res,
        'Access denied: You do not have authorization to view this student record.',
        403
      );
    }

    return next();
  }

  return sendError(res, 'Unauthorized access', 403);
};
