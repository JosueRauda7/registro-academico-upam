import api from './axios';
import { LegacyCompletedSubject, LegacySubjectInput } from '@/types';

export const legacySubjectsApi = {
  template: async (): Promise<Blob> => {
    const response = await api.get('/legacy-subjects/template', { responseType: 'blob' });
    return response.data;
  },

  importFile: async (file: File): Promise<{ imported: number; students: number }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/legacy-subjects/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

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
