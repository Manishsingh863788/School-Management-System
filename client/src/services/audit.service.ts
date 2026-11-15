import { api } from './api';

export const auditService = {
  listLogs: async (params?: { page?: number; limit?: number; action?: string; entityType?: string }) => {
    const res: any = await api.get('/audit-logs', { params });
    return res;
  },
};
