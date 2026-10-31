import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Product, CreateProductDTO, UpdateProductDTO } from '../types';
import { productsApi, getErrorMessage } from '../products.api';
import { AlertCircle } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: (product: Product, isNew: boolean) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const isEditing = Boolean(productToEdit);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description || '');
      setStatus(productToEdit.status);
    } else {
      setName('');
      setDescription('');
      setStatus('ACTIVE');
    }
    setErrorMessage(null);
  }, [productToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (isEditing && productToEdit) {
        const updatePayload: UpdateProductDTO = {
          name: name.trim(),
          description: description.trim() ? description.trim() : null,
          status,
        };
        const updated = await productsApi.updateProduct(productToEdit.id, updatePayload);
        onSuccess(updated, false);
      } else {
        const createPayload: CreateProductDTO = {
          name: name.trim(),
          description: description.trim() ? description.trim() : null,
          status,
        };
        const created = await productsApi.createProduct(createPayload);
        onSuccess(created, true);
      }
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to save product.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      description={
        isEditing
          ? 'Update the product details or change its status.'
          : 'Define a new product item for the catalog.'
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

        {/* Product Name */}
        <div>
          <label htmlFor="product-name" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Product Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="product-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Enterprise Cloud Suite"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="product-description" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="product-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of features, usage, or notes..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="product-status" className="block text-xs font-semibold uppercase text-slate-700 mb-1">
            Catalog Status
          </label>
          <select
            id="product-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="ACTIVE">Active (Available for subscriptions)</option>
            <option value="INACTIVE">Inactive (Archived / Unavailable)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
