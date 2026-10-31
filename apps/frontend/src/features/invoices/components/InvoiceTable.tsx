import React from 'react';
import { formatCurrency, formatDate, formatPeriod } from '@/lib/format';
import type { Invoice } from '../types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoiceTableProps {
  invoices: Invoice[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  compact?: boolean;
}

const isOverdue = (invoice: Invoice) =>
  invoice.status === 'CONFIRMED' && Number(invoice.outstandingAmount) > 0 && new Date(invoice.dueDate) < new Date();

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, selectedId, onSelect, compact = false }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <th className="px-4 py-3">Invoice</th>
          <th className="px-4 py-3">Customer</th>
          {!compact && <th className="px-4 py-3">Period</th>}
          {!compact && <th className="px-4 py-3">Due</th>}
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3 text-right">Total</th>
          <th className="px-4 py-3 text-right">Outstanding</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {invoices.map((invoice) => {
          const selected = invoice.id === selectedId;
          return (
            <tr
              key={invoice.id}
              onClick={onSelect ? () => onSelect(invoice.id) : undefined}
              onKeyDown={onSelect ? (e) => e.key === 'Enter' && onSelect(invoice.id) : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-selected={onSelect ? selected : undefined}
              className={`${onSelect ? 'cursor-pointer hover:bg-slate-50 focus:outline-none focus:bg-indigo-50/60' : ''} ${
                selected ? 'bg-indigo-50/80' : ''
              }`}
            >
              <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{invoice.invoiceNumber}</td>
              <td className="px-4 py-3 text-slate-700">{invoice.customer.name}</td>
              {!compact && (
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                </td>
              )}
              {!compact && (
                <td className={`px-4 py-3 whitespace-nowrap ${isOverdue(invoice) ? 'text-rose-600 font-medium' : 'text-slate-600'}`}>
                  {formatDate(invoice.dueDate)}
                  {isOverdue(invoice) && <span className="ml-1 text-xs">(overdue)</span>}
                </td>
              )}
              <td className="px-4 py-3">
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                {formatCurrency(invoice.totalAmount, invoice.currency)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                {invoice.status === 'CANCELLED' ? '—' : formatCurrency(invoice.outstandingAmount, invoice.currency)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
