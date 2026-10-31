import api from '@/lib/axios';
import axios from 'axios';
import { Plan, CreatePlanDTO, UpdatePlanDTO, BillingInterval } from './types';

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

export const plansApi = {
  async listPlans(status?: string): Promise<Plan[]> {
    const params = status && status !== 'ALL' ? { status } : {};
    const res = await api.get<ApiResponse<Plan[]>>(getEndpoint('/plans'), { params });
    return res.data.data;
  },

  async getPlan(id: string): Promise<Plan> {
    const res = await api.get<ApiResponse<Plan>>(getEndpoint(`/plans/${id}`));
    return res.data.data;
  },

  async createPlan(data: CreatePlanDTO): Promise<Plan> {
    const res = await api.post<ApiResponse<Plan>>(getEndpoint('/plans'), data);
    return res.data.data;
  },

  async updatePlan(id: string, data: UpdatePlanDTO): Promise<Plan> {
    const res = await api.patch<ApiResponse<Plan>>(getEndpoint(`/plans/${id}`), data);
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

export const formatBillingCycle = (interval: BillingInterval, count: number): string => {
  const map: Record<BillingInterval, { singular: string; plural: string }> = {
    DAY: { singular: 'day', plural: 'days' },
    WEEK: { singular: 'week', plural: 'weeks' },
    MONTH: { singular: 'month', plural: 'months' },
    YEAR: { singular: 'year', plural: 'years' },
  };

  const config = map[interval] || {
    singular: interval.toLowerCase(),
    plural: `${interval.toLowerCase()}s`,
  };

  if (count === 1) {
    return `Every ${config.singular}`;
  }
  return `Every ${count} ${config.plural}`;
};
