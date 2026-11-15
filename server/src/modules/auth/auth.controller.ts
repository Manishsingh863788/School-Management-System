import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      teacher: {
        select: {
          id: true,
          employeeId: true,
          fullName: true,
          phone: true,
          qualification: true,
          status: true,
        },
      },
      guardian: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          address: true,
          occupation: true,
          studentLinks: {
            include: {
              student: {
                select: {
                  id: true,
                  admissionNumber: true,
                  fullName: true,
                  gender: true,
                  class: { select: { id: true, name: true } },
                  section: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (user.status !== 'ACTIVE') {
    return sendError(res, 'This account is currently inactive or suspended. Contact administrator.', 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // Record audit log for successful login
  await recordAuditLog({
    userId: user.id,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress: req.ip,
  });

  const responseUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    fullName:
      user.role === 'ADMIN'
        ? 'System Administrator'
        : user.teacher?.fullName || user.guardian?.fullName || user.email,
    profile: user.teacher || user.guardian || null,
  };

  return sendSuccess(res, 'Login successful', {
    token,
    user: responseUser,
  });
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Unauthenticated', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      teacher: {
        include: {
          classesTaught: {
            select: { id: true, name: true, academicYear: { select: { name: true } } },
          },
          assignments: {
            include: {
              class: { select: { id: true, name: true } },
              section: { select: { id: true, name: true } },
              subject: { select: { id: true, name: true, code: true } },
            },
          },
        },
      },
      guardian: {
        include: {
          studentLinks: {
            include: {
              student: {
                select: {
                  id: true,
                  admissionNumber: true,
                  fullName: true,
                  gender: true,
                  class: { select: { id: true, name: true } },
                  section: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return sendError(res, 'User profile not found', 404);
  }

  const fullName =
    user.role === 'ADMIN'
      ? 'System Administrator'
      : user.teacher?.fullName || user.guardian?.fullName || user.email;

  return sendSuccess(res, 'User profile retrieved', {
    ...user,
    fullName,
  });
};

export const logout = async (req: Request, res: Response) => {
  if (req.user) {
    await recordAuditLog({
      userId: req.user.id,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: req.user.id,
      ipAddress: req.ip,
    });
  }
  return sendSuccess(res, 'Logout successful');
};
