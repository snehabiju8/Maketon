import { Prisma, Tax } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export class TaxesRepository {
  async findMany(filters?: { isActive?: boolean }): Promise<Tax[]> {
    const where: Prisma.TaxWhereInput = {};
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.tax.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Tax | null> {
    return prisma.tax.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    rate: Prisma.Decimal;
    isActive?: boolean;
  }): Promise<Tax> {
    return prisma.tax.create({
      data: {
        name: data.name,
        rate: data.rate,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      rate?: Prisma.Decimal;
      isActive?: boolean;
    },
  ): Promise<Tax> {
    return prisma.tax.update({
      where: { id },
      data,
    });
  }
}

export const taxesRepository = new TaxesRepository();
