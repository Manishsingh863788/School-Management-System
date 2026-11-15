import { Router } from 'express';
import {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from './students.controller.js';
import { createStudentSchema, updateStudentSchema } from './students.schema.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { requireRole, verifyGuardianStudentAccess } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requireRole(['ADMIN', 'TEACHER']), listStudents);
router.get('/:id', verifyGuardianStudentAccess, getStudentById);
router.post('/', requireRole(['ADMIN']), validateRequest({ body: createStudentSchema }), createStudent);
router.put('/:id', requireRole(['ADMIN']), validateRequest({ body: updateStudentSchema }), updateStudent);
router.delete('/:id', requireRole(['ADMIN']), deleteStudent);

export default router;
