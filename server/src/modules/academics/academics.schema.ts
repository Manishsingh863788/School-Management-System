import { z } from 'zod';

export const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'Name is required (e.g. 2026-2027)'),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Valid start date'),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Valid end date'),
  isCurrent: z.boolean().default(false),
});

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required (e.g. Class 10)'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  classTeacherId: z.string().optional().nullable(),
  description: z.string().optional(),
});

export const createSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required (e.g. A)'),
  capacity: z.number().int().positive().default(40),
  classId: z.string().min(1, 'Class ID is required'),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required (e.g. MATH101)'),
  description: z.string().optional(),
});

export const createAssignmentSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
});
