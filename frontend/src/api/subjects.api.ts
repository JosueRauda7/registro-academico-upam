import api from './axios';
import { Subject, Schedule } from '@/types';

export const subjectsApi = {
  findAll: async (career?: string): Promise<Subject[]> => {
    const params = career ? { career } : {};
    const res = await api.get('/subjects', { params });
    return res.data.data;
  },

  findById: async (id: string): Promise<Subject> => {
    const res = await api.get(`/subjects/${id}`);
    return res.data.data;
  },

  findSchedules: async (subjectId: string, cycleId: string): Promise<Schedule[]> => {
    const res = await api.get(`/subjects/${subjectId}/schedules`, {
      params: { cycleId },
    });
    return res.data.data;
  },

  getPrerequisites: async (subjectId: string): Promise<Subject[]> => {
    const res = await api.get(`/subjects/${subjectId}/prerequisites`);
    return res.data.data;
  },

  findSchedulesByCycle: async (cycleId: string): Promise<Schedule[]> => {
    const res = await api.get(`/subjects/schedules/cycle/${cycleId}`);
    return res.data.data;
  },
};
