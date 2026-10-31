/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { Role, CustomerStatus } from "@prisma/client";
import { signToken } from "../src/lib/jwt";

const mocked = vi.hoisted(() => {
  const state = {
    users: [] as Array<Record<string, any>>,
    customers: [] as Array<Record<string, any>>,
  };

  const findCustomerForUser = (user: Record<string, any>) =>
    state.customers.find((customer) => customer.id === user.customerId) || null;

  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        const user = where.id
          ? state.users.find((item) => item.id === where.id)
          : state.users.find((item) => item.email === where.email);
        return user ? { ...user, customer: findCustomerForUser(user) } : null;
      }),
      findMany: vi.fn(async ({ select }: any = {}) =>
        state.users
          .filter((user) => user.role === Role.INTERNAL)
          .map((user) =>
            select
              ? Object.fromEntries(Object.keys(select).map((key) => [key, user[key]]))
              : user,
          ),
      ),
      count: vi.fn(async ({ where }: any) =>
        state.users.filter((user) => user.role === where.role).length,
      ),
      create: vi.fn(async ({ data }: any) => {
        const user = {
          id: `00000000-0000-0000-0000-${String(state.users.length + 1).padStart(12, "0")}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.users.push(user);
        return user;
      }),
    },
    customer: {
      findUnique: vi.fn(async ({ where }: any) =>
        state.customers.find((customer) => customer.id === where.id) || null,
      ),
      count: vi.fn(async () => state.customers.length),
      findMany: vi.fn(async () => state.customers),
      create: vi.fn(async ({ data }: any) => {
        const customer = {
          id: `10000000-0000-0000-0000-${String(state.customers.length + 1).padStart(12, "0")}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.customers.push(customer);
        return customer;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const customer = state.customers.find((item) => item.id === where.id);
        Object.assign(customer, data);
        return customer;
      }),
    },
    $transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) =>
      callback(prisma),
    ),
    $queryRaw: vi.fn(async () => [{ "?column?": 1 }]),
  };

  return { state, prisma };
});

vi.mock("../src/lib/prisma", () => ({ prisma: mocked.prisma }));

import { app } from "../src/app";
import { createGeneralRateLimiter } from "../src/middleware/rate-limiter";
import { errorHandler } from "../src/middleware/error-handler";

const browserHeaders = {
  Origin: "http://localhost:5173",
  "X-Brightloop-Request": "1",
};

const adminToken = () =>
  signToken({
    userId: "admin-1",
    email: "admin@example.com",
    role: "ADMIN",
    customerId: null,
  });

