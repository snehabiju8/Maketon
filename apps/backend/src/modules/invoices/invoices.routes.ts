import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import * as invoicesController from "./invoices.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "INTERNAL"));

router.get("/", asyncHandler(invoicesController.listInvoices));
router.post("/run-billing", authorize("ADMIN"), asyncHandler(invoicesController.runBilling));
router.get("/:id", asyncHandler(invoicesController.getInvoice));
router.post("/:id/confirm", asyncHandler(invoicesController.confirmInvoice));
router.post("/:id/cancel", asyncHandler(invoicesController.cancelInvoice));

export default router;
