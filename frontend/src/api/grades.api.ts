import api from './axios';
import { MyGrades, TeacherGroup, GroupRoster } from '@/types';

export const gradesApi = {
  getMy: async (): Promise<MyGrades> => {
    const res = await api.get('/grades/my');
    return res.data.data;
  },

  getTeacherGroups: async (): Promise<TeacherGroup[]> => {
    const res = await api.get('/grades/teacher/groups');
    return res.data.data;
  },

  getGroupRoster: async (groupId: string): Promise<GroupRoster> => {
    const res = await api.get(`/grades/teacher/groups/${groupId}`);
    return res.data.data;
  },

  saveGrades: async (
    groupId: string,
    grades: { enrollmentSubjectId: string; score: number }[],
  ) => {
    const res = await api.put(`/grades/teacher/groups/${groupId}`, { grades });
    return res.data.data;
  },

  exportGroup: async (groupId: string) => {
    const res = await api.get(`/grades/teacher/groups/${groupId}/export`, {
      responseType: 'blob',
    });
    return res.data;
  },
};