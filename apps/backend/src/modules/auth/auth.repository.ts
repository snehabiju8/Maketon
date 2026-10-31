import { Customer, CustomerStatus, Role, User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { RegisterCustomerInput } from "./auth.types";

export class AuthRepository {
  /**
   * Find user by email (case-insensitive lookup with normalized email)
   */
  async findUserByEmail(email: string): Promise<(User & { customer: Customer | null }) | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { customer: true },
    });
  }

  /**
   * Find user by ID including linked customer profile
   */
  async findUserById(id: string): Promise<(User & { customer: Customer | null }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { customer: true },
    });
  }

  /**
   * Atomically create a Customer and linked User inside an interactive Prisma transaction callback.
   * Ensures either both succeed or none commit, with newly created customer.id supplied to user.
   */
  async createCustomerAndUserTx(
    input: RegisterCustomerInput,
    passwordHash: string,
  ): Promise<{ user: User; customer: Customer }> {
    return prisma.$transaction(async (tx) => {
      // 1. Create the customer profile
      const customer = await tx.customer.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase().trim(),
          phone: input.phone,
          billingAddress: input.billingAddress,
          status: CustomerStatus.ACTIVE,
        },
      });

      // 2. Create the linked user account
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase().trim(),
          passwordHash,
          role: Role.CUSTOMER,
          customerId: customer.id,
        },
      });

      return { user, customer };
    });
  }
}

export const authRepository = new AuthRepository();
