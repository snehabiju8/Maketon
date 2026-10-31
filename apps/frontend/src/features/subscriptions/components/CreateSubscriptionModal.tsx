import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  CatalogPreview,
  CreateSubscriptionPayload,
  CreateSubscriptionLineItem,
} from '../types';

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSubscriptionPayload) => Promise<void>;
  catalog: CatalogPreview | null;
  loadingCatalog: boolean;
}

interface FormLineItem extends CreateSubscriptionLineItem {
  key: string;
  defaultPrice: number;
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  catalog,
  loadingCatalog,
}) => {
  // Form State
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [paymentTermsDays, setPaymentTermsDays] = useState(15);
  const [taxId, setTaxId] = useState('');
  const [discountId, setDiscountId] = useState('');
  const [lines, setLines] = useState<FormLineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize first line item when catalog loads
  useEffect(() => {
    if (catalog?.variants && catalog.variants.length > 0 && lines.length === 0) {
      const first = catalog.variants[0];
      setLines([
        {
          key: `line-${Date.now()}`,
          variantId: first.id,
          quantity: 1,
          customUnitPrice: Number(first.defaultPrice),
          defaultPrice: Number(first.defaultPrice),
        },
      ]);
    }
  }, [catalog]);

  if (!isOpen) return null;

  const selectedPlan = catalog?.plans.find((p) => p.id === planId);
  const selectedTax = catalog?.taxes.find((t) => t.id === taxId);
  const selectedDiscount = catalog?.discounts.find((d) => d.id === discountId);

  // Add line item
  const handleAddLine = () => {
    if (!catalog?.variants || catalog.variants.length === 0) return;
    const defaultVariant = catalog.variants[0];
    setLines((prev) => [
      ...prev,
      {
        key: `line-${Date.now()}-${prev.length}`,
        variantId: defaultVariant.id,
        quantity: 1,
        customUnitPrice: Number(defaultVariant.defaultPrice),
        defaultPrice: Number(defaultVariant.defaultPrice),
      },
    ]);
  };

  // Remove line item
  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Update line variant
  const handleVariantChange = (index: number, variantId: string) => {
    const variant = catalog?.variants.find((v) => v.id === variantId);
    if (!variant) return;
    const price = Number(variant.defaultPrice);
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        variantId,
        defaultPrice: price,
        customUnitPrice: price,
      };
      return copy;
    });
  };

  // Update line quantity
  const handleQuantityChange = (index: number, quantity: number) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        quantity: Math.max(1, quantity),
      };
      return copy;
    });
  };

  // Update line custom unit price
  const handlePriceChange = (index: number, price: number) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        customUnitPrice: Math.max(0, price),
      };
      return copy;
    });
  };

  // Calculate live financial summary
  const subtotal = lines.reduce((acc, line) => {
    const price = line.customUnitPrice ?? line.defaultPrice;
    return acc + price * line.quantity;
  }, 0);

  const discountPct = selectedDiscount ? Number(selectedDiscount.percentage) : 0;
  const discountAmount = Math.round((subtotal * (discountPct / 100)) * 100) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxRate = selectedTax ? Number(selectedTax.rate) : 0;
  const taxAmount = Math.round((taxableAmount * (taxRate / 100)) * 100) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const totalQuantity = lines.reduce((acc, l) => acc + l.quantity, 0);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerId) {
      setFormError('Please select a customer');
      return;
    }
    if (!planId) {
      setFormError('Please select a subscription plan');
      return;
    }
    if (lines.length === 0) {
      setFormError('Please add at least one subscription line item');
      return;
    }

    if (selectedPlan && totalQuantity < selectedPlan.minimumQuantity) {
      setFormError(
        `Total quantity (${totalQuantity}) must be at least ${selectedPlan.minimumQuantity} for the ${selectedPlan.name}`,
      );
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        customerId,
        planId,
        startDate: new Date(startDate).toISOString(),
        paymentTermsDays: Number(paymentTermsDays),
        currency: 'INR',
        taxId: taxId || null,
        discountId: discountId || null,
        lines: lines.map((l) => ({
          variantId: l.variantId,
          quantity: l.quantity,
          customUnitPrice: l.customUnitPrice,
        })),
      });
      onClose();
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || err.message || 'Failed to create subscription',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create New Subscription
              </h2>
              <p className="text-xs text-slate-500">
                Setup recurring subscription with price snapshots and billing schedule
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Customer & Plan Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="">Select a Customer...</option>
                {catalog?.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Billing Plan *
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="">Select a Subscription Plan...</option>
                {catalog?.plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Every {p.intervalCount > 1 ? `${p.intervalCount} ` : ''}
                    {p.billingInterval.toLowerCase()} (Min. {p.minimumQuantity} unit
                    {p.minimumQuantity > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Billing Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Currency
              </label>
              <input
                type="text"
                disabled
                value="INR (₹)"
                className="w-full px-3 py-1.5 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              />
            </div>
          </div>

          {/* Subscription Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Product & Variant Line Items *
                </h3>
                <p className="text-[11px] text-slate-400">
                  Agreed unit prices are permanently snapshot upon creation
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </Button>
            </div>

            <div className="space-y-2.5">
              {lines.map((line, idx) => (
                <div
                  key={line.key}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs"
                >
                  {/* Variant Selection */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase sm:hidden mb-1">
                      Variant
                    </label>
                    <select
                      value={line.variantId}
                      onChange={(e) => handleVariantChange(idx, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {catalog?.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.productName} — {v.variantName} (₹{v.defaultPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-24">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase sm:hidden mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) =>
                        handleQuantityChange(idx, Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 text-xs text-center bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      title="Quantity"
                    />
                  </div>

                  {/* Custom Unit Price */}
                  <div className="w-32">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase sm:hidden mb-1">
                      Agreed Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.customUnitPrice ?? line.defaultPrice}
                      onChange={(e) =>
                        handlePriceChange(idx, Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 text-xs text-right bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      title="Agreed Unit Price"
                    />
                  </div>

                  {/* Line Total */}
                  <div className="w-28 text-right font-semibold text-xs text-slate-800">
                    <span className="sm:hidden text-slate-400 font-normal mr-2">
                      Total:
                    </span>
                    ₹
                    {(
                      (line.customUnitPrice ?? line.defaultPrice) * line.quantity
                    ).toFixed(2)}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lines.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Taxes & Discounts Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Applicable Tax
              </label>
              <select
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Tax / Exempt (0%)</option>
                {catalog?.taxes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.rate}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Applicable Discount
              </label>
              <select
                value={discountId}
                onChange={(e) => setDiscountId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Discount (0%)</option>
                {catalog?.discounts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.percentage}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Pricing Summary Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Calculator className="w-3.5 h-3.5" />
              <span>Real-time Pricing Breakdown</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-slate-400">Gross Subtotal</p>
                <p className="text-sm font-semibold mt-0.5 text-slate-100">
                  ₹{subtotal.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Discount ({discountPct}%)</p>
                <p className="text-sm font-semibold mt-0.5 text-emerald-400">
                  -₹{discountAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Tax ({taxRate}%)</p>
                <p className="text-sm font-semibold mt-0.5 text-indigo-300">
                  +₹{taxAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-indigo-400 font-medium">Recurring Total</p>
                <p className="text-base font-bold mt-0.5 text-white">
                  ₹{grandTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || loadingCatalog}
            >
              {submitting ? 'Creating...' : 'Create Subscription (Draft)'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

