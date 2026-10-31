import { apiClient } from "../../../lib/api-client";
import { Customer } from "../../auth/types";

export interface CustomersListResponse {
  items: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const customersApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiClient.get<CustomersListResponse>(`/customers${query}`);
  },

  getById: async (id: string): Promise<{ customer: Customer }> => {
    return apiClient.get<{ customer: Customer }>(`/customers/${id}`);
  },

  update: async (
    id: string,
    data: { name?: string; phone?: string; billingAddress?: string; status?: string },
  ): Promise<{ customer: Customer }> => {
    return apiClient.patch<{ customer: Customer }>(`/customers/${id}`, data);
  },

  create: async (data: {
    name: string;
    email: string;
    phone?: string;
    billingAddress?: string;
  }): Promise<{ customer: Customer }> => {
    return apiClient.post<{ customer: Customer }>("/customers", data);
  },
};
