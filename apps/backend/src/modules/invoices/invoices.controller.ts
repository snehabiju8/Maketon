import { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response";
import * as invoicesService from "./invoices.service";
import { idParamSchema, listInvoicesQuerySchema } from "./invoices.validation";

export const runBilling = async (_req: Request, res: Response) => {
  const summary = await invoicesService.runBilling();
  return sendSuccess(res, summary, "Billing run completed");
};

export const listInvoices = async (req: Request, res: Response) => {
  const query = listInvoicesQuerySchema.parse(req.query);
  const result = await invoicesService.listInvoices(query);
  return sendSuccess(res, result, "Invoices retrieved");
};

export const getInvoice = async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const invoice = await invoicesService.getInvoice(id);
  return sendSuccess(res, invoice, "Invoice retrieved");
};

export const confirmInvoice = async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const invoice = await invoicesService.confirmInvoice(id);
  return sendSuccess(res, invoice, "Invoice confirmed");
};

export const cancelInvoice = async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const invoice = await invoicesService.cancelInvoice(id);
  return sendSuccess(res, invoice, "Invoice cancelled");
};
