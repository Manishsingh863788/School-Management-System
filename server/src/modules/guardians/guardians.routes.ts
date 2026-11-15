import { Router } from 'express';
import {
  listGuardians,
  getGuardianById,
  createGuardian,
  updateGuardian,
  linkStudentToGuardian,
} from './guardians.controller.js';
import {
  createGuardianSchema,
  updateGuardianSchema,
  linkStudentSchema,
} from './guardians.schema.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requireRole(['ADMIN']), listGuardians);
router.get('/:id', getGuardianById); // Controller enforces role/id match
router.post('/', requireRole(['ADMIN']), validateRequest({ body: createGuardianSchema }), createGuardian);
router.put('/:id', requireRole(['ADMIN']), validateRequest({ body: updateGuardianSchema }), updateGuardian);
router.post('/link-student', requireRole(['ADMIN']), validateRequest({ body: linkStudentSchema }), linkStudentToGuardian);

export default router;
