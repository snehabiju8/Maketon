import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../src/modules/auth/auth.service";
import { AuthRepository } from "../src/modules/auth/auth.repository";
import { AppError } from "../src/utils/app-error";
import { CustomerStatus, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

describe("AuthService (Business Logic with Mocks)", () => {
  let mockRepo: AuthRepository;
  let authService: AuthService;

  beforeEach(() => {
    mockRepo = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(),
      createCustomerAndUserTx: vi.fn(),
    } as unknown as AuthRepository;

    authService = new AuthService(mockRepo);
  });

  describe("register", () => {
    it("should reject registration if email is already in use", async () => {
      vi.spyOn(mockRepo, "findUserByEmail").mockResolvedValue({
        id: "existing-id",
        name: "Existing",
        email: "taken@example.com",
        passwordHash: "hash",
        role: Role.CUSTOMER,
        customerId: "cust-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
      });

      await expect(
        authService.register({
          name: "New User",
          email: "taken@example.com",
          password: "Password123!",
        }),
      ).rejects.toThrow(AppError);

      try {
        await authService.register({
          name: "New User",
          email: "taken@example.com",
          password: "Password123!",
        });
      } catch (err) {
        expect((err as AppError).code).toBe("EMAIL_ALREADY_EXISTS");
      }
    });

    it("should register customer and user atomically", async () => {
      vi.spyOn(mockRepo, "findUserByEmail").mockResolvedValue(null);
      vi.spyOn(mockRepo, "createCustomerAndUserTx").mockResolvedValue({
        user: {
          id: "u1",
          name: "Acme",
          email: "acme@example.com",
          passwordHash: "hashed",
          role: Role.CUSTOMER,
          customerId: "c1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        customer: {
          id: "c1",
          name: "Acme",
          email: "acme@example.com",
          phone: null,
          billingAddress: null,
          status: CustomerStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const result = await authService.register({
        name: "Acme",
        email: "acme@example.com",
        password: "Password123!",
      });

      expect(result.session.user.id).toBe("u1");
      expect(result.session.customer?.id).toBe("c1");
      expect(result.token).toBeDefined();
    });
  });

  describe("login", () => {
    it("should reject login if user is not found", async () => {
      vi.spyOn(mockRepo, "findUserByEmail").mockResolvedValue(null);

      await expect(
        authService.login({
          email: "unknown@example.com",
          password: "Password123!",
        }),
      ).rejects.toThrow(AppError);
    });

    it("should reject login if password does not match", async () => {
      const realHash = await hashPassword("RealPassword123!");
      vi.spyOn(mockRepo, "findUserByEmail").mockResolvedValue({
        id: "u1",
        name: "User",
        email: "user@example.com",
        passwordHash: realHash,
        role: Role.ADMIN,
        customerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
      });

      await expect(
        authService.login({
          email: "user@example.com",
          password: "WrongPassword123!",
        }),
      ).rejects.toThrow(AppError);
    });

    it("should reject login if linked customer is inactive", async () => {
      const realHash = await hashPassword("RealPassword123!");
      vi.spyOn(mockRepo, "findUserByEmail").mockResolvedValue({
        id: "u1",
        name: "User",
        email: "user@example.com",
        passwordHash: realHash,
        role: Role.CUSTOMER,
        customerId: "c1",
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: "c1",
          name: "User",
          email: "user@example.com",
          phone: null,
          billingAddress: null,
          status: CustomerStatus.INACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      try {
        await authService.login({
          email: "user@example.com",
          password: "RealPassword123!",
        });
      } catch (err) {
        expect((err as AppError).code).toBe("CUSTOMER_INACTIVE");
      }
    });

    it("should succeed login with valid credentials", async () => {
      const realHash = await hashPassword("RealPassword123!");
      vi.spyOn(mockRepo, "findUserByEmail").mockResolvedValue({
        id: "u1",
        name: "Admin User",
        email: "admin@example.com",
        passwordHash: realHash,
        role: Role.ADMIN,
        customerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: null,
      });

      const result = await authService.login({
        email: "admin@example.com",
        password: "RealPassword123!",
      });

      expect(result.user.id).toBe("u1");
      expect(result.token).toBeDefined();
    });
  });
});
