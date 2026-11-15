import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';

export const listStudents = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const search = (req.query.search as string)?.trim();
  const classId = req.query.classId as string;
  const sectionId = req.query.sectionId as string;
  const status = req.query.status as string;

  const where: any = {};

  // If TEACHER, scope only to their assigned classes
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

    if (allowedClassIds.length === 0) {
      return sendSuccess(res, 'No students in assigned classes', [], 200, {
        page,
        limit,
        total: 0,
        totalPages: 0,
      });
    }

    where.classId = classId && allowedClassIds.includes(classId) ? classId : { in: allowedClassIds };
  } else if (classId) {
    where.classId = classId;
  }

  if (sectionId) {
    where.sectionId = sectionId;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { admissionNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: 'asc' },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        guardians: {
          include: {
            guardian: {
              select: { id: true, fullName: true, phone: true },
            },
          },
        },
      },
    }),
  ]);

  return sendSuccess(res, 'Students fetched successfully', students, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getStudentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          classTeacher: { select: { fullName: true, employeeId: true } },
        },
      },
      section: { select: { id: true, name: true } },
      guardians: {
        include: {
          guardian: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              address: true,
              occupation: true,
              user: { select: { email: true } },
            },
          },
        },
      },
      attendance: {
        take: 30,
        orderBy: { date: 'desc' },
        include: {
          recordedBy: { select: { fullName: true } },
        },
      },
      examResults: {
        include: {
          examSubject: {
            include: {
              subject: { select: { name: true, code: true } },
              examination: { select: { name: true, term: true } },
            },
          },
        },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payments: { select: { id: true, amount: true, paymentMethod: true, paymentDate: true } },
        },
      },
    },
  });

  if (!student) {
    return sendError(res, 'Student not found', 404);
  }

  // Calculate attendance summary
  const totalAttendance = student.attendance.length;
  const presentCount = student.attendance.filter((a) => a.status === 'PRESENT').length;
  const lateCount = student.attendance.filter((a) => a.status === 'LATE').length;
  const absentCount = student.attendance.filter((a) => a.status === 'ABSENT').length;
  const excusedCount = student.attendance.filter((a) => a.status === 'EXCUSED').length;
  const attendanceRate = totalAttendance > 0 ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0;

  // Fee summary
  const totalFeeInvoiced = student.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalFeePaid = student.invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalFeeOutstanding = student.invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);

  return sendSuccess(res, 'Student details retrieved', {
    ...student,
    summary: {
      attendance: {
        total: totalAttendance,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        excused: excusedCount,
        percentage: attendanceRate,
      },
      fees: {
        total: totalFeeInvoiced,
        paid: totalFeePaid,
        outstanding: totalFeeOutstanding,
      },
    },
  });
};

export const createStudent = async (req: Request, res: Response) => {
  const {
    admissionNumber,
    fullName,
    dob,
    gender,
    email,
    phone,
    address,
    admissionDate,
    classId,
    sectionId,
    guardianId,
    relationship,
    status,
  } = req.body;

  // Check duplicate admission number
  const existing = await prisma.student.findUnique({
    where: { admissionNumber: admissionNumber.trim() },
  });

  if (existing) {
    return sendError(res, `Admission number '${admissionNumber}' is already registered.`, 409, [
      { field: 'admissionNumber', message: 'Duplicate admission number' },
    ]);
  }

  const student = await prisma.student.create({
    data: {
      admissionNumber: admissionNumber.trim(),
      fullName: fullName.trim(),
      dob: new Date(dob),
      gender,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      status: status || 'ACTIVE',
      classId,
      sectionId,
      ...(guardianId
        ? {
            guardians: {
              create: {
                guardianId,
                relationship: relationship || 'FATHER',
                isPrimary: true,
              },
            },
          }
        : {}),
    },
    include: {
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'STUDENT_CREATED',
    entityType: 'Student',
    entityId: student.id,
    details: { admissionNumber: student.admissionNumber, fullName: student.fullName },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Student created successfully', student, 201);
};

export const updateStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    return sendError(res, 'Student not found', 404);
  }

  // If admission number is changing, check uniqueness
  if (data.admissionNumber && data.admissionNumber !== existing.admissionNumber) {
    const duplicate = await prisma.student.findUnique({
      where: { admissionNumber: data.admissionNumber.trim() },
    });
    if (duplicate) {
      return sendError(res, `Admission number '${data.admissionNumber}' is already in use.`, 409);
    }
  }

  const updated = await prisma.student.update({
    where: { id },
    data: {
      ...(data.admissionNumber ? { admissionNumber: data.admissionNumber.trim() } : {}),
      ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
      ...(data.dob ? { dob: new Date(data.dob) } : {}),
      ...(data.gender ? { gender: data.gender } : {}),
      ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.classId ? { classId: data.classId } : {}),
      ...(data.sectionId ? { sectionId: data.sectionId } : {}),
    },
    include: {
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'STUDENT_UPDATED',
    entityType: 'Student',
    entityId: id,
    details: { updatedFields: Object.keys(data) },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Student updated successfully', updated);
};

export const deleteStudent = async (req: Request, res: Response) => {
  const { id } = req.params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    return sendError(res, 'Student not found', 404);
  }

  // Soft deactivate
  const deactivated = await prisma.student.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'STUDENT_DEACTIVATED',
    entityType: 'Student',
    entityId: id,
    details: { admissionNumber: student.admissionNumber },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Student deactivated successfully', deactivated);
};
