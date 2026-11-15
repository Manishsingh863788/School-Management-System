import { api } from './api';

export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  phone?: string;
  qualification?: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  user: { email: string; status: string };
  classesTaught?: { id: string; name: string }[];
  assignments?: {
    id: string;
    class: { id: string; name: string };
    section: { id: string; name: string };
    subject: { id: string; name: string; code: string };
  }[];
}

export const teacherService = {
  list: async (params?: { search?: string; status?: string }) => {
    const res: any = await api.get('/teachers', { params });
    return res;
  },

  getById: async (id: string): Promise<Teacher> => {
    const res: any = await api.get(`/teachers/${id}`);
    return res.data;
  },

  create: async (data: any): Promise<Teacher> => {
    const res: any = await api.post('/teachers', data);
    return res.data;
  },

  update: async (id: string, data: any): Promise<Teacher> => {
    const res: any = await api.put(`/teachers/${id}`, data);
    return res.data;
  },
};
