import { Router } from "express";
import { plansController } from "./plans.controller";
import { validateRequest } from "../../middleware/validate";
import {
  listPlansQuerySchema,
  createPlanSchema,
  updatePlanSchema,
  planIdParamSchema,
} from "./plans.validation";

const router = Router();

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
