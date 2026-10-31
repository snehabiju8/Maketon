import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Prisma } from "@prisma/client";

const mockPrisma = vi.hoisted(() => ({
  tax: {
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

describe("Taxes Module (Mocked Database)", () => {
  const validTaxId = "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/taxes", () => {
    it("should return a list of taxes with 200", async () => {
      const mockTaxes = [
        {
          id: validTaxId,
          name: "GST 18%",
          rate: new Prisma.Decimal("18.00"),
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];
      mockPrisma.tax.findMany.mockResolvedValue(mockTaxes);

      const res = await request(app).get("/api/v1/taxes");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("GST 18%");
      expect(mockPrisma.tax.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
      });
    });

    it("should filter by isActive=true query parameter", async () => {
      mockPrisma.tax.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/v1/taxes?isActive=true");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.tax.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should filter by isActive=false query parameter", async () => {
      mockPrisma.tax.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/v1/taxes?isActive=false");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.tax.findMany).toHaveBeenCalledWith({
        where: { isActive: false },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should reject invalid isActive query parameter with 400", async () => {
      const res = await request(app).get("/api/v1/taxes?isActive=invalid");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/taxes", () => {
    it("should create a tax with 201 when all valid fields are supplied", async () => {
      const taxPayload = {
        name: "GST 18%",
        rate: 18.0,
        isActive: true,
      };
      const createdTax = {
        id: validTaxId,
        name: "GST 18%",
        rate: new Prisma.Decimal("18.00"),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      mockPrisma.tax.create.mockResolvedValue(createdTax);

      const res = await request(app).post("/api/v1/taxes").send(taxPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("GST 18%");
      expect(mockPrisma.tax.create).toHaveBeenCalledWith({
        data: {
          name: "GST 18%",
          rate: expect.any(Prisma.Decimal),
          isActive: true,
        },
      });
    });

    it("should default isActive to true when omitted", async () => {
      const minimalPayload = {
        name: "Zero VAT",
        rate: 0,
      };
      const createdTax = {
        id: validTaxId,
        name: "Zero VAT",
        rate: new Prisma.Decimal("0.00"),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      mockPrisma.tax.create.mockResolvedValue(createdTax);

      const res = await request(app).post("/api/v1/taxes").send(minimalPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.tax.create).toHaveBeenCalledWith({
        data: {
          name: "Zero VAT",
          rate: expect.any(Prisma.Decimal),
          isActive: true,
        },
      });
    });

    it("should accept rate as a valid numeric string", async () => {
      const stringRatePayload = {
        name: "Service Tax",
        rate: "12.50",
      };
      const createdTax = {
        id: validTaxId,
        name: "Service Tax",
        rate: new Prisma.Decimal("12.50"),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      mockPrisma.tax.create.mockResolvedValue(createdTax);

      const res = await request(app).post("/api/v1/taxes").send(stringRatePayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.tax.create).toHaveBeenCalledWith({
        data: {
          name: "Service Tax",
          rate: expect.any(Prisma.Decimal),
          isActive: true,
        },
      });
    });

    it("should accept rate of 0%", async () => {
      mockPrisma.tax.create.mockResolvedValue({
        id: validTaxId,
        name: "Exempt Tax",
        rate: new Prisma.Decimal("0.00"),
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      const res = await request(app).post("/api/v1/taxes").send({
        name: "Exempt Tax",
        rate: 0,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should accept maximum valid rate of 999.99%", async () => {
      mockPrisma.tax.create.mockResolvedValue({
        id: validTaxId,
        name: "Luxury Tax",
        rate: new Prisma.Decimal("999.99"),
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      const res = await request(app).post("/api/v1/taxes").send({
        name: "Luxury Tax",
        rate: 999.99,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should reject missing name with 400", async () => {
      const res = await request(app).post("/api/v1/taxes").send({
        rate: 18,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject blank or whitespace-only name with 400", async () => {
      const res = await request(app).post("/api/v1/taxes").send({
        name: "     ",
        rate: 18,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject missing rate with 400", async () => {
      const res = await request(app).post("/api/v1/taxes").send({
        name: "GST 18%",
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject negative rates with 400", async () => {
      const res = await request(app).post("/api/v1/taxes").send({
        name: "Negative Tax",
        rate: -5,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject rates exceeding 999.99% with 400", async () => {
      const res = await request(app).post("/api/v1/taxes").send({
        name: "Over上限 Tax",
        rate: 1000,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject rates with more than 2 decimal places with 400", async () => {
      const res = await request(app).post("/api/v1/taxes").send({
        name: "Precision Tax",
        rate: 18.125,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-numeric string rate with 400", async () => {
      const res = await request(app).post("/api/v1/taxes").send({
        name: "Invalid Rate Tax",
        rate: "eighteen-percent",
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid non-boolean isActive value with 400", async () => {
      const res = await request(app).post("/api/v1/taxes").send({
        name: "Bad Bool Tax",
        rate: 10,
        isActive: "not-a-boolean",
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/taxes/:id", () => {
    it("should return a tax record by ID with 200", async () => {
      const mockTax = {
        id: validTaxId,
        name: "VAT 5%",
        rate: new Prisma.Decimal("5.00"),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      mockPrisma.tax.findUnique.mockResolvedValue(mockTax);

      const res = await request(app).get(`/api/v1/taxes/${validTaxId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validTaxId);
      expect(res.body.data.name).toBe("VAT 5%");
    });

    it("should return 404 when tax record is not found", async () => {
      mockPrisma.tax.findUnique.mockResolvedValue(null);

      const res = await request(app).get(`/api/v1/taxes/${validTaxId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should reject non-UUID id param with 400", async () => {
      const res = await request(app).get("/api/v1/taxes/invalid-uuid-1234");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/v1/taxes/:id", () => {
    it("should update tax fields with 200", async () => {
      const existingTax = {
        id: validTaxId,
        name: "Old Tax Name",
        rate: new Prisma.Decimal("10.00"),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const updatedTax = {
        ...existingTax,
        name: "Updated Tax Name",
        isActive: false,
      };

      mockPrisma.tax.findUnique.mockResolvedValue(existingTax);
      mockPrisma.tax.update.mockResolvedValue(updatedTax);

      const res = await request(app)
        .patch(`/api/v1/taxes/${validTaxId}`)
        .send({ name: "Updated Tax Name", isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated Tax Name");
      expect(res.body.data.isActive).toBe(false);
      expect(mockPrisma.tax.update).toHaveBeenCalledWith({
        where: { id: validTaxId },
        data: { name: "Updated Tax Name", isActive: false },
      });
    });

    it("should perform partial update and preserve omitted fields", async () => {
      const existingTax = {
        id: validTaxId,
        name: "GST 18%",
        rate: new Prisma.Decimal("18.00"),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      mockPrisma.tax.findUnique.mockResolvedValue(existingTax);
      mockPrisma.tax.update.mockResolvedValue({
        ...existingTax,
        rate: new Prisma.Decimal("12.00"),
      });

      const res = await request(app)
        .patch(`/api/v1/taxes/${validTaxId}`)
        .send({ rate: 12.0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.tax.update).toHaveBeenCalledWith({
        where: { id: validTaxId },
        data: { rate: expect.any(Prisma.Decimal) },
      });
    });

    it("should return 404 when updating non-existent tax", async () => {
      mockPrisma.tax.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/v1/taxes/${validTaxId}`)
        .send({ name: "New Tax" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should reject empty update body with 400", async () => {
      const res = await request(app)
        .patch(`/api/v1/taxes/${validTaxId}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject blank name in update with 400", async () => {
      const res = await request(app)
        .patch(`/api/v1/taxes/${validTaxId}`)
        .send({ name: "    " });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject negative rate in update with 400", async () => {
      const res = await request(app)
        .patch(`/api/v1/taxes/${validTaxId}`)
        .send({ rate: -1 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject rate exceeding 999.99 in update with 400", async () => {
      const res = await request(app)
        .patch(`/api/v1/taxes/${validTaxId}`)
        .send({ rate: 1000 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject rate with more than 2 decimal places in update with 400", async () => {
      const res = await request(app)
        .patch(`/api/v1/taxes/${validTaxId}`)
        .send({ rate: 5.555 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid isActive in update with 400", async () => {
      const res = await request(app)
        .patch(`/api/v1/taxes/${validTaxId}`)
        .send({ isActive: "disabled" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid UUID in params for update with 400", async () => {
      const res = await request(app)
        .patch("/api/v1/taxes/invalid-uuid")
        .send({ name: "New Name" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
