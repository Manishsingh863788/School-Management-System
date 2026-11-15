import { z } from 'zod';

export const createTeacherSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  phone: z.string().optional(),
  qualification: z.string().optional(),
  joiningDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), 'Valid date'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const updateTeacherSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  qualification: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});
