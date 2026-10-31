import React from 'react';
import { Field, Input, Select } from '@/components/ui/FormControls';
import { Button } from '@/components/ui/Button';
import { INVOICE_STATUSES, type InvoiceStatus } from '../types';
import { invoiceStatusLabel } from './InvoiceStatusBadge';

export interface InvoiceFilterValues {
  status?: InvoiceStatus;
  customerId?: string;
  from?: string;
  to?: string;
}

interface InvoiceFiltersBarProps {
  value: InvoiceFilterValues;
  onChange: (value: InvoiceFilterValues) => void;
  customers: { id: string; name: string }[];
  idPrefix: string;
}

/** Status, customer and issue-date filters shared by the invoice list and dashboard. */
export const InvoiceFiltersBar: React.FC<InvoiceFiltersBarProps> = ({ value, onChange, customers, idPrefix }) => {
  const set = (patch: Partial<InvoiceFilterValues>) => onChange({ ...value, ...patch });
  const hasFilters = Boolean(value.status || value.customerId || value.from || value.to);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      <Field label="Status" htmlFor={`${idPrefix}-status`}>
        <Select
          id={`${idPrefix}-status`}
          value={value.status ?? ''}
          onChange={(e) => set({ status: (e.target.value || undefined) as InvoiceStatus | undefined })}
        >
          <option value="">All statuses</option>
          {INVOICE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {invoiceStatusLabel(status)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Customer" htmlFor={`${idPrefix}-customer`}>
        <Select
          id={`${idPrefix}-customer`}
          value={value.customerId ?? ''}
          onChange={(e) => set({ customerId: e.target.value || undefined })}
        >
          <option value="">All customers</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Issued from" htmlFor={`${idPrefix}-from`}>
        <Input
          id={`${idPrefix}-from`}
          type="date"
          value={value.from ?? ''}
          max={value.to}
          onChange={(e) => set({ from: e.target.value || undefined })}
        />
      </Field>
      <Field label="Issued to" htmlFor={`${idPrefix}-to`}>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          value={value.to ?? ''}
          min={value.from}
          onChange={(e) => set({ to: e.target.value || undefined })}
        />
      </Field>
      <Button variant="ghost" onClick={() => onChange({})} disabled={!hasFilters}>
        Clear filters
      </Button>
    </div>
  );
};
