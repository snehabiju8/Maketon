import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/FormControls';
import { Alert } from '@/components/common/Alert';
import { getApiErrorMessage } from '@/lib/apiError';
import { formatCurrency } from '@/lib/format';
import { recordPayment } from '../api/payments.api';
import { PAYMENT_METHOD_LABELS, type PaymentMethod, type RecordPaymentResult } from '../types';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

interface RecordPaymentFormProps {
  invoiceId: string;
  outstandingAmount: string;
  currency: string;
  onRecorded: (result: RecordPaymentResult) => void;
}

/** Manual payment entry. The backend is the authority on the balance; this only pre-checks input. */
export const RecordPaymentForm: React.FC<RecordPaymentFormProps> = ({
  invoiceId,
  outstandingAmount,
  currency,
  onRecorded,
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = amount.trim();
    if (!AMOUNT_PATTERN.test(trimmed) || Number(trimmed) <= 0) {
      setError('Enter an amount greater than zero with at most 2 decimal places.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await recordPayment(invoiceId, {
        amount: trimmed,
        paymentMethod,
        reference: reference.trim() || undefined,
        paidAt: paidAt || undefined,
      });
      setAmount('');
      setReference('');
      onRecorded(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={`Amount (outstanding ${formatCurrency(outstandingAmount, currency)})`} htmlFor="payment-amount" className="sm:col-span-2">
          <div className="flex gap-2">
            <Input
              id="payment-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Button type="button" variant="outline" size="sm" onClick={() => setAmount(outstandingAmount)}>
              Full
            </Button>
          </div>
        </Field>
        <Field label="Method" htmlFor="payment-method">
          <Select
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment date" htmlFor="payment-date">
          <Input id="payment-date" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </Field>
        <Field label="Reference (optional)" htmlFor="payment-reference" className="sm:col-span-2">
          <Input
            id="payment-reference"
            placeholder="Transaction / UTR / cheque number"
            maxLength={255}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </Field>
      </div>
      {error && <Alert>{error}</Alert>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Recording…' : 'Record payment'}
      </Button>
    </form>
  );
};
