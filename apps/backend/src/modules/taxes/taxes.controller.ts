import { Request, Response } from "express";
import { taxesService, TaxesService } from "./taxes.service";
import { sendSuccess } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";

export class TaxesController {
  constructor(private readonly service: TaxesService = taxesService) {}

  listTaxes = asyncHandler(async (req: Request, res: Response) => {
    const isActive = req.query.isActive as boolean | undefined;
    const taxes = await this.service.getTaxes(isActive);
    return sendSuccess(res, taxes, "Taxes retrieved successfully", 200);
  });

  createTax = asyncHandler(async (req: Request, res: Response) => {
    const tax = await this.service.createTax(req.body);
    return sendSuccess(res, tax, "Tax created successfully", 201);
  });

  getTaxById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tax = await this.service.getTaxById(id);
    return sendSuccess(res, tax, "Tax retrieved successfully", 200);
  });

  updateTax = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await this.service.updateTax(id, req.body);
    return sendSuccess(res, updated, "Tax updated successfully", 200);
  });
}

export const taxesController = new TaxesController();
