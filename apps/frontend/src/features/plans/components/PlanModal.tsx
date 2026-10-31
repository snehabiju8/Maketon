import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plan, CreatePlanDTO, UpdatePlanDTO, BillingInterval, PlanStatus } from '../types';
import { plansApi, getErrorMessage, formatBillingCycle } from '../plans.api';
import { AlertCircle, Calendar } from 'lucide-react';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: Plan | null;
  onSuccess: (plan: Plan, isNew: boolean) => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  planToEdit,
  onSuccess,
}) => {
  const isEditing = Boolean(planToEdit);

  const [name, setName] = useState('');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('MONTH');
  const [intervalCount, setIntervalCount] = useState<number>(1);
  const [minimumQuantity, setMinimumQuantity] = useState<number>(1);
  const [status, setStatus] = useState<PlanStatus>('ACTIVE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (planToEdit) {
      setName(planToEdit.name);
      setBillingInterval(planToEdit.billingInterval);
      setIntervalCount(planToEdit.intervalCount);
      setMinimumQuantity(planToEdit.minimumQuantity);
      setStatus(planToEdit.status);
    } else {
      setName('');
      setBillingInterval('MONTH');
      setIntervalCount(1);
      setMinimumQuantity(1);
      setStatus('ACTIVE');
    }
    setErrorMessage(null);
  }, [planToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage('Plan name is required.');
      return;
    }

    if (!Number.isInteger(intervalCount) || intervalCount < 1) {
      setErrorMessage('Interval count must be a positive whole integer (at least 1).');
      return;
    }

    if (!Number.isInteger(minimumQuantity) || minimumQuantity < 1) {
      setErrorMessage('Minimum quantity must be a positive whole integer (at least 1).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (isEditing && planToEdit) {
        const updatePayload: UpdatePlanDTO = {
          name: name.trim(),
          billingInterval,
          intervalCount: Number(intervalCount),
          minimumQuantity: Number(minimumQuantity),
          status,
        };

        const updated = await plansApi.updatePlan(planToEdit.id, updatePayload);
        onSuccess(updated, false);
      } else {
        const createPayload: CreatePlanDTO = {
          name: name.trim(),
          billingInterval,
          intervalCount: Number(intervalCount),
          minimumQuantity: Number(minimumQuantity),
          status,
        };

        const created = await plansApi.createPlan(createPayload);
        onSuccess(created, true);
      }
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to save plan.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
      description={
        isEditing
          ? 'Modify billing cadence, quantity requirements, and plan status.'
          : 'Define a recurring billing interval and rules for customer subscriptions.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Plan Name */}
        <div>
          <label htmlFor="plan-name" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Plan Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="plan-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly Standard, Annual Pro"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Billing Interval & Interval Count Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="billing-interval" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Billing Interval <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="billing-interval"
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="DAY">Day (Daily)</option>
                <option value="WEEK">Week (Weekly)</option>
                <option value="MONTH">Month (Monthly)</option>
                <option value="YEAR">Year (Annual)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="interval-count" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Interval Count <span className="text-rose-500">*</span>
            </label>
            <input
              id="interval-count"
              type="number"
              min="1"
              step="1"
              required
              value={intervalCount}
              onChange={(e) => setIntervalCount(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Live Cadence Preview */}
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700">
          <Calendar className="w-4 h-4 shrink-0 text-indigo-500" />
          <span>
            Billing cadence: <strong className="font-semibold">{formatBillingCycle(billingInterval, intervalCount)}</strong>
          </span>
        </div>

        {/* Minimum Quantity & Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="minimum-quantity" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Minimum Quantity <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="minimum-quantity"
                type="number"
                min="1"
                step="1"
                required
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Minimum units or seats required per subscription.
            </p>
          </div>

          <div>
            <label htmlFor="plan-status" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
              Plan Status
            </label>
            <select
              id="plan-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as PlanStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ACTIVE">Active (Available)</option>
              <option value="INACTIVE">Inactive (Archived)</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Inactive plans cannot be selected for new subscriptions.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEditing
                ? 'Saving...'
                : 'Creating...'
              : isEditing
                ? 'Save Changes'
                : 'Create Plan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
