import { Router } from 'express';
import { getDashboardStats, exportReportCsv } from './reports.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticateJwt);

router.get('/dashboard', requireRole(['ADMIN']), getDashboardStats);
router.get('/export/:type', requireRole(['ADMIN']), exportReportCsv);

export default router;
