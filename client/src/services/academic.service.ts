import { api } from './api';

export const academicService = {
  listYears: async () => {
    const res: any = await api.get('/academics/academic-years');
    return res.data;
  },

  createYear: async (data: any) => {
    const res: any = await api.post('/academics/academic-years', data);
    return res.data;
  },

  listClasses: async () => {
    const res: any = await api.get('/academics/classes');
    return res.data;
  },

  createClass: async (data: any) => {
    const res: any = await api.post('/academics/classes', data);
    return res.data;
  },

  listSections: async (classId?: string) => {
    const res: any = await api.get('/academics/sections', { params: { classId } });
    return res.data;
  },

  createSection: async (data: any) => {
    const res: any = await api.post('/academics/sections', data);
    return res.data;
  },

  listSubjects: async () => {
    const res: any = await api.get('/academics/subjects');
    return res.data;
  },

  createSubject: async (data: any) => {
    const res: any = await api.post('/academics/subjects', data);
    return res.data;
  },

  listAssignments: async (params?: any) => {
    const res: any = await api.get('/academics/assignments', { params });
    return res.data;
  },

  createAssignment: async (data: any) => {
    const res: any = await api.post('/academics/assignments', data);
    return res.data;
  },
};
