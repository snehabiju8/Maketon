import { Router } from "express";
import { authController } from "./auth.controller";
import { registerSchema, loginSchema } from "./auth.validation";
import { validateRequest } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { authRateLimiter } from "../../middleware/rate-limiter";
import { csrfProtection } from "../../middleware/csrf";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// Public Authentication Endpoints
router.post(
  "/register",
  authRateLimiter,
  csrfProtection,
  validateRequest({ body: registerSchema }),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  authRateLimiter,
  csrfProtection,
  validateRequest({ body: loginSchema }),
  asyncHandler(authController.login),
);

// Idempotent Logout (No authentication required so expired sessions can always clear cookie)
router.post("/logout", csrfProtection, asyncHandler(authController.logout));

// Authenticated Session Verification
router.get("/me", authenticate, asyncHandler(authController.getMe));

export default router;
