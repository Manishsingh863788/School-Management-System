import { Router } from 'express';
import {
  listAcademicYears,
  createAcademicYear,
  listClasses,
  createClass,
  listSections,
  createSection,
  listSubjects,
  createSubject,
  listAssignments,
  createAssignment,
} from './academics.controller.js';
import {
  createAcademicYearSchema,
  createClassSchema,
  createSectionSchema,
  createSubjectSchema,
  createAssignmentSchema,
} from './academics.schema.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

router.use(authenticateJwt);

// Academic Years
router.get('/academic-years', listAcademicYears);
router.post('/academic-years', requireRole(['ADMIN']), validateRequest({ body: createAcademicYearSchema }), createAcademicYear);

// Classes
router.get('/classes', listClasses);
router.post('/classes', requireRole(['ADMIN']), validateRequest({ body: createClassSchema }), createClass);

// Sections
router.get('/sections', listSections);
router.post('/sections', requireRole(['ADMIN']), validateRequest({ body: createSectionSchema }), createSection);

// Subjects
router.get('/subjects', listSubjects);
router.post('/subjects', requireRole(['ADMIN']), validateRequest({ body: createSubjectSchema }), createSubject);

// Assignments
router.get('/assignments', listAssignments);
router.post('/assignments', requireRole(['ADMIN']), validateRequest({ body: createAssignmentSchema }), createAssignment);

export default router;
