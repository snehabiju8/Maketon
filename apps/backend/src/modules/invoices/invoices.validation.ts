import { InvoiceStatus } from "@prisma/client";
import { z } from "zod";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Accepts an ISO date or date-time. A date-only `to` value includes the whole day. */
export const dateRangeSchema = {
  from: z.coerce.date().optional(),
  to: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined;
      const date = new Date(DATE_ONLY.test(val) ? `${val}T00:00:00.000Z` : val);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.invalid_date, message: "Invalid date" });
        return z.NEVER;
      }
      return DATE_ONLY.test(val) ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : date;
    }),
};

export const paginationSchema = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid invoice id"),
});

export const listInvoicesQuerySchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  customerId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  ...dateRangeSchema,
  ...paginationSchema,
});

export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
