import { InvoiceStatus } from "@prisma/client";
import { z } from "zod";
import { dateRangeSchema } from "../invoices/invoices.validation";

export const dashboardQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  ...dateRangeSchema,
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
