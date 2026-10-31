import { Role } from "@prisma/client";
import { customersRepository, CustomersRepository } from "./customers.repository";
import { CreateCustomerInput, CustomerQueryInput, CustomerResponse, UpdateCustomerInput } from "./customers.types";
import { assertCustomerAccess } from "../../middleware/authorize";
import { AuthenticatedUser } from "../../types/express";
import { AppError } from "../../utils/app-error";

export class CustomersService {
  constructor(private repo: CustomersRepository = customersRepository) {}

  async createCustomer(input: CreateCustomerInput): Promise<CustomerResponse> {
    const customer = await this.repo.create(input);
    return customer;
  }

  async listCustomers(query: CustomerQueryInput) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { items, total } = await this.repo.list(query);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getCustomerById(id: string, user: AuthenticatedUser): Promise<CustomerResponse> {
    // 1. Enforce strict customer tenant ownership
    assertCustomerAccess(user, id);

    const customer = await this.repo.findById(id);
    if (!customer) {
      throw AppError.notFound("Customer not found.", "CUSTOMER_NOT_FOUND");
    }

    return customer;
  }

  async updateCustomer(
    id: string,
    input: UpdateCustomerInput,
    user: AuthenticatedUser,
  ): Promise<CustomerResponse> {
    // 1. Enforce strict customer tenant ownership
    assertCustomerAccess(user, id);

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw AppError.notFound("Customer not found.", "CUSTOMER_NOT_FOUND");
    }

    // 2. Prevent customers from updating administrative fields like status
    const updateData: UpdateCustomerInput = { ...input };
    if (user.role === Role.CUSTOMER) {
      delete updateData.status;
    }

    return this.repo.update(id, updateData);
  }
}

export const customersService = new CustomersService();
