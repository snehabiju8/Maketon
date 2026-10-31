export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type VariantStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  defaultPrice: number | string;
  status: VariantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  status: ProductStatus;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDTO {
  name: string;
  description?: string | null;
  status?: ProductStatus;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string | null;
  status?: ProductStatus;
}

export interface CreateVariantDTO {
  name: string;
  sku?: string | null;
  defaultPrice: number;
  status?: VariantStatus;
}

export interface UpdateVariantDTO {
  name?: string;
  sku?: string | null;
  defaultPrice?: number;
  status?: VariantStatus;
}
