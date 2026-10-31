import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/app-error";
import { sendError } from "../utils/api-response";
import { logger } from "../lib/logger";
import { env } from "../config/env";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  // 1. Handled Operational Application Errors
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, `Non-operational AppError: ${err.message}`);
    }
    return sendError(res, err.message, err.statusCode, err.code);
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.flatten();
    return sendError(
      res,
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      formattedErrors.fieldErrors,
    );
  }

  // 3. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "resource";
      return sendError(
        res,
        `A record with this ${target} already exists.`,
        409,
        "CONFLICT",
      );
    }

    // P2025: Record to update/delete not found
    if (err.code === "P2025") {
      return sendError(res, "Resource not found.", 404, "NOT_FOUND");
    }

    // P2003: Foreign key constraint failed
    if (err.code === "P2003") {
      return sendError(res, "Invalid reference to related entity.", 400, "FOREIGN_KEY_VIOLATION");
    }

    logger.error({ err, code: err.code }, `Prisma error: ${err.message}`);
    return sendError(res, "Database operation failed.", 500, "DATABASE_ERROR");
  }

  // 4. Unexpected / Unhandled Errors
  logger.error({ err }, `Unhandled exception: ${err.message}`);

  const message =
    env.NODE_ENV === "production" ? "Internal server error" : err.message || "Internal server error";

  return sendError(res, message, 500, "INTERNAL_SERVER_ERROR");
};
