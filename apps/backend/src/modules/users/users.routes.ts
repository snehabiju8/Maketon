import { Router } from "express";
import { Role } from "@prisma/client";
import { usersController } from "./users.controller";
import { createStaffSchema, staffQuerySchema } from "./users.validation";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { csrfProtection } from "../../middleware/csrf";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// All staff management routes strictly require ADMIN role
router.use(authenticate, authorize(Role.ADMIN));

router.post(
  "/staff",
  csrfProtection,
  validate(createStaffSchema),
  asyncHandler(usersController.createStaff),
);

router.get("/staff", validate(staffQuerySchema), asyncHandler(usersController.listStaff));

export default router;
