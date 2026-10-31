import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Product } from './types';
import { productsApi, getErrorMessage } from './products.api';
import { ProductModal } from './components/ProductModal';
import { VariantsManagerModal } from './components/VariantsManagerModal';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await productsApi.listProducts(
        statusFilter !== 'ALL' ? statusFilter : undefined,
      );
      setProducts(data);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to retrieve products.'));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Client-side search filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  // Handlers
  const handleOpenCreateProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleOpenManageVariants = (product: Product) => {
    setSelectedProductForVariants(product);
    setIsVariantsModalOpen(true);
  };

  const handleProductSaved = (savedProduct: Product, isNew: boolean) => {
    if (isNew) {
      setProducts((prev) => [savedProduct, ...prev]);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)),
      );
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await productsApi.updateProduct(product.id, {
        status: nextStatus,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
    } catch (err) {
      setErrorMessage(getErrorMessage(err, `Failed to update status for ${product.name}.`));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Products & Product Variants"
        description="Manage your software catalog, define purchasable editions, and configure default variant pricing."
        action={
          <Button variant="primary" size="md" onClick={handleOpenCreateProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        }
      />

      {/* Global Error Alert */}
      {errorMessage && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchProducts} className="text-rose-700 hover:bg-rose-100">
            Retry
          </Button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Tabs and Refresh */}
          <div className="flex items-center gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={fetchProducts}
              disabled={isLoading}
              title="Refresh product list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Content List */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-5 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="pt-4 border-t border-slate-100 flex justify-between">
                  <div className="h-8 bg-slate-200 rounded w-24" />
                  <div className="h-8 bg-slate-200 rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No products found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No catalog items match your search and filter criteria. Try adjusting your filters.'
                : 'Get started by creating your first catalog product with purchasable variants.'}
            </p>
            {searchQuery || statusFilter !== 'ALL' ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleOpenCreateProduct}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Product Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const variantCount = product.variants ? product.variants.length : 0;
            const isActive = product.status === 'ACTIVE';

            return (
              <Card
                key={product.id}
                className="flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-md"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
                        {product.description || (
                          <span className="italic text-slate-400">No description provided</span>
                        )}
                      </p>
                    </div>

                    <Badge variant={isActive ? 'success' : 'default'} className="shrink-0">
                      {product.status}
                    </Badge>
                  </div>

                  {/* Variants Summary Pill */}
                  <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>{variantCount} {variantCount === 1 ? 'Variant' : 'Variants'}</span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Created {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Manage Variants Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenManageVariants(product)}
                      className="text-xs font-medium"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      Manage Variants
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* Edit Product */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditProduct(product)}
                        title="Edit product details"
                        className="px-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      </Button>

                      {/* Toggle Status */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleProductStatus(product)}
                        title={isActive ? 'Deactivate product' : 'Activate product'}
                        className={`px-2 ${
                          isActive
                            ? 'text-slate-400 hover:text-rose-600'
                            : 'text-emerald-600 hover:text-emerald-700'
                        }`}
                      >
                        {isActive ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Create / Edit Modal */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          productToEdit={productToEdit}
          onSuccess={handleProductSaved}
        />
      )}

      {/* Variants Manager Modal */}
      {isVariantsModalOpen && (
        <VariantsManagerModal
          isOpen={isVariantsModalOpen}
          onClose={() => {
            setIsVariantsModalOpen(false);
            setSelectedProductForVariants(null);
          }}
          product={selectedProductForVariants}
          onProductUpdated={fetchProducts}
        />
      )}
    </div>
  );
};

export default ProductsPage;
