import { Router } from 'express';
import {
  listExaminations,
  getExaminationById,
  createExamination,
  getMarksForExamSubject,
  submitMarks,
  getStudentReportCard,
  downloadReportCardPdf,
  listGradeRules,
} from './examinations.controller.js';
import {
  createExamSchema,
  submitMarksSchema,
} from './examinations.schema.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { requireRole, verifyGuardianStudentAccess } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', listExaminations);
router.get('/grade-rules', listGradeRules);
router.get('/:id', getExaminationById);
router.post('/', requireRole(['ADMIN']), validateRequest({ body: createExamSchema }), createExamination);

router.get('/exam-subjects/:examSubjectId/marks', requireRole(['ADMIN', 'TEACHER']), getMarksForExamSubject);
router.post('/marks', requireRole(['ADMIN', 'TEACHER']), validateRequest({ body: submitMarksSchema }), submitMarks);

router.get('/report-cards/:studentId/exam/:examId', verifyGuardianStudentAccess, getStudentReportCard);
router.get('/report-cards/:studentId/exam/:examId/pdf', verifyGuardianStudentAccess, downloadReportCardPdf);

export default router;
