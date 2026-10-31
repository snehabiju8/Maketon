import { Router } from "express";
import { taxesController } from "./taxes.controller";
import { validateRequest } from "../../middleware/validate";
import {
  listTaxesQuerySchema,
  createTaxSchema,
  updateTaxSchema,
  taxIdParamSchema,
} from "./taxes.validation";

const router = Router();

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
