import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PlaceholderState } from '@/components/common/PlaceholderState';
import { FileText } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Management"
        description="Inspect generated invoices, trigger billing runs, review invoice line items, taxes, and status."
      />
      <PlaceholderState
        title="Invoice Management"
        description="This page is under development. Admins will trigger billing runs, view generated invoices, confirm draft invoices, and verify taxes and discounts."
        icon={FileText}
        moduleName="Invoices"
      />
    </div>
  );
};

