import { CustomerStatus, Prisma } from "@prisma/client";
import { authRepository, AuthRepository } from "./auth.repository";
import { RegisterCustomerInput, LoginInput, AuthSessionResponse, AuthUserResponse } from "./auth.types";
import { hashPassword, comparePassword } from "../../lib/password";
import { signToken } from "../../lib/jwt";
import { AppError } from "../../utils/app-error";

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  /**
   * Register a new Customer with linked User account atomically
   */
  async register(
    input: RegisterCustomerInput,
  ): Promise<{ session: AuthSessionResponse; token: string }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check for existing user email
    const existingUser = await this.repo.findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw AppError.conflict(
        "An account with this email address already exists.",
        "EMAIL_ALREADY_EXISTS",
      );
    }

    // Hash password securely
    const passwordHash = await hashPassword(input.password);

    try {
      const { user, customer } = await this.repo.createCustomerAndUserTx(
        { ...input, email: normalizedEmail },
        passwordHash,
      );

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
      });

      return {
        session: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            customerId: user.customerId,
          },
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            billingAddress: customer.billingAddress,
            status: customer.status,
          },
        },
        token,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw AppError.conflict(
          "An account with this email address already exists.",
          "EMAIL_ALREADY_EXISTS",
        );
      }
      throw error;
    }
  }

  /**
   * Authenticate a user with email and password
   */
  async login(input: LoginInput): Promise<{ user: AuthUserResponse; token: string }> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await this.repo.findUserByEmail(normalizedEmail);
    if (!user) {
      throw AppError.unauthorized("Invalid email or password.", "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid email or password.", "INVALID_CREDENTIALS");
    }

    if (user.role === "CUSTOMER" && user.customer?.status === CustomerStatus.INACTIVE) {
      throw AppError.forbidden(
        "Your customer account is currently inactive. Please contact support.",
        "CUSTOMER_INACTIVE",
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
      },
      token,
    };
  }

  /**
   * Get fresh session profile for authenticated user
   */
  async getSessionProfile(userId: string): Promise<AuthSessionResponse> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw AppError.unauthorized("User account no longer exists.", "USER_NOT_FOUND");
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
      },
      customer: user.customer
        ? {
            id: user.customer.id,
            name: user.customer.name,
            email: user.customer.email,
            phone: user.customer.phone,
            billingAddress: user.customer.billingAddress,
            status: user.customer.status,
          }
        : null,
    };
  }
}

export const authService = new AuthService();
