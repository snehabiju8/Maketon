import { Role } from "@prisma/client";

export interface RegisterCustomerInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  billingAddress?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  customerId: string | null;
}

export interface AuthSessionResponse {
  user: AuthUserResponse;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    billingAddress: string | null;
    status: string;
  } | null;
}
