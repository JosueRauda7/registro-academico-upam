import api from './axios';

export const reportsApi = {
  downloadStudentPayments: async (studentId: string, cycleId?: string) => {
    const params = new URLSearchParams();
    if (cycleId) params.append('cycleId', cycleId);
    params.append('format', 'xlsx');

    const res = await api.get(`/reports/student-payments/${studentId}?${params}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  downloadEnrollmentReport: async (cycleId: string) => {
    const res = await api.get(`/reports/enrollments/${cycleId}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  downloadCollectionReport: async (cycleId: string) => {
    const res = await api.get(`/reports/collection/${cycleId}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  downloadStudentList: async (cycleId: string) => {
    const res = await api.get(`/reports/student-list/${cycleId}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  downloadPaymentReceipt: async (paymentId: string) => {
    const res = await api.get(`/reports/payment-receipt/${paymentId}`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
