import { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response";
import { AppError } from "../../utils/app-error";
import * as paymentsService from "./payments.service";
import {
  invoiceIdParamSchema,
  listPaymentsQuerySchema,
  recordPaymentSchema,
} from "./payments.validation";

export const recordPayment = async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized("Authentication required");
  const { invoiceId } = invoiceIdParamSchema.parse(req.params);
  const input = recordPaymentSchema.parse(req.body);
  const result = await paymentsService.recordPayment(invoiceId, input, req.user.userId);
  return sendSuccess(res, result, "Payment recorded", 201);
};

export const listInvoicePayments = async (req: Request, res: Response) => {
  const { invoiceId } = invoiceIdParamSchema.parse(req.params);
  const payments = await paymentsService.listInvoicePayments(invoiceId);
  return sendSuccess(res, payments, "Payments retrieved");
};

export const listPayments = async (req: Request, res: Response) => {
  const query = listPaymentsQuerySchema.parse(req.query);
  const result = await paymentsService.listPayments(query);
  return sendSuccess(res, result, "Payments retrieved");
};
