import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PlaceholderState } from '@/components/common/PlaceholderState';
import { Users } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        description="Manage customer profiles, billing addresses, and associated contact records."
      />
      <PlaceholderState
        title="Customer Management"
        description="This page is under development. In future iterations, administrators and staff will be able to list, create, search, and manage customer records."
        icon={Users}
        moduleName="Customers"
      />
    </div>
  );
};

