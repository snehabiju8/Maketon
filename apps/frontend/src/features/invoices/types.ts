import type { Payment } from '@/features/payments/types';

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';

export const INVOICE_STATUSES: InvoiceStatus[] = ['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED'];

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  discountPercentage: string;
  discountAmount: string;
  taxNameSnapshot: string | null;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  customer: { id: string; name: string };
  subscription: { id: string; subscriptionNumber: string };
}

export interface InvoiceLine {
  id: string;
  descriptionSnapshot: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface InvoiceDetail extends Omit<Invoice, 'customer' | 'subscription'> {
  customer: { id: string; name: string; email: string; billingAddress: string | null };
  subscription: { id: string; subscriptionNumber: string; plan: { id: string; name: string } };
  lines: InvoiceLine[];
  payments: Payment[];
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  customerId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface BillingRunSummary {
  subscriptionsProcessed: number;
  totalProcessed: number;
  created: number;
  skipped: number;
  failed: number;
  failures: { subscriptionId: string; reason: string }[];
}
