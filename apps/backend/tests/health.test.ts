import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Health Check API", () => {
  it("should return 200 and healthy status on GET /api/v1/health", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Brightloop API is running",
      data: {
        status: "healthy",
      },
    });
    expect(res.body.data.timestamp).toBeDefined();
    expect(res.body.data.uptime).toBeDefined();
  });
});
