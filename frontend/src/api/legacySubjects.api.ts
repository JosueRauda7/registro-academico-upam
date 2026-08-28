import api from './axios';
import { LegacyCompletedSubject, LegacySubjectInput } from '@/types';

export const legacySubjectsApi = {
  findAll: async (studentId?: string): Promise<LegacyCompletedSubject[]> => {
    const res = await api.get('/legacy-subjects', { params: studentId ? { studentId } : {} });
    return res.data.data;
  },

  register: async (data: LegacySubjectInput): Promise<LegacyCompletedSubject> => {
    const res = await api.post('/legacy-subjects', data);
    return res.data.data;
  },

  update: async (
    id: string,
    data: Partial<Omit<LegacySubjectInput, 'studentId' | 'subjectId'>>,
  ): Promise<LegacyCompletedSubject> => {
    const res = await api.put(`/legacy-subjects/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/legacy-subjects/${id}`);
  },
};
