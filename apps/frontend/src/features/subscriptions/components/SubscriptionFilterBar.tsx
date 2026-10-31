import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SubscriptionFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onOpenCreate: () => void;
}

const statusOptions: { label: string; value: string }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Closed', value: 'CLOSED' },
];

export const SubscriptionFilterBar: React.FC<SubscriptionFilterBarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenCreate,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by subscription number or customer..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusOptions.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onStatusFilterChange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Create CTA Button */}
      <Button
        variant="primary"
        onClick={onOpenCreate}
        className="gap-2 shrink-0 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span>Create Subscription</span>
      </Button>
    </div>
  );
};
