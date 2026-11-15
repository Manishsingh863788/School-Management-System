import { Router } from 'express';
import {
  listFeeStructures,
  createFeeStructure,
  listInvoices,
  getInvoiceById,
  generateInvoices,
  recordPayment,
  listPayments,
} from './fees.controller.js';
import {
  createFeeStructureSchema,
  generateInvoicesSchema,
  recordPaymentSchema,
} from './fees.schema.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

router.use(authenticateJwt);

// Structures
router.get('/structures', requireRole(['ADMIN']), listFeeStructures);
router.post('/structures', requireRole(['ADMIN']), validateRequest({ body: createFeeStructureSchema }), createFeeStructure);

// Invoices
router.get('/invoices', listInvoices); // Guardian scoped inside controller
router.get('/invoices/:id', getInvoiceById); // Guardian scoped inside controller
router.post('/invoices/generate', requireRole(['ADMIN']), validateRequest({ body: generateInvoicesSchema }), generateInvoices);

// Payments
router.post('/payments', validateRequest({ body: recordPaymentSchema }), recordPayment); // Guardian / Admin allowed
router.get('/payments', requireRole(['ADMIN']), listPayments);

export default router;
