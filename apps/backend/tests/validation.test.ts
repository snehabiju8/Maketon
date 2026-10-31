import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../src/modules/auth/auth.validation";
import { createStaffSchema } from "../src/modules/users/users.validation";
import { createCustomerSchema, updateCustomerSchema } from "../src/modules/customers/customers.validation";

describe("Module 1 Zod Validation Schemas", () => {
  describe("registerSchema", () => {
    it("should validate and normalize a proper customer registration body", async () => {
      const input = {
        body: {
          name: "Acme Corp",
          email: "  Billing@Acme.COM  ",
          password: "StrongPassword123!",
          phone: "+91 9988776655",
        },
      };

      const result = await registerSchema.parseAsync(input);
      expect(result.body.email).toBe("billing@acme.com");
      expect(result.body.name).toBe("Acme Corp");
    });

    it("should reject weak passwords", async () => {
      const input = {
        body: {
          name: "Acme Corp",
          email: "billing@acme.com",
          password: "short",
        },
      };

      await expect(registerSchema.parseAsync(input)).rejects.toThrow();
    });
  });

  describe("loginSchema", () => {
    it("should validate and normalize login body", async () => {
      const input = {
        body: {
          email: " USER@Example.Com ",
          password: "any-password",
        },
      };

      const result = await loginSchema.parseAsync(input);
      expect(result.body.email).toBe("user@example.com");
    });
  });

  describe("createStaffSchema", () => {
    it("should validate a valid staff creation body", async () => {
      const input = {
        body: {
          name: "Support Engineer",
          email: "staff@brightloop.com",
          password: "StaffPassword123!",
        },
      };

      const result = await createStaffSchema.parseAsync(input);
      expect(result.body.email).toBe("staff@brightloop.com");
    });
  });

  describe("createCustomerSchema & updateCustomerSchema", () => {
    it("should validate customer creation", async () => {
      const input = {
        body: {
          name: "Client Alpha",
          email: "client@alpha.com",
          phone: "+1 555 1234",
        },
      };

      const result = await createCustomerSchema.parseAsync(input);
      expect(result.body.name).toBe("Client Alpha");
    });

    it("should validate customer update", async () => {
      const input = {
        params: {
          id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        },
        body: {
          name: "Client Alpha Inc",
          billingAddress: "New Headquarters",
        },
      };

      const result = await updateCustomerSchema.parseAsync(input);
      expect(result.body.name).toBe("Client Alpha Inc");
      expect(result.params.id).toBe("3fa85f64-5717-4562-b3fc-2c963f66afa6");
    });

    it("should reject non-UUID customer id in params", async () => {
      const input = {
        params: {
          id: "invalid-uuid-123",
        },
        body: {
          name: "Test",
        },
      };

      await expect(updateCustomerSchema.parseAsync(input)).rejects.toThrow();
    });
  });
});
