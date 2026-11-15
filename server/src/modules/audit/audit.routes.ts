import { Router } from 'express';
import { listAuditLogs } from './audit.controller.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requireRole(['ADMIN']), listAuditLogs);

export default router;
