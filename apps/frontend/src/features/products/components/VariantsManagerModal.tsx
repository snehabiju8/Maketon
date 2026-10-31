import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Product, ProductVariant } from '../types';
import { productsApi, getErrorMessage } from '../products.api';
import { VariantModal } from './VariantModal';
import { Plus, Edit2, Layers, AlertCircle, RefreshCw } from 'lucide-react';

interface VariantsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onProductUpdated?: () => void;
}

export const VariantsManagerModal: React.FC<VariantsManagerModalProps> = ({
  isOpen,
  onClose,
  product,
  onProductUpdated,
}) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Variant Modal state
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [variantToEdit, setVariantToEdit] = useState<ProductVariant | null>(null);

  const fetchVariants = useCallback(async () => {
    if (!product) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await productsApi.listVariants(product.id);
      setVariants(data);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to load product variants.'));
    } finally {
      setIsLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (isOpen && product) {
      fetchVariants();
    }
  }, [isOpen, product, fetchVariants]);

  const handleOpenCreateVariant = () => {
    setVariantToEdit(null);
    setIsVariantModalOpen(true);
  };

  const handleOpenEditVariant = (variant: ProductVariant) => {
    setVariantToEdit(variant);
    setIsVariantModalOpen(true);
  };

  const handleVariantSuccess = (savedVariant: ProductVariant, isNew: boolean) => {
    if (isNew) {
      setVariants((prev) => [...prev, savedVariant]);
    } else {
      setVariants((prev) =>
        prev.map((v) => (v.id === savedVariant.id ? savedVariant : v)),
      );
    }
    if (onProductUpdated) {
      onProductUpdated();
    }
  };

  if (!product) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Variants: ${product.name}`}
        description={`Manage the purchasable tiers, SKUs, and pricing configurations for ${product.name}.`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Product Status:</span>
              <Badge variant={product.status === 'ACTIVE' ? 'success' : 'default'}>
                {product.status}
              </Badge>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-600 font-medium">
                {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchVariants}
                disabled={isLoading}
                title="Refresh variants list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateVariant}
                disabled={product.status === 'INACTIVE'}
                title={
                  product.status === 'INACTIVE'
                    ? 'Activate product to add variants'
                    : 'Add new variant'
                }
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Variant
              </Button>
            </div>
          </div>

          {/* Warning if Product is Inactive */}
          {product.status === 'INACTIVE' && (
            <div className="flex items-center gap-2 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                This product is currently <strong>Inactive</strong>. You cannot create new variants under inactive products.
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && variants.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mb-2" />
              <p className="text-xs">Loading variants...</p>
            </div>
          ) : variants.length === 0 ? (
            /* Empty State */
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No variants defined</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Add purchasable editions (e.g. Standard, Enterprise, Monthly) with unique default prices.
              </p>
              {product.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenCreateVariant}
                  className="mt-4"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add First Variant
                </Button>
              )}
            </div>
          ) : (
            /* Variants Table */
            <div className="overflow-x-auto border border-slate-200/80 rounded-lg shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Variant Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Default Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {variants.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{v.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {v.sku ? (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {v.sku}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        ₹{Number(v.defaultPrice).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={v.status === 'ACTIVE' ? 'success' : 'default'}>
                          {v.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditVariant(v)}
                          className="h-8 px-2 text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Child Variant Create/Edit Modal */}
      {isVariantModalOpen && (
        <VariantModal
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          product={product}
          variantToEdit={variantToEdit}
          onSuccess={handleVariantSuccess}
        />
      )}
    </>
  );
};
