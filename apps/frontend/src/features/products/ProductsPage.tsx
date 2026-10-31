import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PlaceholderState } from '@/components/common/PlaceholderState';
import { Package } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Management"
        description="Configure product catalog, product variants, and tax categories."
      />
      <PlaceholderState
        title="Product Management"
        description="This page is under development. Product catalog administration and variant configurations will be integrated with the product backend endpoints."
        icon={Package}
        moduleName="Products"
      />
    </div>
  );
};

