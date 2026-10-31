import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PlaceholderState } from '@/components/common/PlaceholderState';
import { Repeat } from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Management"
        description="Monitor active subscriptions, renew dates, billing schedules, and lifecycle status changes."
      />
      <PlaceholderState
        title="Subscription Management"
        description="This page is under development. Staff will create new subscriptions, view subscriber status transitions, and track renewal periods."
        icon={Repeat}
        moduleName="Subscriptions"
      />
    </div>
  );
};

