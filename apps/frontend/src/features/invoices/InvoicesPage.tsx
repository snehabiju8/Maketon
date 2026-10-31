import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Alert } from '@/components/common/Alert';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent } from '@/components/ui/Card';
import { useApiQuery } from '@/hooks/useApiQuery';
import { listInvoices } from './api/invoices.api';
import { InvoiceFiltersBar, type InvoiceFilterValues } from './components/InvoiceFiltersBar';
import { InvoiceTable } from './components/InvoiceTable';
import { InvoiceDetailPanel } from './components/InvoiceDetailPanel';
import { RunBillingButton, describeBillingRun } from './components/RunBillingButton';
import { useCustomerOptions } from './hooks/useCustomerOptions';

const PAGE_SIZE = 20;

export const InvoicesPage: React.FC = () => {
  const [filters, setFilters] = useState<InvoiceFilterValues>({});
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ variant: 'success' | 'error'; text: string } | null>(null);
  const query = { ...filters, page, pageSize: PAGE_SIZE };
  const { data, loading, error, reload } = useApiQuery(() => listInvoices(query), JSON.stringify(query));
  // Refresh customer options when a billing run changes the invoice count
  const customers = useCustomerOptions(String(data?.pagination.total ?? ''));

  const changeFilters = (next: InvoiceFilterValues) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Run billing for due subscriptions, review invoices, confirm or cancel them, and record payments."
        action={
          <RunBillingButton
            onCompleted={(summary) => {
              setBanner({ variant: summary.failed ? 'error' : 'success', text: describeBillingRun(summary) });
              reload();
            }}
            onError={(text) => setBanner({ variant: 'error', text })}
          />
        }
      />

      {banner && <Alert variant={banner.variant}>{banner.text}</Alert>}

      <Card>
        <CardContent className="p-4">
          <InvoiceFiltersBar value={filters} onChange={changeFilters} customers={customers} idPrefix="invoices" />
        </CardContent>
      </Card>

      <div className={`grid gap-6 ${selectedId ? 'xl:grid-cols-5' : ''}`}>
        <Card className={`min-w-0 ${selectedId ? 'xl:col-span-3' : ''}`}>
          {error && (
            <div className="p-4">
              <Alert>{error}</Alert>
            </div>
          )}
          {loading && !data && <p className="p-6 text-sm text-slate-500">Loading invoices…</p>}
          {data && !loading && data.items.length === 0 && (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">No invoices found</p>
              <p className="text-xs text-slate-400 mt-1">
                {Object.values(filters).some(Boolean)
                  ? 'Try clearing the filters.'
                  : 'Run billing to generate invoices for due subscriptions.'}
              </p>
            </div>
          )}
          {data && data.items.length > 0 && (
            <>
              <InvoiceTable
                invoices={data.items}
                selectedId={selectedId}
                onSelect={setSelectedId}
                compact={Boolean(selectedId)}
              />
              <Pagination {...data.pagination} onPageChange={setPage} />
            </>
          )}
        </Card>

        {selectedId && (
          <div className="min-w-0 xl:col-span-2">
            <InvoiceDetailPanel
              key={selectedId}
              invoiceId={selectedId}
              onClose={() => setSelectedId(null)}
              onChanged={reload}
            />
          </div>
        )}
      </div>
    </div>
  );
};
