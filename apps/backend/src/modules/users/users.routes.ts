import { Router } from "express";
import { Role } from "@prisma/client";
import { usersController } from "./users.controller";
import { createStaffSchema, staffQuerySchema } from "./users.validation";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { csrfProtection } from "../../middleware/csrf";
import { validateRequest } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// All staff management routes strictly require ADMIN role
router.use(authenticate, authorize(Role.ADMIN));

router.post(
  "/staff",
  csrfProtection,
  validateRequest({ body: createStaffSchema.shape.body }),
  asyncHandler(usersController.createStaff),
);

router.get(
  "/staff",
  validateRequest({ query: staffQuerySchema.shape.query }),
  asyncHandler(usersController.listStaff),
);

export default router;
