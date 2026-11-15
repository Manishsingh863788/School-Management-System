import { api } from './api';

export const feeService = {
  listStructures: async () => {
    const res: any = await api.get('/fees/structures');
    return res.data;
  },

  createStructure: async (data: any) => {
    const res: any = await api.post('/fees/structures', data);
    return res.data;
  },

  listInvoices: async (params?: any) => {
    const res: any = await api.get('/fees/invoices', { params });
    return res;
  },

  getInvoiceById: async (id: string) => {
    const res: any = await api.get(`/fees/invoices/${id}`);
    return res.data;
  },

  generateInvoices: async (data: any) => {
    const res: any = await api.post('/fees/invoices/generate', data);
    return res.data;
  },

  recordPayment: async (data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
    idempotencyKey: string;
    transactionReference?: string;
    notes?: string;
  }) => {
    const res: any = await api.post('/fees/payments', data);
    return res.data;
  },

  listPayments: async () => {
    const res: any = await api.get('/fees/payments');
    return res.data;
  },
};
