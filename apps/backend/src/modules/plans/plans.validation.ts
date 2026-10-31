import { z } from "zod";

export const listPlansQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"], {
    errorMap: () => ({ message: "Status filter must be either ACTIVE or INACTIVE" }),
  }).optional(),
});

export const planIdParamSchema = z.object({
  id: z.string().uuid("Invalid plan ID format"),
});

export const createPlanSchema = z.object({
  name: z.string().trim().min(1, "Plan name is required").max(255),
  billingInterval: z.enum(["DAY", "WEEK", "MONTH", "YEAR"], {
    errorMap: () => ({
      message: "Billing interval must be one of: DAY, WEEK, MONTH, YEAR",
    }),
  }),
  intervalCount: z
    .number({ invalid_type_error: "Interval count must be a number" })
    .int("Interval count must be an integer")
    .min(1, "Interval count must be a positive integer")
    .optional()
    .default(1),
  minimumQuantity: z
    .number({ invalid_type_error: "Minimum quantity must be a number" })
    .int("Minimum quantity must be an integer")
    .min(1, "Minimum quantity must be a positive integer")
    .optional()
    .default(1),
  status: z
    .enum(["ACTIVE", "INACTIVE"], {
      errorMap: () => ({ message: "Status must be either ACTIVE or INACTIVE" }),
    })
    .optional()
    .default("ACTIVE"),
});

export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(1, "Plan name cannot be empty").max(255).optional(),
    billingInterval: z
      .enum(["DAY", "WEEK", "MONTH", "YEAR"], {
        errorMap: () => ({
          message: "Billing interval must be one of: DAY, WEEK, MONTH, YEAR",
        }),
      })
      .optional(),
    intervalCount: z
      .number({ invalid_type_error: "Interval count must be a number" })
      .int("Interval count must be an integer")
      .min(1, "Interval count must be a positive integer")
      .optional(),
    minimumQuantity: z
      .number({ invalid_type_error: "Minimum quantity must be a number" })
      .int("Minimum quantity must be an integer")
      .min(1, "Minimum quantity must be a positive integer")
      .optional(),
    status: z
      .enum(["ACTIVE", "INACTIVE"], {
        errorMap: () => ({ message: "Status must be either ACTIVE or INACTIVE" }),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
