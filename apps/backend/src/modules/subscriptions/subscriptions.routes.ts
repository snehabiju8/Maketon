import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { csrfProtection } from "../../middleware/csrf";
import { subscriptionController } from "./subscriptions.controller";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN, Role.INTERNAL));

// Static routes (must come before parameterized /:id)
router.get("/catalog-preview", subscriptionController.getCatalogPreview);
router.post("/calculate-pricing", subscriptionController.calculatePricing);
router.get("/for-billing", subscriptionController.getDueForBilling);

// List and Create
router.get("/", subscriptionController.list);
router.post("/", csrfProtection, subscriptionController.create);

// Detail and State Transitions
router.get("/:id", subscriptionController.getById);
router.post("/:id/confirm", csrfProtection, subscriptionController.confirm);
router.post("/:id/activate", csrfProtection, subscriptionController.activate);
router.post("/:id/close", csrfProtection, subscriptionController.close);
router.get("/:id/events", subscriptionController.getEvents);

export default router;
