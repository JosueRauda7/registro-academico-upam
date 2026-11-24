import api from './axios';
import { Cycle } from '@/types';

export const cyclesApi = {
  findAll: async (): Promise<Cycle[]> => {
    const res = await api.get('/cycles');
    return res.data.data;
  },

  findActive: async (): Promise<Cycle[]> => {
    const res = await api.get('/cycles/active');
    return res.data.data;
  },

  findOpenForEnrollment: async (): Promise<Cycle> => {
    const res = await api.get('/cycles/open-enrollment');
    return res.data.data;
  },

  findById: async (id: string): Promise<Cycle> => {
    const res = await api.get(`/cycles/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<Cycle>) => {
    const res = await api.post('/cycles', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Cycle>): Promise<Cycle> => {
    const res = await api.put(`/cycles/${id}`, data);
    return res.data.data;
  },

  openEnrollment: async (id: string) => {
    const res = await api.put(`/cycles/${id}/open-enrollment`);
    return res.data.data;
  },

  closeEnrollment: async (id: string) => {
    const res = await api.put(`/cycles/${id}/close-enrollment`);
    return res.data.data;
  },
};
