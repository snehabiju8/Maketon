import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { csrfProtection } from "../../middleware/csrf";
import { asyncHandler } from "../../utils/async-handler";
import * as paymentsController from "./payments.controller";

/** Mounted at /payments: payment history across invoices. */
export const paymentsRouter = Router();
paymentsRouter.use(authenticate, authorize("ADMIN", "INTERNAL"));
paymentsRouter.get("/", asyncHandler(paymentsController.listPayments));

/** Mounted at /invoices/:invoiceId/payments. */
export const invoicePaymentsRouter = Router({ mergeParams: true });
invoicePaymentsRouter.use(authenticate, authorize("ADMIN", "INTERNAL"));
invoicePaymentsRouter.get("/", asyncHandler(paymentsController.listInvoicePayments));
invoicePaymentsRouter.post("/", csrfProtection, asyncHandler(paymentsController.recordPayment));
