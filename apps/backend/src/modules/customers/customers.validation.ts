import { z } from "zod";
import { CustomerStatus } from "@prisma/client";

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    phone: z.string().trim().max(20).optional(),
    billingAddress: z.string().trim().max(500).optional(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid customer ID format"),
  }),
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
    phone: z.string().trim().max(20).optional(),
    billingAddress: z.string().trim().max(500).optional(),
    status: z.nativeEnum(CustomerStatus).optional(),
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid customer ID format"),
  }),
});

export const customerQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: z.nativeEnum(CustomerStatus).optional(),
  }),
});
