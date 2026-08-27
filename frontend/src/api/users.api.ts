import api from './axios';
import { User, CreateUserData, UpdateUserData, UserRole } from '@/types';

export const usersApi = {
  findAll: async (role?: UserRole): Promise<User[]> => {
    const params = role ? { role } : {};
    const res = await api.get('/users', { params });
    return res.data.data;
  },

  findById: async (id: string): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },

  create: async (data: CreateUserData): Promise<User> => {
    const res = await api.post('/users', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateUserData): Promise<User> => {
    const res = await api.put(`/users/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<User> => {
    const res = await api.delete(`/users/${id}`);
    return res.data.data;
  },
};