import { z } from 'zod';

export const createFeeStructureSchema = z.object({
  name: z.string().min(1, 'Fee structure name is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        category: z.enum([
          'TUITION',
          'ADMISSION',
          'EXAMINATION',
          'TRANSPORTATION',
          'LIBRARY',
          'LABORATORY',
          'SPORTS',
          'OTHER',
        ]),
        amount: z.number().positive('Item amount must be positive'),
        description: z.string().optional(),
      })
    )
    .min(1, 'At least one fee line item is required'),
});

export const generateInvoicesSchema = z.object({
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  dueDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Valid due date required'),
  classId: z.string().optional(),
  studentId: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']).default('CASH'),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});
