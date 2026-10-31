import { randomUUID } from "node:crypto";
import { Prisma, SubscriptionStatus, BillingInterval } from "@prisma/client";
import { AppError } from "../../utils/app-error";
import {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  SubscriptionDetailsDto,
  SubscriptionQueryFilters,
  PaginatedSubscriptionsDto,
  CatalogPreviewDto,
} from "./subscriptions.types";
import {
  subscriptionRepository,
  SubscriptionRepository,
} from "./subscriptions.repository";
import { calculateSubscriptionPricing } from "./subscriptions.pricing";

export class SubscriptionService {
  constructor(
    private readonly repo: SubscriptionRepository = subscriptionRepository,
  ) {}

  /**
   * Generates a unique, concurrency-safe subscription number: SUB-YYYYMM-XXXX
   */
  async generateSubscriptionNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `SUB-${year}${month}`;

    const seq = await this.repo.getNextSubscriptionSequenceNumber();
    let candidate = `${prefix}-${String(seq).padStart(4, "0")}`;

    // Verify uniqueness
    const existing = await this.repo.findBySubscriptionNumber(candidate);
    if (!existing) {
      return candidate;
    }

    // If collision, append timestamp slice
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomSuffix}`;
  }

  /**
   * Create a new Subscription in DRAFT status
   */
  async createSubscription(
    input: CreateSubscriptionInput,
    actorUserId?: string | null,
  ): Promise<SubscriptionDetailsDto> {
    // 1. Verify Customer
    const customer = await this.repo.findCustomerById(input.customerId);
    if (!customer) {
      throw AppError.notFound(`Customer with ID ${input.customerId} not found`);
    }

    // 2. Verify Plan
    const plan = await this.repo.findPlanById(input.planId);
    if (!plan) {
      throw AppError.notFound(`Subscription plan with ID ${input.planId} not found`);
    }

    // 3. Validate Line Items and Plan Minimum Quantity
    let totalQuantity = 0;
    const resolvedLines: {
      variantId: string;
      descriptionSnapshot: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
    }[] = [];

    for (const line of input.lines) {
      if (line.quantity < 1) {
        throw AppError.badRequest("Quantity for each item must be at least 1");
      }

      const variant = await this.repo.findVariantById(line.variantId);
      if (!variant) {
        throw AppError.notFound(`Product variant with ID ${line.variantId} not found`);
      }

      totalQuantity += line.quantity;

      // Price snapshot: customUnitPrice or variant.defaultPrice
      const unitPriceVal =
        line.customUnitPrice !== undefined && line.customUnitPrice !== null
          ? line.customUnitPrice.toString()
          : variant.defaultPrice;

      const unitPriceDecimal = new Prisma.Decimal(unitPriceVal);
      if (unitPriceDecimal.lt(0)) {
        throw AppError.badRequest("Unit price cannot be negative");
      }

      resolvedLines.push({
        variantId: variant.id,
        descriptionSnapshot: `${variant.productName} - ${variant.variantName}`,
        quantity: line.quantity,
        unitPrice: unitPriceDecimal,
      });
    }

    // Check Plan Minimum Quantity requirement (FR-PL4 / PRD)
    if (totalQuantity < plan.minimumQuantity) {
      throw AppError.badRequest(
        `Total quantity (${totalQuantity}) does not satisfy plan minimum quantity requirement of ${plan.minimumQuantity}`,
      );
    }

    // 4. Tax snapshot
    let taxRateSnapshot: Prisma.Decimal | null = null;
    let taxId: string | null = null;
    if (input.taxId) {
      const tax = await this.repo.findTaxById(input.taxId);
      if (!tax) {
        throw AppError.notFound(`Tax configuration with ID ${input.taxId} not found`);
      }
      taxId = tax.id;
      taxRateSnapshot = tax.rate;
    }

    // 5. Discount snapshot
    let discountPercentage = new Prisma.Decimal(0);
    let discountId: string | null = null;
    if (input.discountId) {
      const discount = await this.repo.findDiscountById(input.discountId);
      if (!discount) {
        throw AppError.notFound(`Discount configuration with ID ${input.discountId} not found`);
      }
      discountId = discount.id;
      discountPercentage = discount.percentage;
    }

    // 6. Dates and Payment Terms
    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    if (expiryDate && expiryDate <= startDate) {
      throw AppError.badRequest("Expiry date must be after subscription start date");
    }

    const nextBillingDate = new Date(startDate);
    const subNumber = await this.generateSubscriptionNumber();
    const subId = randomUUID();

    // 7. Persist via repository
    return await this.repo.createSubscription({
      id: subId,
      subscriptionNumber: subNumber,
      customerId: customer.id,
      planId: plan.id,
      status: SubscriptionStatus.DRAFT,
      startDate,
      nextBillingDate,
      expiryDate,
      paymentTermsDays: input.paymentTermsDays || 15,
      currency: input.currency || "INR",
      taxId,
      taxRateSnapshot,
      discountId,
      discountPercentage,
      lines: resolvedLines,
      event: {
        eventType: "SUBSCRIPTION_CREATED",
        previousStatus: null,
        newStatus: SubscriptionStatus.DRAFT,
        actorUserId,
        metadata: {
          note: "Subscription draft created",
          totalQuantity,
          lineCount: resolvedLines.length,
        },
      },
    });
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(id: string): Promise<SubscriptionDetailsDto> {
    const sub = await this.repo.findById(id);
    if (!sub) {
      throw AppError.notFound(`Subscription with ID ${id} not found`);
    }
    return sub;
  }

  /**
   * List subscriptions with pagination and search/filters
   */
  async listSubscriptions(
    filters: SubscriptionQueryFilters,
  ): Promise<PaginatedSubscriptionsDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const { subscriptions, total } = await this.repo.findMany(filters);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Transition: DRAFT -> CONFIRMED
   */
  async confirmSubscription(
    id: string,
    actorUserId?: string | null,
  ): Promise<SubscriptionDetailsDto> {
    const sub = await this.getSubscriptionById(id);

    if (sub.status !== SubscriptionStatus.DRAFT) {
      throw AppError.conflict(
        `Cannot confirm subscription in '${sub.status}' status. Only DRAFT subscriptions can be confirmed.`,
        "INVALID_STATUS_TRANSITION",
      );
    }

    if (sub.lines.length === 0) {
      throw AppError.badRequest("Cannot confirm subscription without line items");
    }

    return await this.repo.updateStatus(
      id,
      SubscriptionStatus.CONFIRMED,
      SubscriptionStatus.DRAFT,
      "SUBSCRIPTION_CONFIRMED",
      undefined,
      actorUserId,
      { note: "Subscription confirmed and ready for activation" },
    );
  }

  /**
   * Transition: CONFIRMED -> ACTIVE
   * Sets nextBillingDate = startDate (if in the future, or now)
   */
  async activateSubscription(
    id: string,
    actorUserId?: string | null,
  ): Promise<SubscriptionDetailsDto> {
    const sub = await this.getSubscriptionById(id);

    if (sub.status !== SubscriptionStatus.CONFIRMED) {
      throw AppError.conflict(
        `Cannot activate subscription in '${sub.status}' status. Only CONFIRMED subscriptions can be activated.`,
        "INVALID_STATUS_TRANSITION",
      );
    }

    // Verify next billing date is initialized
    const startDate = new Date(sub.startDate);
    const nextBillingDate = startDate > new Date() ? startDate : new Date();

    return await this.repo.updateStatus(
      id,
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.CONFIRMED,
      "SUBSCRIPTION_ACTIVATED",
      nextBillingDate,
      actorUserId,
      {
        note: "Subscription activated and eligible for billing",
        activatedAt: new Date().toISOString(),
      },
    );
  }

  /**
   * Transition: DRAFT | CONFIRMED | ACTIVE -> CLOSED
   */
  async closeSubscription(
    id: string,
    reason?: string,
    actorUserId?: string | null,
  ): Promise<SubscriptionDetailsDto> {
    const sub = await this.getSubscriptionById(id);

    if (sub.status === SubscriptionStatus.CLOSED) {
      throw AppError.conflict(
        "Subscription is already in CLOSED status",
        "INVALID_STATUS_TRANSITION",
      );
    }

    return await this.repo.updateStatus(
      id,
      SubscriptionStatus.CLOSED,
      sub.status,
      "SUBSCRIPTION_CLOSED",
      undefined,
      actorUserId,
      {
        reason: reason || "Manual closure requested",
        closedAt: new Date().toISOString(),
      },
    );
  }

  /**
   * Preview Pricing Calculation (without saving)
   */
  calculatePricingPreview(input: {
    lines: { unitPrice: number | string; quantity: number }[];
    taxRate?: number | string | null;
    discountPercentage?: number | string | null;
  }) {
    return calculateSubscriptionPricing(input);
  }

  /**
   * Fetch Catalog Preview for independent development
   */
  async getCatalogPreview(): Promise<CatalogPreviewDto> {
    return await this.repo.getCatalogPreview();
  }

  /**
   * Member 4 Billing Integration: Query subscriptions due for billing
   */
  async getDueSubscriptionsForBilling(dueBeforeDate?: string | Date): Promise<SubscriptionDetailsDto[]> {
    const date = dueBeforeDate ? new Date(dueBeforeDate) : new Date();
    return await this.repo.findDueSubscriptions(date);
  }

  /**
   * Calculates the next billing date given current period and interval
   */
  static calculateNextBillingDate(
    currentBillingDate: Date,
    interval: BillingInterval,
    intervalCount: number = 1,
  ): Date {
    const next = new Date(currentBillingDate);
    switch (interval) {
      case BillingInterval.DAY:
        next.setDate(next.getDate() + intervalCount);
        break;
      case BillingInterval.WEEK:
        next.setDate(next.getDate() + intervalCount * 7);
        break;
      case BillingInterval.MONTH:
        next.setMonth(next.getMonth() + intervalCount);
        break;
      case BillingInterval.YEAR:
        next.setFullYear(next.getFullYear() + intervalCount);
        break;
    }
    return next;
  }
}

export const subscriptionService = new SubscriptionService();
