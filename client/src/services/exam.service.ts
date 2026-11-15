import { api } from './api';

export const examService = {
  listExams: async () => {
    const res: any = await api.get('/examinations');
    return res.data;
  },

  getExamById: async (id: string) => {
    const res: any = await api.get(`/examinations/${id}`);
    return res.data;
  },

  createExam: async (data: any) => {
    const res: any = await api.post('/examinations', data);
    return res.data;
  },

  getMarksSheet: async (examSubjectId: string) => {
    const res: any = await api.get(`/examinations/exam-subjects/${examSubjectId}/marks`);
    return res.data;
  },

  submitMarks: async (data: {
    examSubjectId: string;
    marks: { studentId: string; marksObtained: number; isAbsent?: boolean; remarks?: string }[];
  }) => {
    const res: any = await api.post('/examinations/marks', data);
    return res.data;
  },

  getReportCard: async (studentId: string, examId: string) => {
    const res: any = await api.get(`/examinations/report-cards/${studentId}/exam/${examId}`);
    return res.data;
  },

  downloadReportCardPdfUrl: (studentId: string, examId: string) => {
    const token = localStorage.getItem('edumanage_token');
    return `/api/examinations/report-cards/${studentId}/exam/${examId}/pdf?token=${token}`;
  },

  listGradeRules: async () => {
    const res: any = await api.get('/examinations/grade-rules');
    return res.data;
  },
};
