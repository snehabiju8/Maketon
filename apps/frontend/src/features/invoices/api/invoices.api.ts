import api from '@/lib/axios';
import type { ApiResponse, Paginated } from '@/types';
import type { BillingRunSummary, Invoice, InvoiceDetail, InvoiceFilters } from '../types';

export const listInvoices = async (filters: InvoiceFilters = {}): Promise<Paginated<Invoice>> => {
  const res = await api.get<ApiResponse<Paginated<Invoice>>>('/v1/invoices', { params: filters });
  return res.data.data;
};

export const getInvoice = async (id: string): Promise<InvoiceDetail> => {
  const res = await api.get<ApiResponse<InvoiceDetail>>(`/v1/invoices/${id}`);
  return res.data.data;
};

export const runBilling = async (): Promise<BillingRunSummary> => {
  const res = await api.post<ApiResponse<BillingRunSummary>>('/v1/invoices/run-billing');
  return res.data.data;
};

export const confirmInvoice = async (id: string): Promise<InvoiceDetail> => {
  const res = await api.post<ApiResponse<InvoiceDetail>>(`/v1/invoices/${id}/confirm`);
  return res.data.data;
};

export const cancelInvoice = async (id: string): Promise<InvoiceDetail> => {
  const res = await api.post<ApiResponse<InvoiceDetail>>(`/v1/invoices/${id}/cancel`);
  return res.data.data;
};
