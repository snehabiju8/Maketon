import { Role } from "@prisma/client";

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
}

export interface StaffUserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface StaffQueryInput {
  page?: number;
  limit?: number;
  search?: string;
}
