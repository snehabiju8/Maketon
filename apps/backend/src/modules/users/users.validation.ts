import { z } from "zod";
import { validatePasswordStrength } from "../../lib/password";

export const createStaffSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: z
      .string()
      .min(9, "Password must be at least 9 characters")
      .refine(
        validatePasswordStrength,
        "Password must contain at least one uppercase letter, one lowercase letter, and one special character",
      ),
  }),
});

export const staffQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
  }),
});
