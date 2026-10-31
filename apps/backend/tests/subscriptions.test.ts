import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { signToken } from "../src/lib/jwt";
import { app } from "../src/app";
import { subscriptionRepository } from "../src/modules/subscriptions/subscriptions.repository";
import {
  DEV_FIXTURE_CUSTOMERS,
  DEV_FIXTURE_PLANS,
  DEV_FIXTURE_VARIANTS,
  DEV_FIXTURE_TAXES,
  DEV_FIXTURE_DISCOUNTS,
} from "../src/modules/subscriptions/subscriptions.fixtures";

const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";
const CUSTOMER_USER_ID = "00000000-0000-0000-0000-000000000002";
const unavailableDatabaseError = () =>
  Object.assign(new Error("Can't reach database server"), { code: "P1001" });

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === CUSTOMER_USER_ID
          ? {
              id: CUSTOMER_USER_ID,
              email: "customer@example.com",
              role: "CUSTOMER",
              customerId: DEV_FIXTURE_CUSTOMERS[0].id,
              customer: { status: "ACTIVE" },
            }
          : {
              id: ADMIN_USER_ID,
              email: "admin@example.com",
              role: "ADMIN",
              customerId: null,
              customer: null,
            },
      ),
    },
    customer: {
      findUnique: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
      findMany: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
    },
    plan: {
      findUnique: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
      findMany: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
    },
    productVariant: {
      findUnique: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
      findMany: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
    },
    tax: {
      findUnique: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
      findMany: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
    },
    discount: {
      findUnique: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
      findMany: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
    },
    subscription: {
      count: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
      findUnique: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
      findMany: vi.fn(async () => {
        throw unavailableDatabaseError();
      }),
    },
  },
}));

const adminToken = () =>
  signToken({
    userId: ADMIN_USER_ID,
    email: "admin@example.com",
    role: "ADMIN",
    customerId: null,
  });

const customerToken = () =>
  signToken({
    userId: CUSTOMER_USER_ID,
    email: "customer@example.com",
    role: "CUSTOMER",
    customerId: DEV_FIXTURE_CUSTOMERS[0].id,
  });

const authenticatedHeaders = (token: string, csrf = false) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (csrf) {
    headers["X-Brightloop-Request"] = "1";
    headers.Origin = "http://localhost:5173";
  }
  return headers;
};

