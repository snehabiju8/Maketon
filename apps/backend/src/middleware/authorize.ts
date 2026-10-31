import { Request, Response, NextFunction } from "express";
import { JwtUserPayload } from "../lib/jwt";
import { AppError } from "../utils/app-error";

type Role = JwtUserPayload["role"];

/**
 * Allows the request only if the authenticated user has one of the given roles.
 * Must be used after `authenticate`.
 */
export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized("Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
