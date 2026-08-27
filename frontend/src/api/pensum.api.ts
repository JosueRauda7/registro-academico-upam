import api from './axios';
import { Pensum } from '@/types';

export const pensumApi = {
  get: async (career?: string): Promise<Pensum> => {
    const params = career ? { career } : {};
    const res = await api.get('/pensum', { params });
    return res.data.data;
  },
};