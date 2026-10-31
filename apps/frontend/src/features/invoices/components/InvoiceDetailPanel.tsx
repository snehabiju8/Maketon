import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/common/Alert';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getApiErrorMessage } from '@/lib/apiError';
import { formatCurrency, formatDate, formatPeriod } from '@/lib/format';
import { RecordPaymentForm } from '@/features/payments/components/RecordPaymentForm';
import { PaymentHistoryTable } from '@/features/payments/components/PaymentHistoryTable';
import { cancelInvoice, confirmInvoice, getInvoice } from '../api/invoices.api';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoiceDetailPanelProps {
  invoiceId: string;
  onClose: () => void;
  /** Called after any change so the list can refresh balances and statuses. */
  onChanged: () => void;
}

const Row: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex justify-between py-1 ${strong ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
    <span>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);

export const InvoiceDetailPanel: React.FC<InvoiceDetailPanelProps> = ({ invoiceId, onClose, onChanged }) => {
  const { data: invoice, loading, error, reload } = useApiQuery(() => getInvoice(invoiceId), invoiceId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = (message: string) => {
    setNotice(message);
    reload();
    onChanged();
  };

  const runAction = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await action();
      refresh(message);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const money = (value: string) => formatCurrency(value, invoice?.currency);
  const canCancel =
    invoice && (invoice.status === 'DRAFT' || invoice.status === 'CONFIRMED') && invoice.payments.length === 0;

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>{invoice ? invoice.invoiceNumber : 'Invoice'}</CardTitle>
          {invoice && (
            <CardDescription>
              {invoice.customer.name} · {invoice.subscription.subscriptionNumber} ({invoice.subscription.plan.name})
            </CardDescription>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Close invoice details"
        >
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading && !invoice && <p className="text-sm text-slate-500">Loading invoice…</p>}
        {error && <Alert>{error}</Alert>}
        {invoice && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <InvoiceStatusBadge status={invoice.status} />
              <span className="text-slate-500">
                Period {formatPeriod(invoice.periodStart, invoice.periodEnd)} · Issued {formatDate(invoice.issueDate)} · Due{' '}
                {formatDate(invoice.dueDate)}
              </span>
            </div>

            <div className="overflow-x-auto -mx-2">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="px-2 py-2">Item</th>
                    <th className="px-2 py-2 text-right">Qty</th>
                    <th className="px-2 py-2 text-right">Unit price</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-2 py-2 text-slate-800">{line.descriptionSnapshot}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{line.quantity}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{money(line.unitPrice)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{money(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-sm border-t border-slate-100 pt-3">
              <Row label="Subtotal" value={money(invoice.subtotal)} />
              <Row label={`Discount (${Number(invoice.discountPercentage)}%)`} value={`− ${money(invoice.discountAmount)}`} />
              <Row
                label={`${invoice.taxNameSnapshot ?? 'Tax'} (${Number(invoice.taxRate)}%)`}
                value={money(invoice.taxAmount)}
              />
              <Row label="Total" value={money(invoice.totalAmount)} strong />
              <Row label="Paid" value={money(invoice.paidAmount)} />
              <Row label="Outstanding" value={money(invoice.outstandingAmount)} strong />
            </div>

            {notice && <Alert variant="success">{notice}</Alert>}
            {actionError && <Alert>{actionError}</Alert>}

            {(invoice.status === 'DRAFT' || canCancel) && (
              <div className="flex flex-wrap gap-2">
                {invoice.status === 'DRAFT' && (
                  <Button onClick={() => runAction(() => confirmInvoice(invoice.id), 'Invoice confirmed.')} disabled={busy}>
                    Confirm invoice
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`Cancel ${invoice.invoiceNumber}? This cannot be undone.`)) {
                        void runAction(() => cancelInvoice(invoice.id), 'Invoice cancelled.');
                      }
                    }}
                  >
                    Cancel invoice
                  </Button>
                )}
              </div>
            )}

            {invoice.status === 'CONFIRMED' && Number(invoice.outstandingAmount) > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Record payment</h4>
                <RecordPaymentForm
                  key={invoice.paidAmount}
                  invoiceId={invoice.id}
                  outstandingAmount={invoice.outstandingAmount}
                  currency={invoice.currency}
                  onRecorded={(result) =>
                    refresh(
                      result.invoice.status === 'PAID'
                        ? 'Payment recorded. The invoice is now fully paid.'
                        : `Payment recorded. Outstanding balance: ${money(result.invoice.outstandingAmount)}.`
                    )
                  }
                />
              </div>
            )}
            {invoice.status === 'DRAFT' && (
              <p className="text-xs text-slate-500">Confirm the invoice before recording payments.</p>
            )}

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Payment history</h4>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-slate-500">No payments recorded yet.</p>
              ) : (
                <div className="-mx-4">
                  <PaymentHistoryTable payments={invoice.payments} currency={invoice.currency} />
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
