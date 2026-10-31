import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Play,
  XCircle,
  Layers,
  User,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Subscription } from '../types';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';

interface SubscriptionDetailsModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onCloseSubscription: (id: string, reason?: string) => Promise<void>;
}

export const SubscriptionDetailsModal: React.FC<SubscriptionDetailsModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onConfirm,
  onActivate,
  onCloseSubscription,
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [closeReasonModal, setCloseReasonModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  if (!isOpen || !subscription) return null;

  // Format Date Helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Format Currency
  const formatCurrency = (amount: string | number) => {
    return `₹${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Action handlers
  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await onConfirm(subscription.id);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to confirm');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await onActivate(subscription.id);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to activate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await onCloseSubscription(subscription.id, closeReason || undefined);
      setCloseReasonModal(false);
      setCloseReason('');
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to close');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {subscription.subscriptionNumber}
            </h2>
            <SubscriptionStatusBadge status={subscription.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>
              Lifecycle Stage: <strong className="text-slate-800">{subscription.status}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {subscription.status === 'DRAFT' && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirm Subscription</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCloseReasonModal(true)}
                  disabled={actionLoading}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Draft</span>
                </Button>
              </>
            )}

            {subscription.status === 'CONFIRMED' && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleActivate}
                  disabled={actionLoading}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Activate for Billing</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCloseReasonModal(true)}
                  disabled={actionLoading}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Close</span>
                </Button>
              </>
            )}

            {subscription.status === 'ACTIVE' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCloseReasonModal(true)}
                disabled={actionLoading}
                className="text-red-600 hover:bg-red-50 border-red-200 gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Close Subscription</span>
              </Button>
            )}

            {subscription.status === 'CLOSED' && (
              <span className="text-xs font-medium text-slate-400 italic">
                Subscription is terminated and will not generate recurring invoices.
              </span>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Customer & Plan Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <User className="w-3.5 h-3.5" />
                <span>Customer Information</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{subscription.customer.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{subscription.customer.email}</p>
              {subscription.customer.phone && (
                <p className="text-xs text-slate-500 mt-0.5">{subscription.customer.phone}</p>
              )}
              {subscription.customer.billingAddress && (
                <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/60 leading-relaxed">
                  {subscription.customer.billingAddress}
                </p>
              )}
            </div>

            {/* Plan & Billing Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Layers className="w-3.5 h-3.5" />
                <span>Billing Schedule</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{subscription.plan.name}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400">Interval:</span>
                  <p className="font-medium text-slate-800 capitalize">
                    Every {subscription.plan.intervalCount > 1 ? `${subscription.plan.intervalCount} ` : ''}
                    {subscription.plan.billingInterval.toLowerCase()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Payment Terms:</span>
                  <p className="font-medium text-slate-800">{subscription.paymentTermsDays} days net</p>
                </div>
                <div>
                  <span className="text-slate-400">Start Date:</span>
                  <p className="font-medium text-slate-800">{formatDate(subscription.startDate)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Next Billing Date:</span>
                  <p className="font-medium text-indigo-600 font-semibold">
                    {formatDate(subscription.nextBillingDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              Subscribed Products & Price Snapshots
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Product Variant</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Agreed Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscription.lines.map((line) => (
                    <tr key={line.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {line.descriptionSnapshot}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{line.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(line.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(line.lineGross)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Calculation Summary Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">
              Recurring Billing Calculation
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subscription.pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Discount ({subscription.pricing.discountPercentage}%):
                </span>
                <span className="font-medium text-emerald-400">
                  -{formatCurrency(subscription.pricing.discountAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Taxable Amount:</span>
                <span className="font-medium">{formatCurrency(subscription.pricing.taxableAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Tax ({subscription.pricing.taxRateSnapshot || '0.00'}%):
                </span>
                <span className="font-medium text-indigo-300">
                  +{formatCurrency(subscription.pricing.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800 font-bold">
                <span className="text-indigo-400">Grand Recurring Total:</span>
                <span className="text-white">
                  {formatCurrency(subscription.pricing.recurringTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Change History (Audit Events) */}
          {subscription.events && subscription.events.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Subscription Status History (Audit Events)
                </h3>
              </div>
              <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-2">
                {subscription.events.map((evt) => (
                  <div key={evt.id} className="relative text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 absolute -left-[21px] top-1.5 ring-4 ring-white" />
                    <div className="font-semibold text-slate-800">{evt.eventType}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(evt.createdAt)}
                      {evt.previousStatus && evt.newStatus && (
                        <span>
                          {' '}&bull; {evt.previousStatus} &rarr; {evt.newStatus}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <Button variant="outline" onClick={onClose}>
            Close Window
          </Button>
        </div>
      </div>

      {/* Close Reason Modal */}
      {closeReasonModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Close Subscription</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to close this subscription? Closed subscriptions will be permanently excluded from future billing runs.
            </p>
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for closure (optional)
              </label>
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="e.g., Customer requested cancellation, contract expired..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCloseReasonModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleClose}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
              >
                {actionLoading ? 'Closing...' : 'Confirm Closure'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
