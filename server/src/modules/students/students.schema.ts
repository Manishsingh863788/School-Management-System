import { z } from 'zod';

export const createStudentSchema = z.object({
  admissionNumber: z.string().min(1, 'Admission number is required'),
  fullName: z.string().min(1, 'Full name is required'),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date of birth required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  admissionDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), 'Valid admission date'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  guardianId: z.string().optional(),
  relationship: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED']).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();
