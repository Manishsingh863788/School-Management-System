import { z } from 'zod';

export const createGuardianSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional(),
  occupation: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
  relationship: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']).optional(),
});

export const updateGuardianSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
});

export const linkStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  guardianId: z.string().min(1, 'Guardian ID is required'),
  relationship: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']).default('FATHER'),
  isPrimary: z.boolean().default(false),
});
