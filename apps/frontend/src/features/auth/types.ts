export type Role = "ADMIN" | "INTERNAL" | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  customerId?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  billingAddress?: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface AuthSession {
  user: User;
  customer?: Customer | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  billingAddress?: string;
}
