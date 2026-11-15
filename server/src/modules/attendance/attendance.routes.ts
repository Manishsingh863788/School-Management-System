import { Router } from 'express';
import {
  recordAttendance,
  getAttendance,
  getStudentAttendance,
} from './attendance.controller.js';
import { submitAttendanceSchema } from './attendance.schema.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { requireRole, verifyGuardianStudentAccess } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

router.use(authenticateJwt);

router.post(
  '/',
  requireRole(['ADMIN', 'TEACHER']),
  validateRequest({ body: submitAttendanceSchema }),
  recordAttendance
);

router.get('/', requireRole(['ADMIN', 'TEACHER']), getAttendance);

router.get('/student/:studentId', verifyGuardianStudentAccess, getStudentAttendance);

export default router;