describe("Module 1 HTTP integration", () => {
  beforeEach(() => {
    mocked.state.users.length = 0;
    mocked.state.customers.length = 0;
    mocked.state.users.push({
      id: "admin-1",
      name: "Admin",
      email: "admin@example.com",
      passwordHash: "$2b$10$not-used",
      role: Role.ADMIN,
      customerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.clearAllMocks();
  });

  it("registers atomically, sets an HTTP-only cookie, and restores /auth/me", async () => {
    const agent = request.agent(app);
    const registration = await agent
      .post("/api/v1/auth/register")
      .set(browserHeaders)
      .send({
        name: "Acme",
        email: " ACME@example.com ",
        password: "Password123!",
      });

    expect(registration.status).toBe(201);
    expect(registration.body.data.user.role).toBe("CUSTOMER");
    expect(registration.body.data.customer.id).toBeDefined();
    expect(registration.headers["set-cookie"][0]).toMatch(/HttpOnly/i);
    expect(mocked.state.users).toHaveLength(2);
    expect(mocked.state.customers).toHaveLength(1);
    expect(mocked.state.users[1].passwordHash).not.toBe("Password123!");

    const session = await agent.get("/api/v1/auth/me");
    expect(session.status).toBe(200);
    expect(session.body.data.user.email).toBe("acme@example.com");
  });

  it("sets a cookie on successful login and rejects invalid credentials", async () => {
    const registration = await request(app)
      .post("/api/v1/auth/register")
      .set(browserHeaders)
      .send({ name: "Acme", email: "acme@example.com", password: "Password123!" });
    expect(registration.status).toBe(201);

    const login = await request(app)
      .post("/api/v1/auth/login")
      .set(browserHeaders)
      .send({ email: "ACME@example.com", password: "Password123!" });
    expect(login.status).toBe(200);
    expect(login.headers["set-cookie"][0]).toMatch(/HttpOnly/i);

    const invalid = await request(app)
      .post("/api/v1/auth/login")
      .set(browserHeaders)
      .send({ email: "acme@example.com", password: "WrongPassword123!" });
    expect(invalid.status).toBe(401);
  });

  it("clears logout cookies even when the supplied token is invalid", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set({ ...browserHeaders, Cookie: "brightloop_token=invalid" });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"][0]).toMatch(/Max-Age=0/i);
  });

  it("rejects missing and invalid authentication tokens", async () => {
    expect((await request(app).get("/api/v1/auth/me")).status).toBe(401);
    expect(
      (
        await request(app)
          .get("/api/v1/auth/me")
          .set("Cookie", "brightloop_token=invalid")
      ).status,
    ).toBe(401);

    const expiredToken = signToken(
      {
        userId: "admin-1",
        email: "admin@example.com",
        role: "ADMIN",
        customerId: null,
      },
      { expiresIn: -1 },
    );
    expect(
      (
        await request(app)
          .get("/api/v1/auth/me")
          .set("Cookie", `brightloop_token=${expiredToken}`)
      ).status,
    ).toBe(401);
  });

  it("enforces admin-only staff management and excludes password hashes", async () => {
    const customer = await request(app)
      .post("/api/v1/auth/register")
      .set(browserHeaders)
      .send({ name: "Customer", email: "customer@example.com", password: "Password123!" });
    const customerToken = customer.headers["set-cookie"][0];

    expect(
      (
        await request(app)
          .get("/api/v1/users/staff")
          .set("Cookie", customerToken)
      ).status,
    ).toBe(403);

    const created = await request(app)
      .post("/api/v1/users/staff")
      .set({ ...browserHeaders, Authorization: `Bearer ${adminToken()}` })
      .send({ name: "Internal", email: "internal@example.com", password: "Password123!" });
    expect(created.status).toBe(201);

    const listed = await request(app)
      .get("/api/v1/users/staff")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(listed.status).toBe(200);
    expect(JSON.stringify(listed.body)).not.toContain("passwordHash");
  });

  it("enforces customer ownership and protects customer status from self-update", async () => {
    const first = request.agent(app);
    await first
      .post("/api/v1/auth/register")
      .set(browserHeaders)
      .send({ name: "First", email: "first@example.com", password: "Password123!" });
    const second = await request(app)
      .post("/api/v1/auth/register")
      .set(browserHeaders)
      .send({ name: "Second", email: "second@example.com", password: "Password123!" });
    const secondId = second.body.data.customer.id;

    const forbidden = await first.get(`/api/v1/customers/${secondId}`);
    expect(forbidden.status).toBe(403);

    const ownId = mocked.state.customers[0].id;
    const update = await first
      .patch(`/api/v1/customers/${ownId}`)
      .set(browserHeaders)
      .send({ name: "Updated", status: CustomerStatus.INACTIVE });
    expect(update.status).toBe(200);
    expect(update.body.data.customer.name).toBe("Updated");
    expect(update.body.data.customer.status).toBe(CustomerStatus.ACTIVE);
  });

  it("rejects state-changing requests without the required CSRF origin/header", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("X-Brightloop-Request", "1");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("CSRF_ORIGIN_MISSING");
  });

  it("returns 429 after the configured general request limit is exceeded", async () => {
    const limitedApp = express();
    limitedApp.use(createGeneralRateLimiter(1));
    limitedApp.get("/", (_req, res) => res.sendStatus(200));
    limitedApp.use(errorHandler);

    expect((await request(limitedApp).get("/")).status).toBe(200);
    expect((await request(limitedApp).get("/")).status).toBe(429);
  });
});
