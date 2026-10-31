import { BillingInterval, Plan, PlanStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export class PlansRepository {
  async findMany(filters?: { status?: PlanStatus }): Promise<Plan[]> {
    const where: Prisma.PlanWhereInput = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.plan.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Plan | null> {
    return prisma.plan.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    billingInterval: BillingInterval;
    intervalCount?: number;
    minimumQuantity?: number;
    status?: PlanStatus;
  }): Promise<Plan> {
    return prisma.plan.create({
      data: {
        name: data.name,
        billingInterval: data.billingInterval,
        intervalCount: data.intervalCount ?? 1,
        minimumQuantity: data.minimumQuantity ?? 1,
        status: data.status ?? PlanStatus.ACTIVE,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      billingInterval?: BillingInterval;
      intervalCount?: number;
      minimumQuantity?: number;
      status?: PlanStatus;
    },
  ): Promise<Plan> {
    return prisma.plan.update({
      where: { id },
      data,
    });
  }
}

export const plansRepository = new PlansRepository();
