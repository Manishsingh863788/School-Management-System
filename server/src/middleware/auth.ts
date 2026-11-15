import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';
import { prisma } from '../config/prisma.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'GUARDIAN';
  teacherId?: string;
  guardianId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateJwt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: 'ADMIN' | 'TEACHER' | 'GUARDIAN';
    };

    // Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        teacher: { select: { id: true, status: true } },
        guardian: { select: { id: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return sendError(res, 'Account is inactive or no longer exists.', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'TEACHER' | 'GUARDIAN',
      teacherId: user.teacher?.id,
      guardianId: user.guardian?.id,
    };

    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token. Please log in again.', 401);
  }
};
