import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

const normalizeUrl = (url: string): string => url.replace(/\/+$/, "");

export const csrfProtection = (req: Request, _res: Response, next: NextFunction): void => {
  // Only apply to state-changing HTTP methods
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // 1. Enforce custom header requirement
  const customHeader = req.headers["x-brightloop-request"];
  if (customHeader !== "1") {
    return next(
      AppError.forbidden(
        "CSRF verification failed: Missing or invalid X-Brightloop-Request header.",
        "CSRF_HEADER_MISSING",
      ),
    );
  }

  // 2. Enforce strict Origin verification
  const origin = req.headers.origin;
  if (!origin) {
    return next(
      AppError.forbidden(
        "CSRF verification failed: Origin header is required for state-changing requests.",
        "CSRF_ORIGIN_MISSING",
      ),
    );
  }

  if (normalizeUrl(origin) !== normalizeUrl(env.FRONTEND_URL)) {
    return next(
      AppError.forbidden(
        "CSRF verification failed: Origin does not match trusted frontend origin.",
        "CSRF_ORIGIN_MISMATCH",
      ),
    );
  }

  next();
};
