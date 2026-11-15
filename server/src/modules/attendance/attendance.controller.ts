import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';

export const recordAttendance = async (req: Request, res: Response) => {
  const { classId, sectionId, date, session, records } = req.body;

  // Authorization check for TEACHER role
  let recordedById = req.user?.teacherId;

  if (req.user?.role === 'TEACHER') {
    if (!recordedById) {
      return sendError(res, 'Teacher profile not found for authenticated user', 403);
    }

    // Verify teacher assignment to this class & section
    const isClassTeacher = await prisma.class.findFirst({
      where: { id: classId, classTeacherId: recordedById },
    });

    const isAssignedSubject = await prisma.classSubjectAssignment.findFirst({
      where: { classId, sectionId, teacherId: recordedById },
    });

    if (!isClassTeacher && !isAssignedSubject) {
      return sendError(
        res,
        'Access denied: You are not assigned to take attendance for this class and section.',
        403
      );
    }
  } else if (req.user?.role === 'ADMIN') {
    // If admin recorded attendance without being a teacher, fallback to any teacher or the class teacher
    if (!recordedById) {
      const cls = await prisma.class.findUnique({
        where: { id: classId },
        select: { classTeacherId: true },
      });
      recordedById = cls?.classTeacherId || undefined;

      if (!recordedById) {
        const anyTeacher = await prisma.teacher.findFirst();
        recordedById = anyTeacher?.id;
      }

      if (!recordedById) {
        return sendError(res, 'A teacher record is required to record attendance.', 400);
      }
    }
  } else {
    return sendError(res, 'Forbidden', 403);
  }

  // Normalize date to YYYY-MM-DD UTC
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return sendError(res, 'Invalid attendance date', 400);
  }

  // Prevent future dates
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsedDate > today) {
    return sendError(res, 'Cannot record attendance for future dates.', 400);
  }

  const attendanceDate = new Date(
    Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate())
  );

  // Validate that all students belong to the class and section
  const studentIds = records.map((r: any) => r.studentId);
  const enrolledStudents = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      classId,
      sectionId,
    },
    select: { id: true },
  });

  if (enrolledStudents.length !== studentIds.length) {
    return sendError(
      res,
      'Some students in the payload are not enrolled in the specified class and section.',
      400
    );
  }

  // Execute attendance upserts inside a database transaction
  const upsertResults = await prisma.$transaction(
    records.map((r: any) =>
      prisma.attendance.upsert({
        where: {
          studentId_date_session: {
            studentId: r.studentId,
            date: attendanceDate,
            session: session || 'MORNING',
          },
        },
        update: {
          status: r.status,
          recordedById: recordedById!,
          remarks: r.remarks || null,
        },
        create: {
          studentId: r.studentId,
          date: attendanceDate,
          session: session || 'MORNING',
          status: r.status,
          recordedById: recordedById!,
          remarks: r.remarks || null,
        },
      })
    )
  );

  // Calculate summary counts
  const summary = {
    total: upsertResults.length,
    present: upsertResults.filter((r) => r.status === 'PRESENT').length,
    absent: upsertResults.filter((r) => r.status === 'ABSENT').length,
    late: upsertResults.filter((r) => r.status === 'LATE').length,
    excused: upsertResults.filter((r) => r.status === 'EXCUSED').length,
  };

  await recordAuditLog({
    userId: req.user?.id,
    action: 'ATTENDANCE_RECORDED',
    entityType: 'Attendance',
    details: {
      classId,
      sectionId,
      date: attendanceDate.toISOString().split('T')[0],
      session,
      ...summary,
    },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Attendance recorded successfully', {
    date: attendanceDate.toISOString().split('T')[0],
    session,
    summary,
    records: upsertResults,
  });
};

export const getAttendance = async (req: Request, res: Response) => {
  const { classId, sectionId, studentId, date, startDate, endDate, session, status } = req.query as any;

  const where: any = {};

  if (studentId) where.studentId = studentId;

  if (date) {
    const d = new Date(date);
    where.date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  if (session) where.session = session;
  if (status) where.status = status;

  if (classId || sectionId) {
    where.student = {
      ...(classId ? { classId } : {}),
      ...(sectionId ? { sectionId } : {}),
    };
  }

  // Teacher scoping
  if (req.user?.role === 'TEACHER') {
    const assignments = await prisma.classSubjectAssignment.findMany({
      where: { teacherId: req.user.teacherId },
      select: { classId: true, sectionId: true },
    });
    const classesTaught = await prisma.class.findMany({
      where: { classTeacherId: req.user.teacherId },
      select: { id: true },
    });

    const allowedClassIds = Array.from(
      new Set([...assignments.map((a) => a.classId), ...classesTaught.map((c) => c.id)])
    );

    if (where.student?.classId) {
      if (!allowedClassIds.includes(where.student.classId)) {
        return sendError(res, 'Access denied: You are not assigned to this class.', 403);
      }
    } else {
      where.student = {
        ...where.student,
        classId: { in: allowedClassIds },
      };
    }
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: [{ date: 'desc' }, { student: { fullName: 'asc' } }],
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          admissionNumber: true,
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      },
      recordedBy: {
        select: { fullName: true, employeeId: true },
      },
    },
  });

  return sendSuccess(res, 'Attendance records retrieved', records);
};

export const getStudentAttendance = async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const records = await prisma.attendance.findMany({
    where: { studentId },
    orderBy: { date: 'desc' },
    include: {
      recordedBy: { select: { fullName: true } },
    },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const absent = records.filter((r) => r.status === 'ABSENT').length;
  const excused = records.filter((r) => r.status === 'EXCUSED').length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return sendSuccess(res, 'Student attendance summary retrieved', {
    summary: { total, present, late, absent, excused, percentage },
    records,
  });
};
