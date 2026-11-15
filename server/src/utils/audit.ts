import { prisma } from '../config/prisma.js';

export interface AuditLogOptions {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
}

// Sanitize details to strip passwords, tokens, hashes, card info
export const sanitizeDetails = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeDetails);

  const clean: Record<string, any> = {};
  const blockedKeys = ['password', 'passwordhash', 'token', 'secret', 'cvv', 'cardnumber'];

  for (const [key, value] of Object.entries(obj)) {
    if (blockedKeys.some((b) => key.toLowerCase().includes(b))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeDetails(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

export const recordAuditLog = async (options: AuditLogOptions) => {
  try {
    const sanitized = options.details ? JSON.stringify(sanitizeDetails(options.details)) : null;
    await prisma.auditLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId || null,
        details: sanitized,
        ipAddress: options.ipAddress || null,
      },
    });
  } catch (error) {
    // Non-fatal, log to console so main transaction isn't broken
    console.error('Failed to create audit log entry:', error);
  }
};
