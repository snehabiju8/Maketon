import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Centralized Error Handling", () => {
  it("should return 404 for unknown endpoints", async () => {
    const res = await request(app).get("/api/v1/non-existent-route");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      code: "ROUTE_NOT_FOUND",
      message: "Cannot GET /api/v1/non-existent-route",
    });
  });

  it("should return 404 for root undefined route", async () => {
    const res = await request(app).get("/unknown");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      code: "ROUTE_NOT_FOUND",
    });
  });
});
