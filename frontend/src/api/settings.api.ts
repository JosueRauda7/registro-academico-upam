import api from './axios';
import { SystemSettings } from '@/types';

export const settingsApi = {
  getPublic: async (): Promise<SystemSettings> => {
    const res = await api.get('/settings/public');
    return res.data.data;
  },

  getAdmin: async (): Promise<SystemSettings> => {
    const res = await api.get('/settings');
    return res.data.data;
  },

  update: async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
    const res = await api.put('/settings', data);
    return res.data.data;
  },
};