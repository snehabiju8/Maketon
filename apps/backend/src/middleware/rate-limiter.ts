import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "test" ? 10000 : 20, // 20 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      AppError.forbidden(
        "Too many login or registration attempts. Please try again after 15 minutes.",
        "RATE_LIMIT_EXCEEDED",
      ),
    );
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: env.NODE_ENV === "test" ? 10000 : 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      AppError.forbidden(
        "Too many requests from this IP. Please try again shortly.",
        "RATE_LIMIT_EXCEEDED",
      ),
    );
  },
});
