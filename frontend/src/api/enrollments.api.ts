import api from './axios';
import { Enrollment } from '@/types';

export const enrollmentsApi = {
  getMyEnrollments: async (): Promise<Enrollment[]> => {
    const res = await api.get('/enrollments/my');
    return res.data.data;
  },

  getMyEnrollment: async (cycleId: string): Promise<Enrollment> => {
    const res = await api.get(`/enrollments/my/${cycleId}`);
    return res.data.data;
  },

  enrollInCycle: async (cycleId: string) => {
    const res = await api.post(`/enrollments/cycle/${cycleId}`);
    return res.data.data;
  },

  enrollSubject: async (cycleId: string, subjectId: string, scheduleId: string) => {
    const res = await api.post('/enrollments/subject', {
      cycleId,
      subjectId,
      scheduleId,
    });
    return res.data.data;
  },

  cancelSubject: async (id: string) => {
    const res = await api.put(`/enrollments/subject/${id}/cancel`);
    return res.data.data;
  },

  confirmEnrollment: async (cycleId: string) => {
    const res = await api.post(`/enrollments/confirm/${cycleId}`);
    return res.data.data;
  },

  getAllEnrollments: async (cycleId?: string): Promise<Enrollment[]> => {
    const params = cycleId ? { cycleId } : {};
    const res = await api.get('/enrollments/all', { params });
    return res.data.data;
  },
};
