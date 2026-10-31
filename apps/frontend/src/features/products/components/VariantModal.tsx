import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProductVariant, CreateVariantDTO, UpdateVariantDTO, Product } from '../types';
import { productsApi, getErrorMessage } from '../products.api';
import { AlertCircle } from 'lucide-react';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  variantToEdit?: ProductVariant | null;
  onSuccess: (variant: ProductVariant, isNew: boolean) => void;
}

export const VariantModal: React.FC<VariantModalProps> = ({
  isOpen,
  onClose,
  product,
  variantToEdit,
  onSuccess,
}) => {
  const isEditing = Boolean(variantToEdit);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [defaultPrice, setDefaultPrice] = useState<string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (variantToEdit) {
      setName(variantToEdit.name);
      setSku(variantToEdit.sku || '');
      setDefaultPrice(String(variantToEdit.defaultPrice));
      setStatus(variantToEdit.status);
    } else {
      setName('');
      setSku('');
      setDefaultPrice('');
      setStatus('ACTIVE');
    }
    setErrorMessage(null);
  }, [variantToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage('Variant name is required.');
      return;
    }

    const priceNum = parseFloat(defaultPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Please provide a valid non-negative default price.');
      return;
    }

    // Check parent product status when creating
    if (!isEditing && product.status === 'INACTIVE') {
      setErrorMessage('Cannot create variants for an inactive product. Activate the product first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (isEditing && variantToEdit) {
        const updatePayload: UpdateVariantDTO = {
          name: name.trim(),
          sku: sku.trim() ? sku.trim() : null,
          defaultPrice: priceNum,
          status,
        };
        const updated = await productsApi.updateVariant(variantToEdit.id, updatePayload);
        onSuccess(updated, false);
      } else {
        const createPayload: CreateVariantDTO = {
          name: name.trim(),
          sku: sku.trim() ? sku.trim() : null,
          defaultPrice: priceNum,
          status,
        };
        const created = await productsApi.createVariant(product.id, createPayload);
        onSuccess(created, true);
      }
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to save product variant.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Variant — ${product.name}` : `Add Variant to ${product.name}`}
      description={
        isEditing
          ? 'Update the variant configuration, SKU, or price snapshot.'
          : 'Define a purchasable tier or version with unique pricing.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Warning if parent product is inactive */}
        {!isEditing && product.status === 'INACTIVE' && (
          <div className="p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
            <strong>Notice:</strong> This product is currently <strong>Inactive</strong>. You must set the product to Active before adding variants.
          </div>
        )}

        {/* Variant Name */}
        <div>
          <label htmlFor="variant-name" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Variant Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="variant-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Enterprise Edition, 500 GB Storage"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* SKU */}
        <div>
          <label htmlFor="variant-sku" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            SKU (Stock Keeping Unit) <span className="text-slate-400 font-normal">(Optional, unique)</span>
          </label>
          <input
            id="variant-sku"
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. CLOUD-ENT-500"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Default Price */}
        <div>
          <label htmlFor="variant-price" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Default Unit Price (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 sm:text-sm">₹</span>
            </div>
            <input
              id="variant-price"
              type="number"
              step="0.01"
              min="0"
              required
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Suggested unit price copied as a snapshot into subscription lines.
          </p>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="variant-status" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Variant Availability
          </label>
          <select
            id="variant-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="ACTIVE">Active (Selectable in subscriptions)</option>
            <option value="INACTIVE">Inactive (Hidden from new subscriptions)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || (!isEditing && product.status === 'INACTIVE')}
          >
            {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Variant' : 'Create Variant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
