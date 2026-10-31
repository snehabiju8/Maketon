import api from '@/lib/axios';
import {
  Subscription,
  SubscriptionListResponse,
  CatalogPreview,
  CreateSubscriptionPayload,
  SubscriptionPricing,
} from '../types';

export const subscriptionsApi = {
  /**
   * Fetch paginated subscriptions with status, customer, and search filters
   */
  async list(params?: {
    status?: string;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<SubscriptionListResponse> {
    const res = await api.get('/subscriptions', { params });
    return res.data.data;
  },

  /**
   * Fetch single subscription details by ID
   */
  async getById(id: string): Promise<Subscription> {
    const res = await api.get(`/subscriptions/${id}`);
    return res.data.data;
  },

  /**
   * Create a new subscription
   */
  async create(payload: CreateSubscriptionPayload): Promise<Subscription> {
    const res = await api.post('/subscriptions', payload);
    return res.data.data;
  },

  /**
   * Confirm a draft subscription: DRAFT -> CONFIRMED
   */
  async confirm(id: string): Promise<Subscription> {
    const res = await api.post(`/subscriptions/${id}/confirm`);
    return res.data.data;
  },

  /**
   * Activate a confirmed subscription: CONFIRMED -> ACTIVE
   */
  async activate(id: string): Promise<Subscription> {
    const res = await api.post(`/subscriptions/${id}/activate`);
    return res.data.data;
  },

  /**
   * Close a subscription: DRAFT | CONFIRMED | ACTIVE -> CLOSED
   */
  async close(id: string, reason?: string): Promise<Subscription> {
    const res = await api.post(`/subscriptions/${id}/close`, { reason });
    return res.data.data;
  },

  /**
   * Calculate real-time pricing preview before saving
   */
  async calculatePricing(payload: {
    lines: { unitPrice: number | string; quantity: number }[];
    taxRate?: number | string | null;
    discountPercentage?: number | string | null;
  }): Promise<SubscriptionPricing> {
    const res = await api.post('/subscriptions/calculate-pricing', payload);
    return res.data.data;
  },

  /**
   * Fetch catalog preview (customers, plans, product variants, taxes, discounts)
   */
  async getCatalogPreview(): Promise<CatalogPreview> {
    const res = await api.get('/subscriptions/catalog-preview');
    return res.data.data;
  },
};

