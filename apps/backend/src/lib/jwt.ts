import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "INTERNAL" | "CUSTOMER";
  customerId?: string | null;
}

export const signToken = (
  payload: JwtUserPayload,
  options?: SignOptions,
): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions["expiresIn"],
    ...options,
  });
};

export const verifyToken = <T extends object = JwtUserPayload>(token: string): T => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as T;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized("Authentication token has expired", "TOKEN_EXPIRED");
    }
    throw AppError.unauthorized("Invalid authentication token", "INVALID_TOKEN");
  }
};
