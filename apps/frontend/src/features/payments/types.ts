export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'OTHER';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank transfer',
  CARD: 'Card',
  UPI: 'UPI',
  OTHER: 'Other',
};

export interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  paymentMethod: PaymentMethod;
  reference: string | null;
  paidAt: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  invoice?: { id: string; invoiceNumber: string; customer: { id: string; name: string } };
}

export interface RecordPaymentInput {
  amount: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  paidAt?: string;
}

export interface RecordPaymentResult {
  payment: Payment;
  invoice: {
    id: string;
    status: string;
    totalAmount: string;
    paidAmount: string;
    outstandingAmount: string;
  };
}

export interface PaymentFilters {
  customerId?: string;
  paymentMethod?: PaymentMethod;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
