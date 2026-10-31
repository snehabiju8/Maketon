import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import * as dashboardController from "./dashboard.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN", "INTERNAL"));
router.get("/summary", asyncHandler(dashboardController.getSummary));

export default router;
