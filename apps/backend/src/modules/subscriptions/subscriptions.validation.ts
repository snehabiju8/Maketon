import { z } from "zod";
import { SubscriptionStatus } from "@prisma/client";

export const subscriptionLineItemInputSchema = z.object({
  variantId: z.string().uuid("Invalid product variant ID"),
  quantity: z
    .number({ required_error: "Quantity is required" })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
  customUnitPrice: z
    .union([z.number().min(0), z.string().regex(/^\d+(\.\d{1,2})?$/)])
    .optional(),
});

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  planId: z.string().uuid("Invalid subscription plan ID"),
  startDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .optional(),
  expiryDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .nullable()
    .optional(),
  paymentTermsDays: z
    .number()
    .int()
    .min(0, "Payment terms cannot be negative")
    .max(180, "Payment terms cannot exceed 180 days")
    .default(15),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").default("INR"),
  taxId: z.string().uuid("Invalid tax ID").nullable().optional(),
  discountId: z.string().uuid("Invalid discount ID").nullable().optional(),
  lines: z
    .array(subscriptionLineItemInputSchema)
    .min(1, "Subscription must have at least one product line item"),
});

export const updateSubscriptionSchema = z.object({
  planId: z.string().uuid("Invalid subscription plan ID").optional(),
  startDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .optional(),
  expiryDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .or(z.date())
    .nullable()
    .optional(),
  paymentTermsDays: z
    .number()
    .int()
    .min(0)
    .max(180)
    .optional(),
  currency: z.string().length(3).optional(),
  taxId: z.string().uuid().nullable().optional(),
  discountId: z.string().uuid().nullable().optional(),
  lines: z.array(subscriptionLineItemInputSchema).min(1).optional(),
});

export const closeSubscriptionSchema = z.object({
  reason: z.string().max(500, "Reason must not exceed 500 characters").optional(),
});

export const subscriptionQuerySchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  customerId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const calculatePricingSchema = z.object({
  lines: z
    .array(
      z.object({
        unitPrice: z.union([z.number().min(0), z.string()]),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "At least one line item is required for pricing preview"),
  taxRate: z.union([z.number().min(0), z.string()]).nullable().optional(),
  discountPercentage: z.union([z.number().min(0).max(100), z.string()]).nullable().optional(),
});

