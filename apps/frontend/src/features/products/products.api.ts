import api from '@/lib/axios';
import axios from 'axios';
import {
  Product,
  ProductVariant,
  CreateProductDTO,
  UpdateProductDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
} from './types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
  errors?: unknown;
}

// Automatically resolve path against /api or /api/v1 baseURL
const getEndpoint = (path: string): string => {
  const base = api.defaults.baseURL || '';
  if (base.endsWith('/v1')) {
    return path;
  }
  return `/v1${path}`;
};

export const productsApi = {
  // Product endpoints
  async listProducts(status?: string): Promise<Product[]> {
    const params = status && status !== 'ALL' ? { status } : {};
    const res = await api.get<ApiResponse<Product[]>>(getEndpoint('/products'), { params });
    return res.data.data;
  },

  async getProduct(id: string): Promise<Product & { variants: ProductVariant[] }> {
    const res = await api.get<ApiResponse<Product & { variants: ProductVariant[] }>>(
      getEndpoint(`/products/${id}`),
    );
    return res.data.data;
  },

  async createProduct(data: CreateProductDTO): Promise<Product> {
    const res = await api.post<ApiResponse<Product>>(getEndpoint('/products'), data);
    return res.data.data;
  },

  async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
    const res = await api.patch<ApiResponse<Product>>(getEndpoint(`/products/${id}`), data);
    return res.data.data;
  },

  // Product Variant endpoints
  async listVariants(productId: string, status?: string): Promise<ProductVariant[]> {
    const params = status && status !== 'ALL' ? { status } : {};
    const res = await api.get<ApiResponse<ProductVariant[]>>(
      getEndpoint(`/products/${productId}/variants`),
      { params },
    );
    return res.data.data;
  },

  async getVariant(id: string): Promise<ProductVariant & { product: Product }> {
    const res = await api.get<ApiResponse<ProductVariant & { product: Product }>>(
      getEndpoint(`/products/variants/${id}`),
    );
    return res.data.data;
  },

  async createVariant(productId: string, data: CreateVariantDTO): Promise<ProductVariant> {
    const res = await api.post<ApiResponse<ProductVariant>>(
      getEndpoint(`/products/${productId}/variants`),
      data,
    );
    return res.data.data;
  },

  async updateVariant(id: string, data: UpdateVariantDTO): Promise<ProductVariant> {
    const res = await api.patch<ApiResponse<ProductVariant>>(
      getEndpoint(`/products/variants/${id}`),
      data,
    );
    return res.data.data;
  },
};

export const getErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as {
      message?: string;
      errors?: Record<string, string[] | string>;
    };

    if (data.message) {
      if (data.errors && typeof data.errors === 'object') {
        const details = Object.entries(data.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        return details ? `${data.message} (${details})` : data.message;
      }
      return data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
