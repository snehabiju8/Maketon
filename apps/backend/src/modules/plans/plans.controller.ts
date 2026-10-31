import { Request, Response } from "express";
import { PlanStatus } from "@prisma/client";
import { plansService, PlansService } from "./plans.service";
import { sendSuccess } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";

export class PlansController {
  constructor(private readonly service: PlansService = plansService) {}

  listPlans = asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as PlanStatus | undefined;
    const plans = await this.service.getPlans(status);
    return sendSuccess(res, plans, "Plans retrieved successfully", 200);
  });

  createPlan = asyncHandler(async (req: Request, res: Response) => {
    const plan = await this.service.createPlan(req.body);
    return sendSuccess(res, plan, "Plan created successfully", 201);
  });

  getPlanById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const plan = await this.service.getPlanById(id);
    return sendSuccess(res, plan, "Plan retrieved successfully", 200);
  });

  updatePlan = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await this.service.updatePlan(id, req.body);
    return sendSuccess(res, updated, "Plan updated successfully", 200);
  });
}

export const plansController = new PlansController();
