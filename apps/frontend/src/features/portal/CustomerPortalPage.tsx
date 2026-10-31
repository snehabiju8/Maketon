import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PlaceholderState } from '@/components/common/PlaceholderState';
import { UserCheck } from 'lucide-react';

export const CustomerPortalPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Self-Service Portal"
        description="Dedicated portal view for authenticated customers to view their subscriptions, invoices, and payment receipts."
      />
      <PlaceholderState
        title="Customer Portal"
        description="This page is under development. Authenticated customers will be restricted to viewing only their own subscriptions and historical invoices."
        icon={UserCheck}
        moduleName="Customer Portal"
      />
    </div>
  );
};

