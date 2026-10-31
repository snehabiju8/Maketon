import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Alert } from '@/components/common/Alert';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/FormControls';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCustomerOptions } from '@/features/invoices/hooks/useCustomerOptions';
import { listPayments } from './api/payments.api';
import { PaymentHistoryTable } from './components/PaymentHistoryTable';
import { PAYMENT_METHOD_LABELS, type PaymentFilters, type PaymentMethod } from './types';

const PAGE_SIZE = 20;

export const PaymentsPage: React.FC = () => {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [page, setPage] = useState(1);
  const customers = useCustomerOptions();

  const query = { ...filters, page, pageSize: PAGE_SIZE };
  const { data, loading, error } = useApiQuery(() => listPayments(query), JSON.stringify(query));

  const set = (patch: Partial<PaymentFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Payment history across all invoices. Record new payments from an invoice on the Invoices page."
      />

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <Field label="Customer" htmlFor="payments-customer">
              <Select
                id="payments-customer"
                value={filters.customerId ?? ''}
                onChange={(e) => set({ customerId: e.target.value || undefined })}
              >
                <option value="">All customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Method" htmlFor="payments-method">
              <Select
                id="payments-method"
                value={filters.paymentMethod ?? ''}
                onChange={(e) => set({ paymentMethod: (e.target.value || undefined) as PaymentMethod | undefined })}
              >
                <option value="">All methods</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Paid from" htmlFor="payments-from">
              <Input
                id="payments-from"
                type="date"
                value={filters.from ?? ''}
                max={filters.to}
                onChange={(e) => set({ from: e.target.value || undefined })}
              />
            </Field>
            <Field label="Paid to" htmlFor="payments-to">
              <Input
                id="payments-to"
                type="date"
                value={filters.to ?? ''}
                min={filters.from}
                onChange={(e) => set({ to: e.target.value || undefined })}
              />
            </Field>
            <Button
              variant="ghost"
              disabled={!Object.values(filters).some(Boolean)}
              onClick={() => {
                setFilters({});
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        {error && (
          <div className="p-4">
            <Alert>{error}</Alert>
          </div>
        )}
        {loading && !data && <p className="p-6 text-sm text-slate-500">Loading payments…</p>}
        {data && !loading && data.items.length === 0 && (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">No payments found</p>
            <p className="text-xs text-slate-400 mt-1">Payments recorded against confirmed invoices appear here.</p>
          </div>
        )}
        {data && data.items.length > 0 && (
          <>
            <PaymentHistoryTable payments={data.items} showInvoice />
            <Pagination {...data.pagination} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};
