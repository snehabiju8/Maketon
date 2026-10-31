import React from 'react';
import {
  Calendar,
  Layers,
  Repeat,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Subscription } from '../types';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';

interface SubscriptionListTableProps {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectSubscription: (sub: Subscription) => void;
  onOpenCreate: () => void;
}

export const SubscriptionListTable: React.FC<SubscriptionListTableProps> = ({
  subscriptions,
  loading,
  error,
  onRetry,
  onSelectSubscription,
  onOpenCreate,
}) => {
  // Format Date Helper
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Format Currency Helper
  const formatCurrency = (amount: string | number, currency = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // 1. Loading State
  if (loading) {
    return (
      <Card className="p-8 text-center bg-white">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-700">Loading subscriptions...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving subscription records and pricing snapshots</p>
        </div>
      </Card>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <Card className="p-8 text-center bg-white border-red-200">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Failed to load subscriptions</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">{error}</p>
          <Button variant="outline" onClick={onRetry} className="mt-4 gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </Card>
    );
  }

  // 3. Empty State
  if (subscriptions.length === 0) {
    return (
      <Card className="p-8 text-center bg-white border-dashed border-2">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No subscriptions found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            There are currently no subscriptions matching your filter criteria. Create a subscription to begin.
          </p>
          <Button variant="primary" onClick={onOpenCreate} className="mt-5 gap-2">
            <Plus className="w-4 h-4" />
            <span>Create First Subscription</span>
          </Button>
        </div>
      </Card>
    );
  }

  // 4. Data Table
  return (
    <Card className="overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Subscription #
              </th>
              <th scope="col" className="px-6 py-3.5">
                Customer
              </th>
              <th scope="col" className="px-6 py-3.5">
                Plan & Interval
              </th>
              <th scope="col" className="px-6 py-3.5">
                Next Billing Date
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Recurring Total
              </th>
              <th scope="col" className="px-6 py-3.5 text-center">
                Status
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscriptions.map((sub) => (
              <tr
                key={sub.id}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => onSelectSubscription(sub)}
              >
                {/* Subscription Number */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {sub.subscriptionNumber}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {sub.itemCount} line item{sub.itemCount !== 1 ? 's' : ''}
                  </div>
                </td>

                {/* Customer */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-slate-800">{sub.customer.name}</div>
                  <div className="text-xs text-slate-400">{sub.customer.email}</div>
                </td>

                {/* Plan & Interval */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">{sub.plan.name}</div>
                      <div className="text-xs text-slate-400 capitalize">
                        Every {sub.plan.intervalCount > 1 ? `${sub.plan.intervalCount} ` : ''}
                        {sub.plan.billingInterval.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Next Billing Date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(sub.nextBillingDate)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Started: {formatDate(sub.startDate)}
                  </div>
                </td>

                {/* Recurring Amount */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="font-bold text-slate-900">
                    {formatCurrency(sub.pricing.recurringTotal, sub.currency)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Subtotal: {formatCurrency(sub.pricing.subtotal, sub.currency)}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <SubscriptionStatusBadge status={sub.status} />
                </td>

                {/* Action */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSubscription(sub);
                    }}
                    className="group-hover:bg-indigo-50 group-hover:text-indigo-600 gap-1 text-xs"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

