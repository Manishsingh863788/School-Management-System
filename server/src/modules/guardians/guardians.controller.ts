import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';

export const listGuardians = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;
  const search = (req.query.search as string)?.trim();

  const where: any = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, guardians] = await Promise.all([
    prisma.guardian.count({ where }),
    prisma.guardian.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: 'asc' },
      include: {
        user: { select: { email: true, status: true } },
        studentLinks: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                admissionNumber: true,
                class: { select: { name: true } },
                section: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return sendSuccess(res, 'Guardians retrieved successfully', guardians, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getGuardianById = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Strict isolation: Guardian can only see their own profile
  if (req.user?.role === 'GUARDIAN' && req.user.guardianId !== id) {
    return sendError(res, 'Access denied: You cannot view other guardian profiles.', 403);
  }

  const guardian = await prisma.guardian.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, status: true, createdAt: true } },
      studentLinks: {
        include: {
          student: {
            include: {
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!guardian) {
    return sendError(res, 'Guardian not found', 404);
  }

  return sendSuccess(res, 'Guardian profile retrieved', guardian);
};

export const createGuardian = async (req: Request, res: Response) => {
  const { fullName, email, password, phone, address, occupation, studentIds, relationship } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    return sendError(res, 'A user with this email address already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'GUARDIAN',
      },
    });

    const guardian = await tx.guardian.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,
        occupation: occupation?.trim() || null,
        ...(studentIds && studentIds.length > 0
          ? {
              studentLinks: {
                create: studentIds.map((studentId: string, idx: number) => ({
                  studentId,
                  relationship: relationship || 'FATHER',
                  isPrimary: idx === 0,
                })),
              },
            }
          : {}),
      },
      include: {
        user: { select: { email: true } },
        studentLinks: {
          include: { student: { select: { fullName: true, admissionNumber: true } } },
        },
      },
    });

    return guardian;
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'GUARDIAN_CREATED',
    entityType: 'Guardian',
    entityId: result.id,
    details: { fullName: result.fullName, email },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Guardian registered successfully', result, 201);
};

export const updateGuardian = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const guardian = await prisma.guardian.findUnique({ where: { id } });
  if (!guardian) {
    return sendError(res, 'Guardian not found', 404);
  }

  const updated = await prisma.guardian.update({
    where: { id },
    data: {
      ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
      ...(data.phone ? { phone: data.phone.trim() } : {}),
      ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
      ...(data.occupation !== undefined ? { occupation: data.occupation?.trim() || null } : {}),
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'GUARDIAN_UPDATED',
    entityType: 'Guardian',
    entityId: id,
    details: { updatedFields: Object.keys(data) },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Guardian updated successfully', updated);
};

export const linkStudentToGuardian = async (req: Request, res: Response) => {
  const { studentId, guardianId, relationship, isPrimary } = req.body;

  const link = await prisma.studentGuardian.upsert({
    where: {
      studentId_guardianId: { studentId, guardianId },
    },
    create: {
      studentId,
      guardianId,
      relationship: relationship || 'FATHER',
      isPrimary: isPrimary ?? false,
    },
    update: {
      relationship: relationship || 'FATHER',
      isPrimary: isPrimary ?? false,
    },
    include: {
      student: { select: { fullName: true, admissionNumber: true } },
      guardian: { select: { fullName: true } },
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'GUARDIAN_LINKED_STUDENT',
    entityType: 'StudentGuardian',
    entityId: link.id,
    details: { studentId, guardianId, relationship },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Student linked to guardian successfully', link);
};
