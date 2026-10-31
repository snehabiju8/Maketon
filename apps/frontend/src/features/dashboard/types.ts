import type { InvoiceStatus } from '@/features/invoices/types';

interface CountAmount {
  count: number;
  amount: string;
}

export interface DashboardSummary {
  activeSubscriptions: number;
  invoiced: CountAmount;
  paymentsReceived: CountAmount;
  outstanding: CountAmount;
  overdue: CountAmount;
  invoicesByStatus: (CountAmount & { status: InvoiceStatus })[];
  generatedAt: string;
}

export interface DashboardFilters {
  customerId?: string;
  status?: InvoiceStatus;
  from?: string;
  to?: string;
}
