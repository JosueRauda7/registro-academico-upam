import api from './axios';
import { uploadsApi } from './uploads.api';
import { Payment, PaymentSummary } from '@/types';

export const paymentsApi = {
  createTuitionPayment: async (cycleId: string) => {
    const res = await api.post(`/payments/tuition/${cycleId}`);
    return res.data.data;
  },

  createMonthlyPayment: async (cycleId: string, month: number) => {
    const res = await api.post(`/payments/monthly/${cycleId}`, { month });
    return res.data.data;
  },

  createManualPayment: async (data: {
    studentId: string;
    cycleId: string;
    amount: number;
    type: 'tuition' | 'monthly';
    month?: number;
    description?: string;
    paymentMethod?: 'cash' | 'bank';
    bankName?: string;
    bankTransactionCode?: string;
    receiptImageUrl?: string;
  }) => {
    const res = await api.post('/payments/manual', data);
    return res.data.data;
  },

  uploadReceipt: uploadsApi.uploadImage,

  openReceipt: async (url: string): Promise<void> => {
    const filename = url.split('/').pop();
    if (!filename || !/^[a-f0-9-]+\.webp$/i.test(filename)) throw new Error('Comprobante inválido');
    const response = await api.get(`/uploads/receipts/${filename}`, { responseType: 'blob' });
    const objectUrl = URL.createObjectURL(new Blob([response.data], { type: 'image/webp' }));
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `comprobante-${filename}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  },

  getMyPayments: async (): Promise<Payment[]> => {
    const res = await api.get('/payments/my');
    return res.data.data;
  },

  getMyPaymentsByCycle: async (cycleId: string): Promise<Payment[]> => {
    const res = await api.get(`/payments/my/${cycleId}`);
    return res.data.data;
  },

  getPaymentSummary: async (cycleId: string): Promise<PaymentSummary> => {
    const res = await api.get(`/payments/my/${cycleId}/summary`);
    return res.data.data;
  },

  getAllPayments: async (cycleId?: string): Promise<Payment[]> => {
    const params = cycleId ? { cycleId } : {};
    const res = await api.get('/payments/all', { params });
    return res.data.data;
  },

  getPaymentStats: async (cycleId: string) => {
    const res = await api.get(`/payments/stats/${cycleId}`);
    return res.data.data;
  },
};
