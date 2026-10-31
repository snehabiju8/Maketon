import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Prisma } from "@prisma/client";

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
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  productVariant: {
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

describe("products access control", () => {
  it("requires authentication", async () => {
    expect((await request(app).get("/api/v1/products")).status).toBe(401);
  });
  it("lets staff read but not write, and forbids customers", async () => {
    expect((await request(app).get("/api/v1/products").set(authHeaders("CUSTOMER"))).status).toBe(403);
    const write = await request(app).post("/api/v1/products").set(authHeaders("INTERNAL")).send({});
    expect(write.status).toBe(403);
  });
});


describe("Products & Variants Module", () => {
  const validProductId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const validVariantId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/products", () => {
    it("should return a list of products with 200", async () => {
      const mockProducts = [
        {
          id: validProductId,
          name: "Standard ERP",
          description: "Full suite",
          status: "ACTIVE",
          variants: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const res = await api().get("/api/v1/products");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Standard ERP");
    });

    it("should filter by status query parameter", async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const res = await api().get("/api/v1/products?status=INACTIVE");

      expect(res.status).toBe(200);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "INACTIVE" },
        }),
      );
    });

    it("should reject invalid status query parameter with 400", async () => {
      const res = await api().get("/api/v1/products?status=INVALID_STATUS");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/products", () => {
    it("should create a product with 201", async () => {
      const newProduct = {
        name: "CRM Pro",
        description: "Customer management",
        status: "ACTIVE",
      };
      const createdProduct = {
        id: validProductId,
        ...newProduct,
        variants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPrisma.product.create.mockResolvedValue(createdProduct);

      const res = await api().post("/api/v1/products").send(newProduct);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validProductId);
      expect(res.body.data.name).toBe("CRM Pro");
    });

    it("should reject product creation without a name", async () => {
      const res = await api().post("/api/v1/products").send({
        description: "Missing name",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/products/:id", () => {
    it("should return a product with 200 when found", async () => {
      const mockProduct = {
        id: validProductId,
        name: "Accounting Suite",
        description: null,
        status: "ACTIVE",
        variants: [],
      };
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const res = await api().get(`/api/v1/products/${validProductId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Accounting Suite");
    });

    it("should return 404 when product is not found", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const res = await api().get(`/api/v1/products/${validProductId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("should return 400 for invalid UUID", async () => {
      const res = await api().get("/api/v1/products/invalid-uuid");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/v1/products/:id", () => {
    it("should update a product with 200", async () => {
      const existingProduct = {
        id: validProductId,
        name: "Old Name",
        description: null,
        status: "ACTIVE",
        variants: [],
      };
      const updatedProduct = {
        ...existingProduct,
        name: "Updated Name",
      };
      mockPrisma.product.findUnique.mockResolvedValue(existingProduct);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      const res = await api()
        .patch(`/api/v1/products/${validProductId}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
    });

    it("should reject update with empty body", async () => {
      const res = await api()
        .patch(`/api/v1/products/${validProductId}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/products/:productId/variants", () => {
    it("should return variants for a valid product", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: validProductId,
        name: "Parent Product",
        status: "ACTIVE",
        variants: [],
      });
      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          id: validVariantId,
          productId: validProductId,
          name: "Standard Edition",
          sku: "SKU-STD",
          defaultPrice: new Prisma.Decimal(199.99),
          status: "ACTIVE",
        },
      ]);

      const res = await api().get(`/api/v1/products/${validProductId}/variants`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].sku).toBe("SKU-STD");
    });

    it("should return 404 if parent product not found", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const res = await api().get(`/api/v1/products/${validProductId}/variants`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  describe("POST /api/v1/products/:productId/variants", () => {
    it("should create a variant under an active product with 201", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: validProductId,
        name: "Active Product",
        status: "ACTIVE",
        variants: [],
      });
      mockPrisma.productVariant.findUnique.mockResolvedValue(null); // No SKU conflict
      const createdVariant = {
        id: validVariantId,
        productId: validProductId,
        name: "Enterprise",
        sku: "ENT-01",
        defaultPrice: new Prisma.Decimal(499.0),
        status: "ACTIVE",
      };
      mockPrisma.productVariant.create.mockResolvedValue(createdVariant);

      const res = await api()
        .post(`/api/v1/products/${validProductId}/variants`)
        .send({
          name: "Enterprise",
          sku: "ENT-01",
          defaultPrice: 499.0,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Enterprise");
    });

    it("should reject variant creation under an INACTIVE product with 400", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: validProductId,
        name: "Inactive Product",
        status: "INACTIVE",
        variants: [],
      });

      const res = await api()
        .post(`/api/v1/products/${validProductId}/variants`)
        .send({
          name: "Enterprise",
          defaultPrice: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INACTIVE_PRODUCT");
    });

    it("should reject duplicate SKU with 409 Conflict", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: validProductId,
        name: "Active Product",
        status: "ACTIVE",
        variants: [],
      });
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: "existing-id",
        sku: "DUPLICATE-SKU",
      });

      const res = await api()
        .post(`/api/v1/products/${validProductId}/variants`)
        .send({
          name: "Enterprise",
          sku: "DUPLICATE-SKU",
          defaultPrice: 100,
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DUPLICATE_SKU");
    });

    it("should reject negative default price with 400", async () => {
      const res = await api()
        .post(`/api/v1/products/${validProductId}/variants`)
        .send({
          name: "Enterprise",
          defaultPrice: -50,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/products/variants/:id", () => {
    it("should retrieve variant by ID and not be intercepted by product /:id route", async () => {
      const mockVariant = {
        id: validVariantId,
        productId: validProductId,
        name: "Starter Edition",
        sku: "STARTER",
        defaultPrice: new Prisma.Decimal(49.99),
        status: "ACTIVE",
        product: { id: validProductId, name: "Parent Software" },
      };
      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      const res = await api().get(`/api/v1/products/variants/${validVariantId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(validVariantId);
      expect(res.body.data.sku).toBe("STARTER");
    });

    it("should return 404 when variant is not found", async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);

      const res = await api().get(`/api/v1/products/variants/${validVariantId}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  describe("PATCH /api/v1/products/variants/:id", () => {
    it("should update variant with 200", async () => {
      const existing = {
        id: validVariantId,
        productId: validProductId,
        name: "Old Variant",
        sku: "OLD-SKU",
        defaultPrice: new Prisma.Decimal(10),
        status: "ACTIVE",
        product: { id: validProductId },
      };
      const updated = {
        ...existing,
        name: "New Variant",
        defaultPrice: new Prisma.Decimal(25),
      };
      mockPrisma.productVariant.findUnique.mockResolvedValue(existing);
      mockPrisma.productVariant.update.mockResolvedValue(updated);

      const res = await api()
        .patch(`/api/v1/products/variants/${validVariantId}`)
        .send({
          name: "New Variant",
          defaultPrice: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("New Variant");
    });

    it("should return 404 when updating non-existent variant", async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);

      const res = await api()
        .patch(`/api/v1/products/variants/${validVariantId}`)
        .send({ name: "Does Not Exist" });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });
});
