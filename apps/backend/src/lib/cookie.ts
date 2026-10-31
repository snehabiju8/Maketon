import { CookieOptions } from "express";
import { env } from "../config/env";

export const AUTH_COOKIE_NAME = "brightloop_token";

export const getAuthCookieOptions = (): CookieOptions => {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction || env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    path: "/",
  };
};

export const getLogoutCookieOptions = (): CookieOptions => {
  return {
    ...getAuthCookieOptions(),
    maxAge: 0,
  };
};
