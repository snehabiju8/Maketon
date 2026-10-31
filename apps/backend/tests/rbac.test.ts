import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { authorize, assertCustomerAccess } from "../src/middleware/authorize";
import { AppError } from "../src/utils/app-error";

describe("RBAC & Customer Data Isolation", () => {
  describe("authorize middleware", () => {
    it("should allow request when user has permitted role", () => {
      const req = {
        user: { userId: "1", email: "admin@test.com", role: Role.ADMIN, customerId: null },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      authorize(Role.ADMIN, Role.INTERNAL)(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject request when user has forbidden role", () => {
      const req = {
        user: { userId: "2", email: "cust@test.com", role: Role.CUSTOMER, customerId: "c1" },
      } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      authorize(Role.ADMIN)(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = (next as unknown as { mock: { calls: [[AppError]] } }).mock.calls[0][0];
      expect(error.code).toBe("FORBIDDEN");
    });
  });

  describe("assertCustomerAccess helper", () => {
    it("should permit ADMIN and INTERNAL to access any customer ID", () => {
      expect(() =>
        assertCustomerAccess(
          { userId: "1", email: "admin@test.com", role: Role.ADMIN, customerId: null },
          "any-cust-id",
        ),
      ).not.toThrow();

      expect(() =>
        assertCustomerAccess(
          { userId: "2", email: "staff@test.com", role: Role.INTERNAL, customerId: null },
          "any-cust-id",
        ),
      ).not.toThrow();
    });

    it("should permit CUSTOMER to access their own customer ID", () => {
      expect(() =>
        assertCustomerAccess(
          { userId: "3", email: "cust@test.com", role: Role.CUSTOMER, customerId: "cust-123" },
          "cust-123",
        ),
      ).not.toThrow();
    });

    it("should reject CUSTOMER attempting to access another customer's ID", () => {
      expect(() =>
        assertCustomerAccess(
          { userId: "3", email: "cust@test.com", role: Role.CUSTOMER, customerId: "cust-123" },
          "other-cust-456",
        ),
      ).toThrow(AppError);

      try {
        assertCustomerAccess(
          { userId: "3", email: "cust@test.com", role: Role.CUSTOMER, customerId: "cust-123" },
          "other-cust-456",
        );
      } catch (err) {
        expect((err as AppError).code).toBe("UNAUTHORIZED_CUSTOMER_ACCESS");
      }
    });
  });
});
