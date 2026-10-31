import { z } from "zod";
import { validatePasswordStrength } from "../../lib/password";

export const registerSchema = z.object({
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
    phone: z.string().trim().max(20).optional(),
    billingAddress: z.string().trim().max(500).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: z.string().min(1, "Password is required"),
  }),
});
