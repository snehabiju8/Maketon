import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize, authorizeWrites } from "../../middleware/authorize";
import { csrfProtection } from "../../middleware/csrf";
import { plansController } from "./plans.controller";
import { validateRequest } from "../../middleware/validate";
import {
  listPlansQuerySchema,
  createPlanSchema,
  updatePlanSchema,
  planIdParamSchema,
} from "./plans.validation";

const router = Router();

// Admins and staff can read the catalog; only admins can change it (PRD roles).
router.use(authenticate, authorize(Role.ADMIN, Role.INTERNAL), csrfProtection, authorizeWrites(Role.ADMIN));

router.get(
  "/",
  validateRequest({ query: listPlansQuerySchema }),
  plansController.listPlans,
);

router.post(
  "/",
  validateRequest({ body: createPlanSchema }),
  plansController.createPlan,
);

router.get(
  "/:id",
  validateRequest({ params: planIdParamSchema }),
  plansController.getPlanById,
);

router.patch(
  "/:id",
  validateRequest({ params: planIdParamSchema, body: updatePlanSchema }),
  plansController.updatePlan,
);

export default router;
