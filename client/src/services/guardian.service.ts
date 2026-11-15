import { api } from './api';

export interface Guardian {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  address?: string;
  occupation?: string;
  user: { email: string; status: string };
  studentLinks?: {
    id: string;
    relationship: string;
    isPrimary: boolean;
    student: {
      id: string;
      fullName: string;
      admissionNumber: string;
      class: { name: string };
      section: { name: string };
    };
  }[];
}

export const guardianService = {
  list: async (params?: { search?: string }) => {
    const res: any = await api.get('/guardians', { params });
    return res;
  },

  getById: async (id: string): Promise<Guardian> => {
    const res: any = await api.get(`/guardians/${id}`);
    return res.data;
  },

  create: async (data: any): Promise<Guardian> => {
    const res: any = await api.post('/guardians', data);
    return res.data;
  },

  linkStudent: async (data: {
    studentId: string;
    guardianId: string;
    relationship: 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN' | 'OTHER';
    isPrimary?: boolean;
  }) => {
    const res: any = await api.post('/guardians/link-student', data);
    return res.data;
  },
};
