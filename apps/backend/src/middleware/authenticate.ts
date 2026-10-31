import { Request, Response, NextFunction } from "express";
import { CustomerStatus } from "@prisma/client";
import { verifyToken, JwtUserPayload } from "../lib/jwt";
import { AUTH_COOKIE_NAME } from "../lib/cookie";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Extract token from HTTP-only cookie or Authorization header fallback
    let token: string | undefined = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw AppError.unauthorized(
        "Authentication required. No session token found.",
        "UNAUTHENTICATED",
      );
    }

    // 2. Cryptographic verification of JWT
    const decoded = verifyToken<JwtUserPayload>(token);

    // 3. Live database lookup to verify account validity and current role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { customer: true },
    });

    if (!user) {
      throw AppError.unauthorized("User account no longer exists.", "USER_NOT_FOUND");
    }

    // 4. Inactivity check for customer accounts
    if (user.role === "CUSTOMER" && user.customer?.status === CustomerStatus.INACTIVE) {
      throw AppError.forbidden(
        "Your customer account is currently inactive. Please contact support.",
        "CUSTOMER_INACTIVE",
      );
    }

    // 5. Attach fresh, authoritative identity from database to request context
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
    };

    next();
  } catch (error) {
    next(error);
  }
};
