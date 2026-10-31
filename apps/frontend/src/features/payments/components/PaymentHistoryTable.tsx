import React from 'react';
import { formatCurrency, formatDate } from '@/lib/format';
import { PAYMENT_METHOD_LABELS, type Payment } from '../types';

interface PaymentHistoryTableProps {
  payments: Payment[];
  currency?: string;
  /** Show invoice and customer columns (for the cross-invoice payment history). */
  showInvoice?: boolean;
}

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  payments,
  currency = 'INR',
  showInvoice = false,
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <th className="px-4 py-3">Date</th>
          {showInvoice && <th className="px-4 py-3">Invoice</th>}
          {showInvoice && <th className="px-4 py-3">Customer</th>}
          <th className="px-4 py-3">Method</th>
          <th className="px-4 py-3">Reference</th>
          <th className="px-4 py-3">Recorded by</th>
          <th className="px-4 py-3 text-right">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {payments.map((payment) => (
          <tr key={payment.id}>
            <td className="px-4 py-3 whitespace-nowrap text-slate-700">{formatDate(payment.paidAt)}</td>
            {showInvoice && (
              <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                {payment.invoice?.invoiceNumber ?? '—'}
              </td>
            )}
            {showInvoice && <td className="px-4 py-3 text-slate-700">{payment.invoice?.customer.name ?? '—'}</td>}
            <td className="px-4 py-3 text-slate-700">{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</td>
            <td className="px-4 py-3 text-slate-500">{payment.reference || '—'}</td>
            <td className="px-4 py-3 text-slate-500">{payment.user?.name ?? '—'}</td>
            <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
              {formatCurrency(payment.amount, currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
