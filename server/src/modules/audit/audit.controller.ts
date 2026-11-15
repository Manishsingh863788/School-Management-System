import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { sendSuccess } from '../../utils/response.js';

export const listAuditLogs = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const action = req.query.action as string;
  const entityType = req.query.entityType as string;

  const where: any = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true } },
      },
    }),
  ]);

  const parsedLogs = logs.map((log) => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null,
  }));

  return sendSuccess(res, 'Audit logs retrieved', parsedLogs, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};
