import { describe, it, expect, vi } from "vitest";
import request from "supertest";

let currentTestRole: "ADMIN" | "INTERNAL" | "CUSTOMER" = "ADMIN";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockImplementation(async () => ({
        id: "00000000-0000-0000-0000-000000000001",
        email: "t@x.io",
        role: currentTestRole,
        customerId: null,
        customer: null,
      })),
    },
  },
  default: {},
}));

import { app } from "../src/app";
import { signToken } from "../src/lib/jwt";

// Required by csrfProtection on state-changing routes
const browserHeaders = { Origin: "http://localhost:5173", "X-Brightloop-Request": "1" };

const tokenFor = (role: "ADMIN" | "INTERNAL" | "CUSTOMER") => {
  currentTestRole = role;
  return `Bearer ${signToken({ userId: "00000000-0000-0000-0000-000000000001", email: "t@x.io", role })}`;
};

describe("Billing module access control", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/v1/invoices");
    expect(res.status).toBe(401);
  });

  it("rejects invalid tokens", async () => {
    const res = await request(app)
      .get("/api/v1/dashboard/summary")
      .set("Authorization", "Bearer x");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("forbids customers from staff billing endpoints", async () => {
    for (const path of ["/api/v1/invoices", "/api/v1/payments", "/api/v1/dashboard/summary"]) {
      const res = await request(app).get(path).set("Authorization", tokenFor("CUSTOMER"));
      expect(res.status).toBe(403);
    }
  });

  it("allows only admins to run billing", async () => {
    const res = await request(app)
      .post("/api/v1/invoices/run-billing")
      .set(browserHeaders)
      .set("Authorization", tokenFor("INTERNAL"));
    expect(res.status).toBe(403);
  });

  it("rejects billing actions without CSRF headers", async () => {
    const res = await request(app)
      .post("/api/v1/invoices/run-billing")
      .set("Authorization", tokenFor("ADMIN"));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("CSRF_HEADER_MISSING");
  });

  it("validates invoice ids and payment input before touching the database", async () => {
    const badId = await request(app)
      .get("/api/v1/invoices/not-a-uuid")
      .set("Authorization", tokenFor("ADMIN"));
    expect(badId.status).toBe(400);

    const badAmount = await request(app)
      .post("/api/v1/invoices/00000000-0000-0000-0000-000000000002/payments")
      .set(browserHeaders)
      .set("Authorization", tokenFor("INTERNAL"))
      .send({ amount: "10.555", paymentMethod: "CASH" });
    expect(badAmount.status).toBe(400);
    expect(badAmount.body.code).toBe("VALIDATION_ERROR");
  });
});
