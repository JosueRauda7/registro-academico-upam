import api from './axios';
import { Student } from '@/types';

export const studentsApi = {
  findAll: async (): Promise<Student[]> => {
    const res = await api.get('/students');
    return res.data.data;
  },

  findMe: async (): Promise<Student> => {
    const res = await api.get('/students/me');
    return res.data.data;
  },

  findById: async (id: string): Promise<Student> => {
    const res = await api.get(`/students/${id}`);
    return res.data.data;
  },
};
