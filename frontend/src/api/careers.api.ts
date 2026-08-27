import api from './axios';
import { Career, CareerInput } from '@/types';

export const careersApi = {
  findAll: async (all = false): Promise<Career[]> => {
    const params = all ? { all: 'true' } : {};
    const res = await api.get('/careers', { params });
    return res.data.data;
  },

  findById: async (id: string): Promise<Career> => {
    const res = await api.get(`/careers/${id}`);
    return res.data.data;
  },

  create: async (data: CareerInput): Promise<Career> => {
    const res = await api.post('/careers', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<CareerInput>): Promise<Career> => {
    const res = await api.put(`/careers/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<Career> => {
    const res = await api.delete(`/careers/${id}`);
    return res.data.data;
  },

  reactivate: async (id: string): Promise<Career> => {
    const res = await api.put(`/careers/${id}/reactivate`);
    return res.data.data;
  },
};