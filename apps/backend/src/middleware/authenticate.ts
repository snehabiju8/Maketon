import { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE_NAME } from "../lib/cookie";
import { JwtUserPayload, verifyToken } from "../lib/jwt";
import { AppError } from "../utils/app-error";

/**
 * Verifies the JWT from the HTTP-only auth cookie (or a Bearer header) and attaches req.user.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token: string | undefined = req.cookies?.[AUTH_COOKIE_NAME] ?? bearer;

  if (!token) {
    return next(AppError.unauthorized("Authentication required"));
  }

  try {
    req.user = verifyToken<JwtUserPayload>(token);
    next();
  } catch (error) {
    next(error);
  }
};
