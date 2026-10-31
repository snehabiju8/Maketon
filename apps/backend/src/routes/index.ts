import { Router, Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import productsRouter from "../modules/products/products.routes";
import plansRouter from "../modules/plans/plans.routes";
import invoicesRoutes from "../modules/invoices/invoices.routes";
import { invoicePaymentsRouter, paymentsRouter } from "../modules/payments/payments.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";

// Module routes
import authRoutes from "../modules/auth/auth.routes";
import usersRoutes from "../modules/users/users.routes";
import customersRoutes from "../modules/customers/customers.routes";

const router = Router();

// Allows for a Neon compute waking up from suspension
const DB_HEALTH_TIMEOUT_MS = 10000;

const checkDatabase = async (): Promise<boolean> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Database health check timed out")),
          DB_HEALTH_TIMEOUT_MS,
        );
      }),
    ]);
    return true;
  } catch (error) {
    // Log only the error message; Prisma errors never include the connection password
    logger.error({ reason: (error as Error).message }, "Database health check failed");
    return false;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Health check endpoint
 * GET /api/v1/health
 */
router.get(
  "/health",
  asyncHandler(async (_req: Request, res: Response) => {
    const databaseUp = await checkDatabase();
    const data = {
      status: databaseUp ? "healthy" : "unhealthy",
      database: databaseUp ? "up" : "down",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    if (!databaseUp) {
      return sendError(res, "Database is unavailable", 503, "SERVICE_UNAVAILABLE", data);
    }

    return sendSuccess(res, data, "Brightloop API is running", 200);
  }),
);

// Products, Variants, and Plans modules (Member 2)
router.use("/products", productsRouter);
router.use("/plans", plansRouter);

// Register Module 1 Routes
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/customers", customersRoutes);
// Billing, invoices, payments and dashboard (Member 4)
router.use("/invoices/:invoiceId/payments", invoicePaymentsRouter);
router.use("/invoices", invoicesRoutes);
router.use("/payments", paymentsRouter);
router.use("/dashboard", dashboardRoutes);

export default router;

