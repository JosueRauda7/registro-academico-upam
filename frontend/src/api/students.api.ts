import api from './axios';
import { Student, CreateStudentData, UpdateStudentData } from '@/types';

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

  create: async (data: CreateStudentData): Promise<Student> => {
    const res = await api.post('/students', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateStudentData): Promise<Student> => {
    const res = await api.put(`/students/${id}`, data);
    return res.data.data;
  },
};
