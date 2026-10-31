import { useMemo } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { listInvoices } from '../api/invoices.api';

/**
 * Customers that have invoices, for filter dropdowns.
 * Stopgap until the customers module exposes a customer list endpoint.
 */
export const useCustomerOptions = (refreshKey = '') => {
  const { data } = useApiQuery(() => listInvoices({ pageSize: 100 }), `customer-options:${refreshKey}`);
  return useMemo(() => {
    const byId = new Map<string, string>();
    data?.items.forEach((invoice) => byId.set(invoice.customer.id, invoice.customer.name));
    return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);
};
