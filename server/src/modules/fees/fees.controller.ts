import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';

// ==========================================
// FEE STRUCTURES
// ==========================================
export const listFeeStructures = async (req: Request, res: Response) => {
  const structures = await prisma.feeStructure.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      academicYear: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      items: true,
      _count: { select: { invoices: true } },
    },
  });
  return sendSuccess(res, 'Fee structures retrieved', structures);
};

export const createFeeStructure = async (req: Request, res: Response) => {
  const { name, academicYearId, classId, description, items } = req.body;

  const totalAmount = items.reduce((sum: number, it: any) => sum + Number(it.amount), 0);

  const structure = await prisma.$transaction(async (tx) => {
    const created = await tx.feeStructure.create({
      data: {
        name: name.trim(),
        academicYearId,
        classId,
        description: description?.trim() || null,
        totalAmount,
        items: {
          create: items.map((it: any) => ({
            category: it.category,
            amount: Number(it.amount),
            description: it.description?.trim() || null,
          })),
        },
      },
      include: {
        items: true,
        class: { select: { name: true } },
      },
    });
    return created;
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'FEE_STRUCTURE_CREATED',
    entityType: 'FeeStructure',
    entityId: structure.id,
    details: { name: structure.name, totalAmount },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Fee structure created successfully', structure, 201);
};

// ==========================================
// INVOICES
// ==========================================
export const listInvoices = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const status = req.query.status as string;
  const classId = req.query.classId as string;
  let studentId = req.query.studentId as string;
  const search = (req.query.search as string)?.trim();

  const where: any = {};

  // Strict Guardian Isolation
  if (req.user?.role === 'GUARDIAN') {
    const guardianLinks = await prisma.studentGuardian.findMany({
      where: { guardianId: req.user.guardianId },
      select: { studentId: true },
    });
    const allowedStudentIds = guardianLinks.map((l) => l.studentId);

    if (allowedStudentIds.length === 0) {
      return sendSuccess(res, 'No invoices found', [], 200, {
        page,
        limit,
        total: 0,
        totalPages: 0,
      });
    }

    if (studentId) {
      if (!allowedStudentIds.includes(studentId)) {
        return sendError(res, 'Access denied: You cannot view invoices for unlinked students.', 403);
      }
      where.studentId = studentId;
    } else {
      where.studentId = { in: allowedStudentIds };
    }
  } else if (studentId) {
    where.studentId = studentId;
  }

  if (status) where.status = status;
  if (classId) {
    where.student = { classId };
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { student: { fullName: { contains: search, mode: 'insensitive' } } },
      { student: { admissionNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, invoices] = await Promise.all([
    prisma.feeInvoice.count({ where }),
    prisma.feeInvoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
        },
        feeStructure: { select: { name: true } },
        items: true,
      },
    }),
  ]);

  return sendSuccess(res, 'Invoices retrieved successfully', invoices, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getInvoiceById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const invoice = await prisma.feeInvoice.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      },
      feeStructure: true,
      items: true,
      payments: {
        orderBy: { paymentDate: 'desc' },
        include: {
          recordedBy: { select: { email: true } },
        },
      },
    },
  });

  if (!invoice) {
    return sendError(res, 'Invoice not found', 404);
  }

  // Guardian check
  if (req.user?.role === 'GUARDIAN') {
    const link = await prisma.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: invoice.studentId,
          guardianId: req.user.guardianId!,
        },
      },
    });
    if (!link) {
      return sendError(res, 'Access denied: Invoice does not belong to your linked student.', 403);
    }
  }

  return sendSuccess(res, 'Invoice retrieved successfully', invoice);
};

