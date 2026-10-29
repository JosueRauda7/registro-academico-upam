import api from './axios';
import { Subject, Schedule } from '@/types';

export interface SubjectInput {
  code: string;
  name: string;
  credits: number;
  career: string;
  year: number;
  semester: number;
  isActive?: boolean;
  prerequisiteSubjectId?: string | null;
}

export const subjectsApi = {
  findAll: async (career?: string, all = false): Promise<Subject[]> => {
    const params: any = {};
    if (career) params.career = career;
    if (all) params.all = 'true';
    const res = await api.get('/subjects', { params });
    return res.data.data;
  },

  findById: async (id: string): Promise<Subject> => {
    const res = await api.get(`/subjects/${id}`);
    return res.data.data;
  },

  create: async (data: SubjectInput): Promise<Subject> => {
    const res = await api.post('/subjects', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<SubjectInput>): Promise<Subject> => {
    const res = await api.put(`/subjects/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<Subject> => {
    const res = await api.delete(`/subjects/${id}`);
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
