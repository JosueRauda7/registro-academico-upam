import api from './axios';

export const uploadsApi = {
  uploadImage: async (file: File, kind: 'receipts' | 'logos' = 'receipts'): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(kind === 'logos' ? '/uploads/logos' : '/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
