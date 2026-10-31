import { z } from "zod";

/**
 * Validates a tax percentage rate within the bounds of Prisma's @db.Decimal(5, 2).
 * Supports numbers and numeric strings.
 * - Non-negative (>= 0)
 * - Maximum value 999.99
 * - At most 2 decimal places (no silent rounding or truncation)
 */
export const taxRateSchema = z
  .union([z.number(), z.string()])
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return !isNaN(num) && isFinite(num);
    },
    { message: "Tax rate must be a valid finite number" },
  )
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return num >= 0;
    },
    { message: "Tax rate must be a non-negative amount" },
  )
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return num <= 999.99;
    },
    { message: "Tax rate cannot exceed 999.99%" },
  )
  .refine(
    (val) => {
      const str = typeof val === "string" ? val.trim() : val.toString();
      const parts = str.split(".");
      return parts.length < 2 || parts[1].length <= 2;
    },
    { message: "Tax rate cannot exceed 2 decimal places" },
  )
  .transform((val) => Number(typeof val === "string" ? parseFloat(val) : val));

export const listTaxesQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"], {
      errorMap: () => ({ message: "isActive filter must be 'true' or 'false'" }),
    })
    .transform((val) => val === "true")
    .optional(),
});

export const taxIdParamSchema = z.object({
  id: z.string().uuid("Invalid tax ID format"),
});

export const createTaxSchema = z.object({
  name: z.string().trim().min(1, "Tax name is required").max(255),
  rate: taxRateSchema,
  isActive: z
    .boolean({ invalid_type_error: "isActive must be a boolean" })
    .optional()
    .default(true),
});

export const updateTaxSchema = z
  .object({
    name: z.string().trim().min(1, "Tax name cannot be empty").max(255).optional(),
    rate: taxRateSchema.optional(),
    isActive: z
      .boolean({ invalid_type_error: "isActive must be a boolean" })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
