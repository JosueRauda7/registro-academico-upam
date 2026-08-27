import api from './axios';
import { Teacher } from '@/types';

export interface TeacherInput {
  name: string;
  email?: string;
  phone?: string;
  department?: string;
}

export const teachersApi = {
  findAll: async (activeOnly = false): Promise<Teacher[]> => {
    const res = await api.get('/teachers', { params: { activeOnly } });
    return res.data.data;
  },

  findById: async (id: string): Promise<Teacher> => {
    const res = await api.get(`/teachers/${id}`);
    return res.data.data;
  },

  create: async (data: TeacherInput): Promise<Teacher> => {
    const res = await api.post('/teachers', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<TeacherInput>): Promise<Teacher> => {
    const res = await api.put(`/teachers/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string) => {
    const res = await api.delete(`/teachers/${id}`);
    return res.data.data;
  },
};