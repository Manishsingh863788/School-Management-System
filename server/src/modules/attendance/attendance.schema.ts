import { z } from 'zod';

export const submitAttendanceSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid attendance date required'),
  session: z.enum(['MORNING', 'AFTERNOON']).default('MORNING'),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        remarks: z.string().optional().nullable(),
      })
    )
    .min(1, 'At least one student attendance record is required'),
});

export const getAttendanceQuerySchema = z.object({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  studentId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  date: z.string().optional(),
  session: z.enum(['MORNING', 'AFTERNOON']).optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).optional(),
});
