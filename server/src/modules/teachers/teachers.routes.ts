import { Router } from 'express';
import {
  listTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
} from './teachers.controller.js';
import { createTeacherSchema, updateTeacherSchema } from './teachers.schema.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requireRole(['ADMIN']), listTeachers);
router.get('/:id', getTeacherById);
router.post('/', requireRole(['ADMIN']), validateRequest({ body: createTeacherSchema }), createTeacher);
router.put('/:id', requireRole(['ADMIN']), validateRequest({ body: updateTeacherSchema }), updateTeacher);

export default router;
