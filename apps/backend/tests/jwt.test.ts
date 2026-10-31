import { describe, it, expect } from "vitest";
import { signToken, verifyToken, JwtUserPayload } from "../src/lib/jwt";
import { AppError } from "../src/utils/app-error";

describe("JWT Utilities", () => {
  it("should sign a token and verify its payload", () => {
    const payload: JwtUserPayload = {
      userId: "user-123",
      email: "test@example.com",
      role: "CUSTOMER",
      customerId: "cust-456",
    };

    const token = signToken(payload);
    expect(typeof token).toBe("string");

    const decoded = verifyToken<JwtUserPayload>(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.customerId).toBe(payload.customerId);
  });

  it("should throw AppError on invalid token", () => {
    expect(() => verifyToken("invalid.token.string")).toThrow(AppError);
  });
});
