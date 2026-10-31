import { Prisma, Role, User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { StaffQueryInput } from "./users.types";

export class UsersRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async createStaff(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        role: Role.INTERNAL,
        customerId: null,
      },
    });
  }

  async listStaff(
    query: StaffQueryInput,
  ): Promise<{ items: Omit<User, "passwordHash">[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.INTERNAL,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          customerId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { items, total };
  }
}

export const usersRepository = new UsersRepository();
