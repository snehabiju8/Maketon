import api from '@/lib/axios';
import type { ApiResponse, Paginated } from '@/types';
import type { Payment, PaymentFilters, RecordPaymentInput, RecordPaymentResult } from '../types';

export const listPayments = async (filters: PaymentFilters = {}): Promise<Paginated<Payment>> => {
  const res = await api.get<ApiResponse<Paginated<Payment>>>('/v1/payments', { params: filters });
  return res.data.data;
};

export const recordPayment = async (
  invoiceId: string,
  input: RecordPaymentInput
): Promise<RecordPaymentResult> => {
  const res = await api.post<ApiResponse<RecordPaymentResult>>(`/v1/invoices/${invoiceId}/payments`, input);
  return res.data.data;
};
