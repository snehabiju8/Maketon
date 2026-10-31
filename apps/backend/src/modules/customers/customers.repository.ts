import { Customer, CustomerStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { CreateCustomerInput, CustomerQueryInput, UpdateCustomerInput } from "./customers.types";

export class CustomersRepository {
  async create(input: CreateCustomerInput): Promise<Customer> {
    return prisma.customer.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase().trim(),
        phone: input.phone,
        billingAddress: input.billingAddress,
        status: CustomerStatus.ACTIVE,
      },
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { id },
    });
  }

  async list(query: CustomerQueryInput): Promise<{ items: Customer[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { items, total };
  }

  async update(id: string, data: UpdateCustomerInput): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data,
    });
  }
}

export const customersRepository = new CustomersRepository();
