import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { csrfProtection } from "../../middleware/csrf";
import { asyncHandler } from "../../utils/async-handler";
import * as invoicesController from "./invoices.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "INTERNAL"));

router.get("/", asyncHandler(invoicesController.listInvoices));
router.post(
  "/run-billing",
  csrfProtection,
  authorize("ADMIN"),
  asyncHandler(invoicesController.runBilling),
);
router.get("/:id", asyncHandler(invoicesController.getInvoice));
router.post("/:id/confirm", csrfProtection, asyncHandler(invoicesController.confirmInvoice));
router.post("/:id/cancel", csrfProtection, asyncHandler(invoicesController.cancelInvoice));

export default router;
