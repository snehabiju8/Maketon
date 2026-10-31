import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, validatePasswordStrength } from "../src/lib/password";

describe("Password Utilities", () => {
  describe("validatePasswordStrength (PRD FR-A3)", () => {
    it("should accept valid passwords satisfying all rules", () => {
      expect(validatePasswordStrength("Password123!")).toBe(true);
      expect(validatePasswordStrength("Complex@2026")).toBe(true);
      expect(validatePasswordStrength("Bright#Loop9")).toBe(true);
    });

    it("should reject passwords with fewer than 9 characters", () => {
      expect(validatePasswordStrength("Pass12!")).toBe(false);
      expect(validatePasswordStrength("Aa1!")).toBe(false);
    });

    it("should reject passwords missing uppercase letters", () => {
      expect(validatePasswordStrength("password123!")).toBe(false);
    });

    it("should reject passwords missing lowercase letters", () => {
      expect(validatePasswordStrength("PASSWORD123!")).toBe(false);
    });

    it("should reject passwords missing special characters", () => {
      expect(validatePasswordStrength("Password123")).toBe(false);
    });
  });

  describe("hashPassword & comparePassword", () => {
    it("should hash a password and correctly verify matches", async () => {
      const raw = "SuperSecret123!";
      const hash = await hashPassword(raw);

      expect(hash).not.toBe(raw);
      expect(hash.startsWith("$2b$")).toBe(true);

      const matches = await comparePassword(raw, hash);
      expect(matches).toBe(true);

      const wrongMatches = await comparePassword("WrongPassword123!", hash);
      expect(wrongMatches).toBe(false);
    });
  });
});
