import { Router, Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";

const router = Router();

/**
 * Health check endpoint
 * GET /api/v1/health
 */
router.get("/health", (_req: Request, res: Response) => {
  return sendSuccess(
    res,
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    "Brightloop API is running",
    200,
  );
});

export default router;
