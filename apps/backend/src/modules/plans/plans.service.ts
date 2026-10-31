import { BillingInterval, Plan, PlanStatus } from "@prisma/client";
import { plansRepository, PlansRepository } from "./plans.repository";
import { CreatePlanInput, UpdatePlanInput } from "./plans.validation";
import { AppError } from "../../utils/app-error";

export class PlansService {
  constructor(private readonly repo: PlansRepository = plansRepository) {}

  async getPlans(status?: PlanStatus): Promise<Plan[]> {
    return this.repo.findMany({ status });
  }

  async getPlanById(id: string): Promise<Plan> {
    const plan = await this.repo.findById(id);
    if (!plan) {
      throw AppError.notFound(`Plan with ID '${id}' not found`);
    }
    return plan;
  }

  async createPlan(data: CreatePlanInput): Promise<Plan> {
    return this.repo.create({
      name: data.name,
      billingInterval: data.billingInterval as BillingInterval,
      intervalCount: data.intervalCount,
      minimumQuantity: data.minimumQuantity,
      status: data.status as PlanStatus,
    });
  }

  async updatePlan(id: string, data: UpdatePlanInput): Promise<Plan> {
    await this.getPlanById(id);

    const updatePayload: {
      name?: string;
      billingInterval?: BillingInterval;
      intervalCount?: number;
      minimumQuantity?: number;
      status?: PlanStatus;
    } = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.billingInterval !== undefined) {
      updatePayload.billingInterval = data.billingInterval as BillingInterval;
    }
    if (data.intervalCount !== undefined) updatePayload.intervalCount = data.intervalCount;
    if (data.minimumQuantity !== undefined) updatePayload.minimumQuantity = data.minimumQuantity;
    if (data.status !== undefined) updatePayload.status = data.status as PlanStatus;

    return this.repo.update(id, updatePayload);
  }
}

export const plansService = new PlansService();
