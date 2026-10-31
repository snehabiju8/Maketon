import { z } from "zod";

const monetaryPriceSchema = z
  .union([z.number(), z.string()])
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return !isNaN(num) && isFinite(num) && num >= 0;
    },
    { message: "Default price must be a finite, non-negative monetary amount" },
  )
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      const parts = num.toString().split(".");
      return parts.length < 2 || parts[1].length <= 2;
    },
    { message: "Default price cannot exceed 2 decimal places" },
  )
  .transform((val) => Number(typeof val === "string" ? parseFloat(val) : val));

export const listProductsQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(255),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, "Product name cannot be empty").max(255).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const productIdParamSchema = z.object({
  id: z.string().uuid("Invalid product ID format"),
});

export const productVariantsParamSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
});

export const variantIdParamSchema = z.object({
  id: z.string().uuid("Invalid variant ID format"),
});

export const listVariantsQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const createVariantSchema = z.object({
  name: z.string().trim().min(1, "Variant name is required").max(255),
  sku: z.string().trim().min(1).max(100).nullable().optional(),
  defaultPrice: monetaryPriceSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

export const updateVariantSchema = z
  .object({
    name: z.string().trim().min(1, "Variant name cannot be empty").max(255).optional(),
    sku: z.string().trim().min(1).max(100).nullable().optional(),
    defaultPrice: monetaryPriceSchema.optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
