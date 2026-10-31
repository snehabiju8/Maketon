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
import { validateRequest } from "../../middleware/validate";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// All customer routes require authenticated session
router.use(authenticate);

// Staff customer creation (profile only, no login account)
router.post(
  "/",
  authorize(Role.ADMIN, Role.INTERNAL),
  csrfProtection,
  validateRequest({ body: createCustomerSchema.shape.body }),
  asyncHandler(customersController.createCustomer),
);

// Staff customer listing with search and pagination
router.get(
  "/",
  authorize(Role.ADMIN, Role.INTERNAL),
  validateRequest({ query: customerQuerySchema.shape.query }),
  asyncHandler(customersController.listCustomers),
);

// Retrieve customer profile by ID (enforces customer tenant ownership)
router.get(
  "/:id",
  validateRequest({ params: customerIdParamSchema.shape.params }),
  asyncHandler(customersController.getCustomerById),
);

// Update customer profile by ID (enforces ownership and privilege stripping)
router.patch(
  "/:id",
  csrfProtection,
  validateRequest({
    params: updateCustomerSchema.shape.params,
    body: updateCustomerSchema.shape.body,
  }),
  asyncHandler(customersController.updateCustomer),
);

export default router;
