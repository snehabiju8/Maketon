import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FileText } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Alert } from '@/components/common/Alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useApiQuery } from '@/hooks/useApiQuery';
import { formatCurrency } from '@/lib/format';
import { listInvoices } from '@/features/invoices/api/invoices.api';
import { InvoiceFiltersBar, type InvoiceFilterValues } from '@/features/invoices/components/InvoiceFiltersBar';
import { InvoiceTable } from '@/features/invoices/components/InvoiceTable';
import { InvoiceStatusBadge } from '@/features/invoices/components/InvoiceStatusBadge';
import { useCustomerOptions } from '@/features/invoices/hooks/useCustomerOptions';
import { getDashboardSummary } from './api/dashboard.api';
import { SummaryCards } from './components/SummaryCards';

export const DashboardPage: React.FC = () => {
  const [filters, setFilters] = useState<InvoiceFilterValues>({});
  const customers = useCustomerOptions();
  const key = JSON.stringify(filters);

  const summary = useApiQuery(() => getDashboardSummary(filters), key);
  const recent = useApiQuery(() => listInvoices({ ...filters, pageSize: 5 }), key);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description="Subscription, invoicing and collection figures. Invoiced and received amounts follow the date range; outstanding and overdue are current balances."
      />

      <Card>
        <CardContent className="p-4">
          <InvoiceFiltersBar value={filters} onChange={setFilters} customers={customers} idPrefix="dashboard" />
        </CardContent>
      </Card>

      {summary.error && <Alert>{summary.error}</Alert>}
      <SummaryCards summary={summary.data} loading={summary.loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest invoices matching the filters</CardDescription>
            </div>
            <Link to="/invoices" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </CardHeader>
          {recent.error && (
            <div className="p-4">
              <Alert>{recent.error}</Alert>
            </div>
          )}
          {recent.data && recent.data.items.length > 0 ? (
            <InvoiceTable invoices={recent.data.items} compact />
          ) : (
            !recent.error && (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {recent.loading ? 'Loading invoices…' : 'No invoices yet'}
                </p>
              </div>
            )
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices by Status</CardTitle>
            <CardDescription>Issued in the selected range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.data?.invoicesByStatus.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-2">
                  <InvoiceStatusBadge status={row.status} />
                  <span className="text-xs text-slate-500">{row.count}</span>
                </div>
                <span className="text-sm font-semibold text-slate-800 tabular-nums">{formatCurrency(row.amount)}</span>
              </div>
            )) ?? <div className="h-40 bg-slate-50 rounded-lg animate-pulse" />}
          </CardContent>
        </Card>
      </div>

      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950">
          <span className="font-semibold">Core Hackathon Workflow: </span>
          Customer &rarr; Subscription &rarr; Billing Run &rarr; Invoice Generation &rarr; Payment Recording &rarr; Outstanding Balance Update.
        </div>
      </div>
    </div>
  );
};
