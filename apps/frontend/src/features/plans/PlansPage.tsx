import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PlaceholderState } from '@/components/common/PlaceholderState';
import { Layers } from 'lucide-react';

export const PlansPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Define and organize recurring billing tiers, intervals (monthly/yearly), and pricing models."
      />
      <PlaceholderState
        title="Subscription Plans"
        description="This page is under development. Plan configurations, billing cycles, and pricing tiers will be managed here once connected to the backend."
        icon={Layers}
        moduleName="Plans"
      />
    </div>
  );
};

