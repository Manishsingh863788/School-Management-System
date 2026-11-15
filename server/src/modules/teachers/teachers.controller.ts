import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';

export const listTeachers = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim();
  const status = req.query.status as string;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { employeeId: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { qualification: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, teachers] = await Promise.all([
    prisma.teacher.count({ where }),
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: 'asc' },
      include: {
        user: { select: { email: true, status: true } },
        classesTaught: { select: { id: true, name: true } },
        assignments: {
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true, code: true } },
          },
        },
      },
    }),
  ]);

  return sendSuccess(res, 'Teachers retrieved successfully', teachers, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getTeacherById = async (req: Request, res: Response) => {
  const { id } = req.params;

  // If TEACHER role, can only see their own profile unless ADMIN
  if (req.user?.role === 'TEACHER' && req.user.teacherId !== id) {
    return sendError(res, 'Access denied: You cannot view other teacher profiles.', 403);
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, status: true, createdAt: true } },
      classesTaught: {
        include: {
          sections: { select: { id: true, name: true, capacity: true } },
          academicYear: { select: { name: true } },
        },
      },
      assignments: {
        include: {
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, code: true } },
        },
      },
      attendanceRecords: {
        take: 10,
        orderBy: { date: 'desc' },
        include: {
          student: { select: { fullName: true, admissionNumber: true } },
        },
      },
    },
  });

  if (!teacher) {
    return sendError(res, 'Teacher not found', 404);
  }

  return sendSuccess(res, 'Teacher details retrieved', teacher);
};

export const createTeacher = async (req: Request, res: Response) => {
  const { fullName, email, password, employeeId, phone, qualification, joiningDate, status } = req.body;

  // Check unique employeeId
  const existingEmployee = await prisma.teacher.findUnique({
    where: { employeeId: employeeId.trim() },
  });
  if (existingEmployee) {
    return sendError(res, `Employee ID '${employeeId}' is already registered.`, 409, [
      { field: 'employeeId', message: 'Duplicate employee ID' },
    ]);
  }

  // Check unique user email
  const existingEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existingEmail) {
    return sendError(res, `Email '${email}' is already registered.`, 409, [
      { field: 'email', message: 'Duplicate email' },
    ]);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const teacher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'TEACHER',
        status: status || 'ACTIVE',
      },
    });

    const newTeacher = await tx.teacher.create({
      data: {
        userId: user.id,
        employeeId: employeeId.trim(),
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        qualification: qualification?.trim() || null,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        status: status || 'ACTIVE',
      },
      include: {
        user: { select: { email: true } },
      },
    });

    return newTeacher;
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'TEACHER_CREATED',
    entityType: 'Teacher',
    entityId: teacher.id,
    details: { employeeId: teacher.employeeId, fullName: teacher.fullName },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Teacher created successfully', teacher, 201);
};

export const updateTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.teacher.findUnique({ where: { id } });
  if (!existing) {
    return sendError(res, 'Teacher not found', 404);
  }

  const updated = await prisma.teacher.update({
    where: { id },
    data: {
      ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.qualification !== undefined ? { qualification: data.qualification?.trim() || null } : {}),
      ...(data.status ? { status: data.status } : {}),
    },
    include: {
      user: { select: { email: true } },
    },
  });

  // If status changed, sync User status
  if (data.status) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { status: data.status },
    });
  }

  await recordAuditLog({
    userId: req.user?.id,
    action: 'TEACHER_UPDATED',
    entityType: 'Teacher',
    entityId: id,
    details: { updatedFields: Object.keys(data) },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Teacher updated successfully', updated);
};
