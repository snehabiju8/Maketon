import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PlaceholderState } from '@/components/common/PlaceholderState';
import { CreditCard } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Management"
        description="Record customer payments, allocate partial payments, and track outstanding invoice balances."
      />
      <PlaceholderState
        title="Payment Management"
        description="This page is under development. Operators will record offline and manual payments, view payment receipts, and balance calculations."
        icon={CreditCard}
        moduleName="Payments"
      />
    </div>
  );
};

