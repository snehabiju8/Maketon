import { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response";
import * as dashboardService from "./dashboard.service";
import { dashboardQuerySchema } from "./dashboard.validation";

export const getSummary = async (req: Request, res: Response) => {
  const query = dashboardQuerySchema.parse(req.query);
  const summary = await dashboardService.getSummary(query);
  return sendSuccess(res, summary, "Dashboard summary retrieved");
};
