import api from './axios';
import { SubjectGroup } from '@/types';

export interface ScheduleInput {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface GroupInput {
  subjectId: string;
  cycleId: string;
  teacherId?: string;
  classroomId: string;
  groupNumber?: number;
  capacity?: number;
  schedules?: ScheduleInput[];
}

export const subjectGroupsApi = {
  findAll: async (cycleId?: string): Promise<SubjectGroup[]> => {
    const params = cycleId ? { cycleId } : {};
    const res = await api.get('/subject-groups', { params });
    return res.data.data;
  },

  findById: async (id: string): Promise<SubjectGroup> => {
    const res = await api.get(`/subject-groups/${id}`);
    return res.data.data;
  },

  create: async (data: GroupInput): Promise<SubjectGroup> => {
    const res = await api.post('/subject-groups', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<GroupInput>): Promise<SubjectGroup> => {
    const res = await api.put(`/subject-groups/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string) => {
    const res = await api.delete(`/subject-groups/${id}`);
    return res.data.data;
  },

  addSchedule: async (groupId: string, data: ScheduleInput) => {
    const res = await api.post(`/subject-groups/${groupId}/schedules`, data);
    return res.data.data;
  },

  removeSchedule: async (groupId: string, scheduleId: string) => {
    const res = await api.delete(`/subject-groups/${groupId}/schedules/${scheduleId}`);
    return res.data.data;
  },
};