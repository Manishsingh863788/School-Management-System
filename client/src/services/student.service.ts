import { api } from './api';

export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  email?: string;
  phone?: string;
  address?: string;
  admissionDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  classId: string;
  sectionId: string;
  class: { id: string; name: string };
  section: { id: string; name: string };
  guardians?: any[];
  attendance?: any[];
  examResults?: any[];
  invoices?: any[];
  summary?: any;
}

export const studentService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    classId?: string;
    sectionId?: string;
    status?: string;
  }) => {
    const res: any = await api.get('/students', { params });
    return res;
  },

  getById: async (id: string): Promise<Student> => {
    const res: any = await api.get(`/students/${id}`);
    return res.data;
  },

  create: async (data: any): Promise<Student> => {
    const res: any = await api.post('/students', data);
    return res.data;
  },

  update: async (id: string, data: any): Promise<Student> => {
    const res: any = await api.put(`/students/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },
};
