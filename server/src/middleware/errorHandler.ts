import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled Server Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    return sendError(
      res,
      `A unique constraint was violated. A record with this ${target} already exists.`,
      409
    );
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return sendError(res, 'The requested record was not found.', 404);
  }

  // Generic internal server error
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred on the server.'
      : err.message || 'Internal Server Error';

  return sendError(res, message, err.statusCode || 500);
};
