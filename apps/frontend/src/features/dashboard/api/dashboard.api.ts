import api from '@/lib/axios';
import type { ApiResponse } from '@/types';
import type { DashboardFilters, DashboardSummary } from '../types';

export const getDashboardSummary = async (filters: DashboardFilters = {}): Promise<DashboardSummary> => {
  const res = await api.get<ApiResponse<DashboardSummary>>('/v1/dashboard/summary', { params: filters });
  return res.data.data;
};
