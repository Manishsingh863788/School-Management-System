import { api } from './api';

export interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

export const attendanceService = {
  submit: async (data: {
    classId: string;
    sectionId: string;
    date: string;
    session: 'MORNING' | 'AFTERNOON';
    records: AttendanceRecord[];
  }) => {
    const res: any = await api.post('/attendance', data);
    return res.data;
  },

  query: async (params?: any) => {
    const res: any = await api.get('/attendance', { params });
    return res.data;
  },

  getForStudent: async (studentId: string) => {
    const res: any = await api.get(`/attendance/student/${studentId}`);
    return res.data;
  },
};
