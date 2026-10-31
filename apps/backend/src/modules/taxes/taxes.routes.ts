import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize, authorizeWrites } from "../../middleware/authorize";
import { csrfProtection } from "../../middleware/csrf";
import { taxesController } from "./taxes.controller";
import { validateRequest } from "../../middleware/validate";
import {
  listTaxesQuerySchema,
  createTaxSchema,
  updateTaxSchema,
  taxIdParamSchema,
} from "./taxes.validation";

const router = Router();

// Admins and staff can read the catalog; only admins can change it (PRD roles).
router.use(authenticate, authorize(Role.ADMIN, Role.INTERNAL), csrfProtection, authorizeWrites(Role.ADMIN));

router.get(
  "/",
  validateRequest({ query: listTaxesQuerySchema }),
  taxesController.listTaxes,
);

router.post(
  "/",
  validateRequest({ body: createTaxSchema }),
  taxesController.createTax,
);

router.get(
  "/:id",
  validateRequest({ params: taxIdParamSchema }),
  taxesController.getTaxById,
);

router.patch(
  "/:id",
  validateRequest({ params: taxIdParamSchema, body: updateTaxSchema }),
  taxesController.updateTax,
);

export default router;