export const generateInvoices = async (req: Request, res: Response) => {
  const { feeStructureId, dueDate, classId, studentId } = req.body;

  const feeStructure = await prisma.feeStructure.findUnique({
    where: { id: feeStructureId },
    include: { items: true },
  });

  if (!feeStructure) {
    return sendError(res, 'Fee structure not found', 404);
  }

  let targetStudents: { id: string }[] = [];

  if (studentId) {
    targetStudents = [{ id: studentId }];
  } else if (classId) {
    targetStudents = await prisma.student.findMany({
      where: { classId, status: 'ACTIVE' },
      select: { id: true },
    });
  } else {
    // Generate for the feeStructure's designated class
    targetStudents = await prisma.student.findMany({
      where: { classId: feeStructure.classId, status: 'ACTIVE' },
      select: { id: true },
    });
  }

  if (targetStudents.length === 0) {
    return sendError(res, 'No active students found to generate invoices for.', 400);
  }

  const dateObj = new Date(dueDate);
  const now = new Date();
  const yearStr = now.getFullYear();

  // Create invoices in transaction
  const createdInvoices = await prisma.$transaction(async (tx) => {
    const results = [];
    for (let i = 0; i < targetStudents.length; i++) {
      const st = targetStudents[i];
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${yearStr}-${Date.now().toString().slice(-4)}${randomSuffix}`;

      const inv = await tx.feeInvoice.create({
        data: {
          invoiceNumber,
          studentId: st.id,
          feeStructureId,
          dueDate: dateObj,
          totalAmount: feeStructure.totalAmount,
          paidAmount: 0,
          balanceAmount: feeStructure.totalAmount,
          status: 'UNPAID',
          items: {
            create: feeStructure.items.map((item) => ({
              category: item.category,
              amount: item.amount,
              description: item.description,
            })),
          },
        },
      });
      results.push(inv);
    }
    return results;
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'INVOICES_GENERATED',
    entityType: 'FeeInvoice',
    details: { count: createdInvoices.length, feeStructureId },
    ipAddress: req.ip,
  });

  return sendSuccess(res, `Successfully generated ${createdInvoices.length} invoices.`, {
    count: createdInvoices.length,
    invoices: createdInvoices,
  }, 201);
};

// ==========================================
// SIMULATED PAYMENTS WITH IDEMPOTENCY
// ==========================================
export const recordPayment = async (req: Request, res: Response) => {
  const { invoiceId, amount, paymentMethod, idempotencyKey, transactionReference, notes } = req.body;

  // 1. Check idempotency: If payment with this idempotency key already exists, return it!
  const existingPayment = await prisma.payment.findUnique({
    where: { idempotencyKey },
    include: { invoice: true },
  });

  if (existingPayment) {
    return sendSuccess(
      res,
      'Duplicate payment request detected. Returning existing payment confirmation.',
      existingPayment,
      200
    );
  }

  // 2. Fetch target invoice
  const invoice = await prisma.feeInvoice.findUnique({
    where: { id: invoiceId },
    include: { student: true },
  });

  if (!invoice) {
    return sendError(res, 'Invoice not found', 404);
  }

  // Guardian ownership validation
  if (req.user?.role === 'GUARDIAN') {
    const link = await prisma.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: invoice.studentId,
          guardianId: req.user.guardianId!,
        },
      },
    });
    if (!link) {
      return sendError(res, 'Access denied: You cannot pay invoices for unlinked students.', 403);
    }
  }

  // 3. Status checks
  if (invoice.status === 'PAID') {
    return sendError(res, 'This invoice has already been fully paid.', 400);
  }
  if (invoice.status === 'CANCELLED') {
    return sendError(res, 'Cannot accept payment on a cancelled invoice.', 400);
  }

  // 4. Amount validations
  const paymentAmount = Number(amount);
  if (paymentAmount <= 0) {
    return sendError(res, 'Payment amount must be greater than zero.', 400);
  }

  if (paymentAmount > invoice.balanceAmount) {
    return sendError(
      res,
      `Payment amount ($${paymentAmount.toFixed(2)}) exceeds outstanding balance ($${invoice.balanceAmount.toFixed(2)}).`,
      400
    );
  }

  // 5. Database transaction: Record payment ledger and update invoice balance
  const result = await prisma.$transaction(async (tx) => {
    // Re-verify invoice inside transaction with row-level consistency
    const freshInvoice = await tx.feeInvoice.findUniqueOrThrow({
      where: { id: invoiceId },
    });

    if (paymentAmount > freshInvoice.balanceAmount) {
      throw new Error('Payment exceeds current outstanding balance.');
    }

    const newPaidAmount = Math.round((freshInvoice.paidAmount + paymentAmount) * 100) / 100;
    const newBalanceAmount = Math.round((freshInvoice.balanceAmount - paymentAmount) * 100) / 100;
    const newStatus = newBalanceAmount <= 0.001 ? 'PAID' : 'PARTIALLY_PAID';

    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amount: paymentAmount,
        paymentMethod: paymentMethod || 'CASH',
        transactionReference: transactionReference || `SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        idempotencyKey,
        status: 'SUCCESS',
        recordedById: req.user?.id || null,
        notes: notes || 'Simulated payment transaction',
      },
    });

    const updatedInvoice = await tx.feeInvoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        status: newStatus,
      },
    });

    return { payment, invoice: updatedInvoice };
  });

  await recordAuditLog({
    userId: req.user?.id,
    action: 'PAYMENT_RECORDED',
    entityType: 'Payment',
    entityId: result.payment.id,
    details: {
      invoiceId,
      amount: paymentAmount,
      idempotencyKey,
      newBalance: result.invoice.balanceAmount,
      status: result.invoice.status,
    },
    ipAddress: req.ip,
  });

  return sendSuccess(res, 'Payment processed successfully', result, 201);
};

export const listPayments = async (req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({
    orderBy: { paymentDate: 'desc' },
    take: 100,
    include: {
      invoice: {
        select: {
          invoiceNumber: true,
          student: { select: { fullName: true, admissionNumber: true } },
        },
      },
      recordedBy: { select: { email: true } },
    },
  });

  return sendSuccess(res, 'Payments ledger retrieved', payments);
};
