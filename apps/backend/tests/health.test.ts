import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));

vi.mock("../src/lib/prisma", () => ({
  prisma: { $queryRaw: queryRaw },
  default: { $queryRaw: queryRaw },
}));

import { app } from "../src/app";

describe("Health Check API", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("should return 200 and healthy status on GET /api/v1/health", async () => {
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Brightloop API is running",
      data: {
        status: "healthy",
        database: "up",
      },
    });
    expect(res.body.data.timestamp).toBeDefined();
    expect(res.body.data.uptime).toBeDefined();
  });

  it("should return 503 without connection details when the database is unreachable", async () => {
    queryRaw.mockRejectedValue(
      new Error("Can't reach database server at `ep-secret-pooler.neon.tech:5432`"),
    );

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      success: false,
      code: "SERVICE_UNAVAILABLE",
      errors: { status: "unhealthy", database: "down" },
    });
    expect(JSON.stringify(res.body)).not.toContain("neon.tech");
  });
});
