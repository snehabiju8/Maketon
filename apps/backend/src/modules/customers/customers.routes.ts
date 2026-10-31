import { Router } from "express";
import { Role } from "@prisma/client";
import { customersController } from "./customers.controller";
import {
  createCustomerSchema,
  customerIdParamSchema,
  customerQuerySchema,
  updateCustomerSchema,
} from "./customers.validation";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { csrfProtection } from "../../middleware/csrf";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// All customer routes require authenticated session
router.use(authenticate);

// Staff customer creation (profile only, no login account)
router.post(
  "/",
  authorize(Role.ADMIN, Role.INTERNAL),
  csrfProtection,
  validate(createCustomerSchema),
  asyncHandler(customersController.createCustomer),
);

// Staff customer listing with search and pagination
router.get(
  "/",
  authorize(Role.ADMIN, Role.INTERNAL),
  validate(customerQuerySchema),
  asyncHandler(customersController.listCustomers),
);

// Retrieve customer profile by ID (enforces customer tenant ownership)
router.get(
  "/:id",
  validate(customerIdParamSchema),
  asyncHandler(customersController.getCustomerById),
);

// Update customer profile by ID (enforces ownership and privilege stripping)
router.patch(
  "/:id",
  csrfProtection,
  validate(updateCustomerSchema),
  asyncHandler(customersController.updateCustomer),
);

export default router;
