import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { csrfProtection } from "../src/middleware/csrf";
import { AppError } from "../src/utils/app-error";

describe("CSRF Protection Middleware", () => {
  it("should allow GET requests without CSRF checks", () => {
    const req = { method: "GET", headers: {} } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("should reject POST requests missing X-Brightloop-Request header", () => {
    const req = {
      method: "POST",
      headers: { origin: "http://localhost:5173" },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = (next as unknown as { mock: { calls: [[AppError]] } }).mock.calls[0][0];
    expect(error.code).toBe("CSRF_HEADER_MISSING");
  });

  it("should reject POST requests missing Origin header", () => {
    const req = {
      method: "POST",
      headers: { "x-brightloop-request": "1" },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = (next as unknown as { mock: { calls: [[AppError]] } }).mock.calls[0][0];
    expect(error.code).toBe("CSRF_ORIGIN_MISSING");
  });

  it("should reject POST requests with mismatched Origin header", () => {
    const req = {
      method: "POST",
      headers: {
        "x-brightloop-request": "1",
        origin: "https://evil-attacker.com",
      },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = (next as unknown as { mock: { calls: [[AppError]] } }).mock.calls[0][0];
    expect(error.code).toBe("CSRF_ORIGIN_MISMATCH");
  });

  it("should allow POST requests with valid custom header and matching Origin", () => {
    const req = {
      method: "POST",
      headers: {
        "x-brightloop-request": "1",
        origin: "http://localhost:5173",
      },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });
});
