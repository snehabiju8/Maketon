import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockPrisma = vi.hoisted(() => ({
  // authenticate() re-reads the user; the role is encoded in the last digit of the test user id
  user: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      email: "user@test.io",
      role: ({ "1": "ADMIN", "2": "INTERNAL", "3": "CUSTOMER" } as const)[where.id.slice(-1) as "1" | "2" | "3"],
      customerId: null,
      customer: null,
    })),
  },
  plan: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $queryRaw: vi.fn(),
}));

vi.mock("../src/lib/prisma", () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

import { app } from "../src/app";
import { signToken } from "../src/lib/jwt";

const tokenFor = (role: "ADMIN" | "INTERNAL" | "CUSTOMER") =>
  signToken({
    userId: `00000000-0000-0000-0000-00000000000${{ ADMIN: 1, INTERNAL: 2, CUSTOMER: 3 }[role]}`,
    email: "user@test.io",
    role,
  });
// Catalog routes require authentication; writes also require ADMIN and the CSRF headers.
const authHeaders = (role: "ADMIN" | "INTERNAL" | "CUSTOMER" = "ADMIN") => ({
  Authorization: `Bearer ${tokenFor(role)}`,
  Origin: "http://localhost:5173",
  "X-Brightloop-Request": "1",
});
const api = () => request.agent(app).set(authHeaders());

describe("plans access control", () => {
  it("requires authentication", async () => {
    expect((await request(app).get("/api/v1/plans")).status).toBe(401);
  });
  it("lets staff read but not write, and forbids customers", async () => {
    expect((await request(app).get("/api/v1/plans").set(authHeaders("CUSTOMER"))).status).toBe(403);
    const write = await request(app).post("/api/v1/plans").set(authHeaders("INTERNAL")).send({});
    expect(write.status).toBe(403);
  });
});


describe("Plans Module (Mocked Database)", () => {
  const validPlanId = "a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/plans", () => {
    it("should return a list of plans with 200", async () => {
      const mockPlans = [
        {
          id: validPlanId,
          name: "Monthly Pro",
          billingInterval: "MONTH",
          intervalCount: 1,
          minimumQuantity: 1,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      mockPrisma.plan.findMany.mockResolvedValue(mockPlans);

      const res = await api().get("/api/v1/plans");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Monthly Pro");
      expect(mockPrisma.plan.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
      });
    });

    it("should filter by status query parameter", async () => {
      mockPrisma.plan.findMany.mockResolvedValue([]);

      const res = await api().get("/api/v1/plans?status=INACTIVE");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.plan.findMany).toHaveBeenCalledWith({
        where: { status: "INACTIVE" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should reject invalid status query parameter with 400", async () => {
      const res = await api().get("/api/v1/plans?status=ARCHIVED");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/plans", () => {
    it("should create a plan with 201 when all fields are supplied", async () => {
      const planPayload = {
        name: "Annual Enterprise",
        billingInterval: "YEAR",
        intervalCount: 1,
        minimumQuantity: 5,
        status: "ACTIVE",
      };
      const createdPlan = {
        id: validPlanId,
        ...planPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPrisma.plan.create.mockResolvedValue(createdPlan);

      const res = await api().post("/api/v1/plans").send(planPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Annual Enterprise");
      expect(res.body.data.minimumQuantity).toBe(5);
      expect(mockPrisma.plan.create).toHaveBeenCalledWith({
        data: {
          name: "Annual Enterprise",
          billingInterval: "YEAR",
          intervalCount: 1,
          minimumQuantity: 5,
          status: "ACTIVE",
        },
      });
    });

    it("should apply schema defaults for intervalCount, minimumQuantity, and status when omitted", async () => {
      const minimalPayload = {
        name: "Quarterly Starter",
        billingInterval: "MONTH",
      };
      const createdPlan = {
        id: validPlanId,
        name: "Quarterly Starter",
        billingInterval: "MONTH",
        intervalCount: 1,
        minimumQuantity: 1,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPrisma.plan.create.mockResolvedValue(createdPlan);

      const res = await api().post("/api/v1/plans").send(minimalPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.plan.create).toHaveBeenCalledWith({
        data: {
          name: "Quarterly Starter",
          billingInterval: "MONTH",
          intervalCount: 1,
          minimumQuantity: 1,
          status: "ACTIVE",
        },
      });
    });

    it.each(["DAY", "WEEK", "MONTH", "YEAR"] as const)(
      "should accept valid billing interval: %s",
      async (interval) => {
        mockPrisma.plan.create.mockResolvedValue({
          id: validPlanId,
          name: `${interval} Plan`,
          billingInterval: interval,
          intervalCount: 1,
          minimumQuantity: 1,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        const res = await api().post("/api/v1/plans").send({
          name: `${interval} Plan`,
          billingInterval: interval,
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      },
    );

    it("should reject missing name with 400", async () => {
      const res = await api().post("/api/v1/plans").send({
        billingInterval: "MONTH",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject blank or whitespace-only name with 400", async () => {
      const res = await api().post("/api/v1/plans").send({
        name: "    ",
        billingInterval: "MONTH",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid billing intervals with 400", async () => {
      const res = await api().post("/api/v1/plans").send({
        name: "Biweekly Plan",
        billingInterval: "BIWEEKLY",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-positive interval count (0 or negative) with 400", async () => {
      const resZero = await api().post("/api/v1/plans").send({
        name: "Zero Interval",
        billingInterval: "MONTH",
        intervalCount: 0,
      });

      expect(resZero.status).toBe(400);
      expect(resZero.body.code).toBe("VALIDATION_ERROR");

      const resNeg = await api().post("/api/v1/plans").send({
        name: "Negative Interval",
        billingInterval: "MONTH",
        intervalCount: -2,
      });

      expect(resNeg.status).toBe(400);
      expect(resNeg.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-integer interval count with 400", async () => {
      const res = await api().post("/api/v1/plans").send({
        name: "Float Interval",
        billingInterval: "MONTH",
        intervalCount: 2.5,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-positive minimum quantity with 400", async () => {
      const resZero = await api().post("/api/v1/plans").send({
        name: "Zero Qty",
        billingInterval: "MONTH",
        minimumQuantity: 0,
      });

      expect(resZero.status).toBe(400);
      expect(resZero.body.code).toBe("VALIDATION_ERROR");

      const resNeg = await api().post("/api/v1/plans").send({
        name: "Negative Qty",
        billingInterval: "MONTH",
        minimumQuantity: -1,
      });

      expect(resNeg.status).toBe(400);
      expect(resNeg.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-integer minimum quantity with 400", async () => {
      const res = await api().post("/api/v1/plans").send({
        name: "Float Qty",
        billingInterval: "MONTH",
        minimumQuantity: 1.5,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject unsupported status values with 400", async () => {
      const res = await api().post("/api/v1/plans").send({
        name: "Bad Status Plan",
        billingInterval: "MONTH",
        status: "DELETED",
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/plans/:id", () => {
    it("should return a plan by ID with 200", async () => {
      const mockPlan = {
        id: validPlanId,
        name: "Pro Plan",
        billingInterval: "MONTH",
        intervalCount: 1,
        minimumQuantity: 1,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);

      const res = await api().get(`/api/v1/plans/${validPlanId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validPlanId);
      expect(res.body.data.name).toBe("Pro Plan");
    });

    it("should return 404 when plan is not found", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      const res = await api().get(`/api/v1/plans/${validPlanId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should reject invalid UUID with 400", async () => {
      const res = await api().get("/api/v1/plans/not-a-valid-uuid");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/v1/plans/:id", () => {
    it("should update a plan with 200", async () => {
      const existingPlan = {
        id: validPlanId,
        name: "Old Name",
        billingInterval: "MONTH",
        intervalCount: 1,
        minimumQuantity: 1,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedPlan = {
        ...existingPlan,
        name: "New Name",
        status: "INACTIVE",
      };

      mockPrisma.plan.findUnique.mockResolvedValue(existingPlan);
      mockPrisma.plan.update.mockResolvedValue(updatedPlan);

      const res = await api()
        .patch(`/api/v1/plans/${validPlanId}`)
        .send({ name: "New Name", status: "INACTIVE" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Name");
      expect(res.body.data.status).toBe("INACTIVE");
      expect(mockPrisma.plan.update).toHaveBeenCalledWith({
        where: { id: validPlanId },
        data: { name: "New Name", status: "INACTIVE" },
      });
    });

    it("should perform partial update and preserve omitted fields", async () => {
      const existingPlan = {
        id: validPlanId,
        name: "Standard Plan",
        billingInterval: "MONTH",
        intervalCount: 3,
        minimumQuantity: 2,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPrisma.plan.findUnique.mockResolvedValue(existingPlan);
      mockPrisma.plan.update.mockResolvedValue({
        ...existingPlan,
        intervalCount: 6,
      });

      const res = await api()
        .patch(`/api/v1/plans/${validPlanId}`)
        .send({ intervalCount: 6 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.plan.update).toHaveBeenCalledWith({
        where: { id: validPlanId },
        data: { intervalCount: 6 },
      });
    });

    it("should return 404 when updating non-existent plan", async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      const res = await api()
        .patch(`/api/v1/plans/${validPlanId}`)
        .send({ name: "New Plan" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should reject empty update body with 400", async () => {
      const res = await api()
        .patch(`/api/v1/plans/${validPlanId}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject blank name in update with 400", async () => {
      const res = await api()
        .patch(`/api/v1/plans/${validPlanId}`)
        .send({ name: "   " });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid billing interval in update with 400", async () => {
      const res = await api()
        .patch(`/api/v1/plans/${validPlanId}`)
        .send({ billingInterval: "SEMIANNUAL" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-positive interval count in update with 400", async () => {
      const res = await api()
        .patch(`/api/v1/plans/${validPlanId}`)
        .send({ intervalCount: 0 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-positive minimum quantity in update with 400", async () => {
      const res = await api()
        .patch(`/api/v1/plans/${validPlanId}`)
        .send({ minimumQuantity: -5 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject unsupported status in update with 400", async () => {
      const res = await api()
        .patch(`/api/v1/plans/${validPlanId}`)
        .send({ status: "DELETED" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid UUID in params with 400", async () => {
      const res = await api()
        .patch("/api/v1/plans/12345")
        .send({ name: "Invalid ID Plan" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
