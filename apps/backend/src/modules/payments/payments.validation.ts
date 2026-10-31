import { PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { dateRangeSchema, paginationSchema } from "../invoices/invoices.validation";

const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export const invoiceIdParamSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice id"),
});

export const recordPaymentSchema = z.object({
  // Accept a string ("400.50") or number, then validate it as an exact 2-decimal amount.
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => MONEY_PATTERN.test(val), "Amount must be a number with up to 2 decimals")
    .refine((val) => Number(val) > 0, "Amount must be greater than zero"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  reference: z.string().trim().max(255).optional(),
  paidAt: z.coerce.date().optional(),
});

export const listPaymentsQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  ...dateRangeSchema,
  ...paginationSchema,
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
