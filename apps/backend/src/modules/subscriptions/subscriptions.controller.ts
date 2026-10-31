import { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response";
import { asyncHandler } from "../../utils/async-handler";
import { subscriptionService } from "./subscriptions.service";
import {
  createSubscriptionSchema,
  closeSubscriptionSchema,
  subscriptionQuerySchema,
  calculatePricingSchema,
} from "./subscriptions.validation";

export class SubscriptionController {
  /**
   * POST /api/v1/subscriptions
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const validated = createSubscriptionSchema.parse(req.body);
    const actorUserId = (req as any).user?.id || null;

    const subscription = await subscriptionService.createSubscription(
      validated,
      actorUserId,
    );

    return sendSuccess(
      res,
      subscription,
      "Subscription created successfully in draft status",
      201,
    );
  });

  /**
   * GET /api/v1/subscriptions
   */
  list = asyncHandler(async (req: Request, res: Response) => {
    const query = subscriptionQuerySchema.parse(req.query);
    const result = await subscriptionService.listSubscriptions(query);

    return sendSuccess(
      res,
      result,
      "Subscriptions retrieved successfully",
      200,
    );
  });

  /**
   * GET /api/v1/subscriptions/:id
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(id);

    return sendSuccess(
      res,
      subscription,
      "Subscription retrieved successfully",
      200,
    );
  });

  /**
   * POST /api/v1/subscriptions/:id/confirm
   */
  confirm = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const actorUserId = (req as any).user?.id || null;

    const subscription = await subscriptionService.confirmSubscription(
      id,
      actorUserId,
    );

    return sendSuccess(
      res,
      subscription,
      "Subscription confirmed successfully",
      200,
    );
  });

  /**
   * POST /api/v1/subscriptions/:id/activate
   */
  activate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const actorUserId = (req as any).user?.id || null;

    const subscription = await subscriptionService.activateSubscription(
      id,
      actorUserId,
    );

    return sendSuccess(
      res,
      subscription,
      "Subscription activated successfully and initialized for billing",
      200,
    );
  });

  /**
   * POST /api/v1/subscriptions/:id/close
   */
  close = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = closeSubscriptionSchema.parse(req.body || {});
    const actorUserId = (req as any).user?.id || null;

    const subscription = await subscriptionService.closeSubscription(
      id,
      reason,
      actorUserId,
    );

    return sendSuccess(
      res,
      subscription,
      "Subscription closed successfully",
      200,
    );
  });

  /**
   * GET /api/v1/subscriptions/:id/events
   */
  getEvents = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(id);

    return sendSuccess(
      res,
      subscription.events || [],
      "Subscription status history retrieved",
      200,
    );
  });

  /**
   * POST /api/v1/subscriptions/calculate-pricing
   */
  calculatePricing = asyncHandler(async (req: Request, res: Response) => {
    const validated = calculatePricingSchema.parse(req.body);
    const pricing = subscriptionService.calculatePricingPreview(validated);

    return sendSuccess(
      res,
      pricing,
      "Subscription pricing calculated successfully",
      200,
    );
  });

  /**
   * GET /api/v1/subscriptions/catalog-preview
   */
  getCatalogPreview = asyncHandler(async (_req: Request, res: Response) => {
    const preview = await subscriptionService.getCatalogPreview();
    return sendSuccess(
      res,
      preview,
      "Catalog preview retrieved for subscription creation",
      200,
    );
  });

  /**
   * GET /api/v1/subscriptions/for-billing
   * Integration endpoint for Member 4's billing run
   */
  getDueForBilling = asyncHandler(async (req: Request, res: Response) => {
    const dueBefore = req.query.dueBefore as string | undefined;
    const subscriptions = await subscriptionService.getDueSubscriptionsForBilling(
      dueBefore,
    );

    return sendSuccess(
      res,
      subscriptions,
      `Retrieved ${subscriptions.length} active subscription(s) due for billing`,
      200,
    );
  });
}

export const subscriptionController = new SubscriptionController();

