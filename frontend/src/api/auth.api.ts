import api from './axios';
import { AuthResponse, LoginData, RegisterData } from '@/types';

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', data);
    return res.data.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await api.post('/auth/reset-password', { token, newPassword });
    return res.data.data;
  },

  changePassword: async () => {
    const res = await api.post('/auth/change-password');
    return res.data.data;
  },

  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data.data;
  },
};
