import { api } from './api';

export const reportService = {
  getDashboardStats: async () => {
    const res: any = await api.get('/reports/dashboard');
    return res.data;
  },

  exportCsvUrl: (type: 'students' | 'fees' | 'attendance') => {
    return `/api/reports/export/${type}`;
  },
};
