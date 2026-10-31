import { Router } from "express";
import { subscriptionController } from "./subscriptions.controller";

const router = Router();

// Static routes (must come before parameterized /:id)
router.get("/catalog-preview", subscriptionController.getCatalogPreview);
router.post("/calculate-pricing", subscriptionController.calculatePricing);
router.get("/for-billing", subscriptionController.getDueForBilling);

// List and Create
router.get("/", subscriptionController.list);
router.post("/", subscriptionController.create);

// Detail and State Transitions
router.get("/:id", subscriptionController.getById);
router.post("/:id/confirm", subscriptionController.confirm);
router.post("/:id/activate", subscriptionController.activate);
router.post("/:id/close", subscriptionController.close);
router.get("/:id/events", subscriptionController.getEvents);

export default router;

