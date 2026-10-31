import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string,
) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(AppError.tooManyRequests(message, "RATE_LIMIT_EXCEEDED"));
    },
  });

export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000,
  env.NODE_ENV === "test" ? 10000 : 20,
  "Too many login or registration attempts. Please try again after 15 minutes.",
);

export const createGeneralRateLimiter = (max: number) =>
  createRateLimiter(
    1 * 60 * 1000,
    max,
    "Too many requests from this IP. Please try again shortly.",
  );

export const generalRateLimiter = createGeneralRateLimiter(
  env.NODE_ENV === "test" ? 10000 : 120,
);
