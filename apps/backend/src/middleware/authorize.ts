import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../utils/app-error";
import { AuthenticatedUser } from "../types/express";

/**
 * Role-Based Access Control (RBAC) middleware
 * Enforces that req.user.role matches at least one of the allowed roles.
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized("Authentication required", "UNAUTHENTICATED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access denied. Requires one of roles: [${allowedRoles.join(", ")}].`,
          "FORBIDDEN",
        ),
      );
    }

    next();
  };
};

/**
 * Customer Tenant Isolation Assertion
 * For CUSTOMER role, targetCustomerId must strictly match req.user.customerId.
 * ADMIN and INTERNAL roles bypass this check.
 */
export const assertCustomerAccess = (
  user: AuthenticatedUser | undefined,
  targetCustomerId: string,
): void => {
  if (!user) {
    throw AppError.unauthorized("Authentication required", "UNAUTHENTICATED");
  }

  // Admin and Internal staff can access any customer record
  if (user.role === Role.ADMIN || user.role === Role.INTERNAL) {
    return;
  }

  // Customer users can ONLY access their own customer profile
  if (user.role === Role.CUSTOMER) {
    if (!user.customerId || user.customerId !== targetCustomerId) {
      throw AppError.forbidden(
        "Access denied. You can only access your own customer account.",
        "UNAUTHORIZED_CUSTOMER_ACCESS",
      );
    }
  }
};
