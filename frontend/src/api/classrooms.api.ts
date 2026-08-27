import api from './axios';
import { Classroom } from '@/types';

export interface ClassroomInput {
  name: string;
  building?: string;
  capacity: number;
}

export const classroomsApi = {
  findAll: async (activeOnly = false): Promise<Classroom[]> => {
    const res = await api.get('/classrooms', { params: { activeOnly } });
    return res.data.data;
  },

  findById: async (id: string): Promise<Classroom> => {
    const res = await api.get(`/classrooms/${id}`);
    return res.data.data;
  },

  create: async (data: ClassroomInput): Promise<Classroom> => {
    const res = await api.post('/classrooms', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<ClassroomInput>): Promise<Classroom> => {
    const res = await api.put(`/classrooms/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string) => {
    const res = await api.delete(`/classrooms/${id}`);
    return res.data.data;
  },
};