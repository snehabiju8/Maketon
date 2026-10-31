import { CustomerStatus } from "@prisma/client";

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  billingAddress?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  billingAddress?: string;
  status?: CustomerStatus;
}

export interface CustomerQueryInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
}

export interface CustomerResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  billingAddress: string | null;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
}
