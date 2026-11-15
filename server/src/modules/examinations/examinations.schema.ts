import { z } from 'zod';

export const createExamSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  term: z.enum(['FIRST_TERM', 'MID_TERM', 'FINAL_TERM', 'UNIT_TEST']).default('MID_TERM'),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Valid start date'),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Valid end date'),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'PUBLISHED']).default('UPCOMING'),
  examSubjects: z
    .array(
      z.object({
        subjectId: z.string().min(1),
        classId: z.string().min(1),
        maxMarks: z.number().positive().default(100),
        passMarks: z.number().positive().default(40),
        examDate: z.string().optional().refine((v) => !v || !isNaN(Date.parse(v)), 'Valid date'),
      })
    )
    .optional(),
});

export const submitMarksSchema = z.object({
  examSubjectId: z.string().min(1, 'Exam subject is required'),
  marks: z
    .array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        marksObtained: z.number().min(0, 'Marks obtained cannot be negative'),
        isAbsent: z.boolean().default(false),
        remarks: z.string().optional().nullable(),
      })
    )
    .min(1, 'At least one student mark entry is required'),
});

export const createGradeRuleSchema = z.object({
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  grade: z.string().min(1),
  gradePoint: z.number().min(0),
  description: z.string().optional(),
});