describe("Subscription Management & Pricing API", () => {
  const customer = DEV_FIXTURE_CUSTOMERS[0];
  const plan = DEV_FIXTURE_PLANS[0]; // Min qty 1
  const highQtyPlan = DEV_FIXTURE_PLANS[2]; // Min qty 5
  const variant1 = DEV_FIXTURE_VARIANTS[0]; // 2500.00
  const variant2 = DEV_FIXTURE_VARIANTS[1]; // 2680.00
  const tax = DEV_FIXTURE_TAXES[0]; // 18%
  const discount = DEV_FIXTURE_DISCOUNTS[0]; // 10%

  it("should retrieve catalog preview for subscription creation", async () => {
    const res = await request(app)
      .get("/api/v1/subscriptions/catalog-preview")
      .set(authenticatedHeaders(adminToken()));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customers.length).toBeGreaterThan(0);
    expect(res.body.data.plans.length).toBeGreaterThan(0);
    expect(res.body.data.variants.length).toBeGreaterThan(0);
  });

  it("should calculate pricing preview correctly with exact decimal arithmetic", async () => {
    const payload = {
      lines: [
        { unitPrice: "2500.00", quantity: 2 }, // 5000.00
        { unitPrice: "2680.00", quantity: 1 }, // 2680.00
      ],
      taxRate: "18.00",
      discountPercentage: "10.00",
    };

    const res = await request(app)
      .post("/api/v1/subscriptions/calculate-pricing")
      .set(authenticatedHeaders(adminToken(), true))
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Subtotal = 5000 + 2680 = 7680.00
    // Discount 10% = 768.00
    // Taxable = 7680 - 768 = 6912.00
    // Tax 18% = 6912 * 0.18 = 1244.16
    // Total = 6912 + 1244.16 = 8156.16
    expect(res.body.data).toEqual({
      subtotal: "7680.00",
      discountPercentage: "10.00",
      discountAmount: "768.00",
      taxableAmount: "6912.00",
      taxRateSnapshot: "18.00",
      taxAmount: "1244.16",
      recurringTotal: "8156.16",
    });
  });

  it("should create a subscription in DRAFT status with price snapshots and unique number", async () => {
    const payload = {
      customerId: customer.id,
      planId: plan.id,
      taxId: tax.id,
      discountId: discount.id,
      lines: [
        {
          variantId: variant1.id,
          quantity: 2,
          customUnitPrice: 2400.0, // Custom agreed price snapshot
        },
        {
          variantId: variant2.id,
          quantity: 1,
        },
      ],
    };

    const res = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const sub = res.body.data;
    expect(sub.id).toBeDefined();
    expect(sub.subscriptionNumber).toMatch(/^SUB-\d{6}-\d{4}$/);
    expect(sub.status).toBe("DRAFT");
    expect(sub.lines.length).toBe(2);

    // Verify agreed price snapshot was preserved
    const line1 = sub.lines.find((l: any) => l.variantId === variant1.id);
    expect(line1.unitPrice).toBe("2400.00");
    expect(line1.quantity).toBe(2);
    expect(line1.lineGross).toBe("4800.00");

    // Verify default price used when custom price not specified
    const line2 = sub.lines.find((l: any) => l.variantId === variant2.id);
    expect(line2.unitPrice).toBe("2680.00");
    expect(line2.quantity).toBe(1);

    // Verify pricing breakdown
    expect(sub.pricing.subtotal).toBe("7480.00");
    expect(sub.pricing.discountAmount).toBe("748.00");
    expect(sub.pricing.taxRateSnapshot).toBe("18.00");
  });

  it("should reject subscription creation when plan minimum quantity is not satisfied", async () => {
    const payload = {
      customerId: customer.id,
      planId: highQtyPlan.id, // requires minimum 5 units
      lines: [
        {
          variantId: variant1.id,
          quantity: 2, // only 2 < 5
        },
      ],
    };

    const res = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("plan minimum quantity");
  });

  it("should reject subscription creation with invalid quantity or missing lines", async () => {
    const payload = {
      customerId: customer.id,
      planId: plan.id,
      lines: [],
    };

    const res = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should execute valid lifecycle transitions: DRAFT -> CONFIRMED -> ACTIVE -> CLOSED", async () => {
    // 1. Create DRAFT
    const createRes = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send({
        customerId: customer.id,
        planId: plan.id,
        lines: [{ variantId: variant1.id, quantity: 1 }],
      });
    expect(createRes.status).toBe(201);
    const subId = createRes.body.data.id;

    // 2. Confirm: DRAFT -> CONFIRMED
    const confirmRes = await request(app).post(
      `/api/v1/subscriptions/${subId}/confirm`,
    ).set(authenticatedHeaders(adminToken(), true));
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe("CONFIRMED");

    // 3. Activate: CONFIRMED -> ACTIVE
    const activateRes = await request(app).post(
      `/api/v1/subscriptions/${subId}/activate`,
    ).set(authenticatedHeaders(adminToken(), true));
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.status).toBe("ACTIVE");
    expect(activateRes.body.data.nextBillingDate).toBeDefined();

    // 4. Close: ACTIVE -> CLOSED
    const closeRes = await request(app)
      .post(`/api/v1/subscriptions/${subId}/close`)
      .set(authenticatedHeaders(adminToken(), true))
      .send({ reason: "Customer requested upgrade to enterprise" });
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe("CLOSED");

    // 5. Verify event history
    const eventsRes = await request(app).get(
      `/api/v1/subscriptions/${subId}/events`,
    ).set(authenticatedHeaders(adminToken()));
    expect(eventsRes.status).toBe(200);
    const eventTypes = eventsRes.body.data.map((e: any) => e.eventType);
    expect(eventTypes).toContain("SUBSCRIPTION_CREATED");
    expect(eventTypes).toContain("SUBSCRIPTION_CONFIRMED");
    expect(eventTypes).toContain("SUBSCRIPTION_ACTIVATED");
    expect(eventTypes).toContain("SUBSCRIPTION_CLOSED");
  });

  it("should reject invalid lifecycle transitions with 409 Conflict", async () => {
    // Create DRAFT
    const createRes = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send({
        customerId: customer.id,
        planId: plan.id,
        lines: [{ variantId: variant1.id, quantity: 1 }],
      });
    const subId = createRes.body.data.id;

    // Direct DRAFT -> ACTIVE is invalid!
    const directActivateRes = await request(app).post(
      `/api/v1/subscriptions/${subId}/activate`,
    ).set(authenticatedHeaders(adminToken(), true));
    expect(directActivateRes.status).toBe(409);
    expect(directActivateRes.body.code).toBe("INVALID_STATUS_TRANSITION");

    // Close the draft
    await request(app)
      .post(`/api/v1/subscriptions/${subId}/close`)
      .set(authenticatedHeaders(adminToken(), true));

    // Cannot activate a CLOSED subscription
    const activateClosedRes = await request(app).post(
      `/api/v1/subscriptions/${subId}/activate`,
    ).set(authenticatedHeaders(adminToken(), true));
    expect(activateClosedRes.status).toBe(409);
    expect(activateClosedRes.body.code).toBe("INVALID_STATUS_TRANSITION");
  });

  it("should list subscriptions with pagination and status filters", async () => {
    const listRes = await request(app)
      .get("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken()))
      .query({ page: 1, limit: 10 });

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data.subscriptions)).toBe(true);
    expect(listRes.body.data.pagination).toBeDefined();
    expect(listRes.body.data.pagination.page).toBe(1);
  });

  it("should provide due subscriptions for Member 4 billing integration", async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app)
      .get("/api/v1/subscriptions/for-billing")
      .set(authenticatedHeaders(adminToken()))
      .query({ dueBefore: tomorrow });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should reject unauthenticated and customer requests", async () => {
    const unauthenticated = await request(app).get("/api/v1/subscriptions");
    expect(unauthenticated.status).toBe(401);

    const customer = await request(app)
      .get("/api/v1/subscriptions")
      .set(authenticatedHeaders(customerToken()));
    expect(customer.status).toBe(403);
  });

  it("should reject invalid customer, plan, and variant references", async () => {
    const invalidCustomer = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send({
        customerId: "00000000-0000-0000-0000-000000000099",
        planId: plan.id,
        lines: [{ variantId: variant1.id, quantity: 1 }],
      });
    expect(invalidCustomer.status).toBe(404);

    const invalidPlan = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send({
        customerId: customer.id,
        planId: "00000000-0000-0000-0000-000000000099",
        lines: [{ variantId: variant1.id, quantity: 1 }],
      });
    expect(invalidPlan.status).toBe(404);

    const invalidVariant = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send({
        customerId: customer.id,
        planId: plan.id,
        lines: [{ variantId: "00000000-0000-0000-0000-000000000099", quantity: 1 }],
      });
    expect(invalidVariant.status).toBe(404);
  });

  it("should reject inactive plans and variants", async () => {
    const inactivePlan = vi
      .spyOn(subscriptionRepository, "findPlanById")
      .mockResolvedValue({ ...plan, status: "INACTIVE" });

    const planResponse = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send({
        customerId: customer.id,
        planId: plan.id,
        lines: [{ variantId: variant1.id, quantity: 1 }],
      });
    expect(planResponse.status).toBe(400);
    expect(planResponse.body.message).toContain("Inactive subscription plans");
    inactivePlan.mockRestore();

    const inactiveVariant = vi
      .spyOn(subscriptionRepository, "findVariantById")
      .mockResolvedValue({ ...variant1, status: "INACTIVE" });

    const variantResponse = await request(app)
      .post("/api/v1/subscriptions")
      .set(authenticatedHeaders(adminToken(), true))
      .send({
        customerId: customer.id,
        planId: plan.id,
        lines: [{ variantId: variant1.id, quantity: 1 }],
      });
    expect(variantResponse.status).toBe(400);
    expect(variantResponse.body.message).toContain("Inactive products");
    inactiveVariant.mockRestore();
  });
});
