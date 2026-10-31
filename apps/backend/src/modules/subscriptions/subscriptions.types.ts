import {
  Prisma,
  SubscriptionStatus,
  BillingInterval,
  PlanStatus,
  VariantStatus,
  ProductStatus,
} from "@prisma/client";

export { SubscriptionStatus, BillingInterval, PlanStatus, VariantStatus, ProductStatus };

export interface SubscriptionPricingBreakdown {
  subtotal: string;
  discountPercentage: string;
  discountAmount: string;
  taxableAmount: string;
  taxRateSnapshot: string;
  taxAmount: string;
  recurringTotal: string;
}

export interface SubscriptionLineItemInput {
  variantId: string;
  quantity: number;
  customUnitPrice?: number | string | Prisma.Decimal;
}

export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  startDate?: string | Date;
  expiryDate?: string | Date | null;
  paymentTermsDays?: number;
  currency?: string;
  taxId?: string | null;
  discountId?: string | null;
  lines: SubscriptionLineItemInput[];
}

export interface UpdateSubscriptionInput {
  planId?: string;
  startDate?: string | Date;
  expiryDate?: string | Date | null;
  paymentTermsDays?: number;
  currency?: string;
  taxId?: string | null;
  discountId?: string | null;
  lines?: SubscriptionLineItemInput[];
}

export interface SubscriptionQueryFilters {
  status?: SubscriptionStatus;
  customerId?: string;
  planId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubscriptionLineDto {
  id: string;
  subscriptionId: string;
  variantId: string;
  descriptionSnapshot: string;
  quantity: number;
  unitPrice: string;
  lineGross: string;
}

export interface SubscriptionEventDto {
  id: string;
  subscriptionId: string;
  eventType: string;
  previousStatus: string | null;
  newStatus: string | null;
  actorUserId: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface SubscriptionCustomerDto {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  billingAddress?: string | null;
}

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  billingInterval: BillingInterval;
  intervalCount: number;
  minimumQuantity: number;
  status?: PlanStatus;
}

export interface SubscriptionDetailsDto {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customer: SubscriptionCustomerDto;
  planId: string;
  plan: SubscriptionPlanDto;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  expiryDate: string | null;
  paymentTermsDays: number;
  currency: string;
  taxId: string | null;
  taxRateSnapshot: string | null;
  taxNameSnapshot?: string | null;
  discountId: string | null;
  discountPercentage: string;
  lines: SubscriptionLineDto[];
  pricing: SubscriptionPricingBreakdown;
  events?: SubscriptionEventDto[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSubscriptionsDto {
  subscriptions: SubscriptionDetailsDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CatalogVariantPreviewDto {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string | null;
  defaultPrice: string;
  status?: VariantStatus;
  productStatus?: ProductStatus;
}

export interface CatalogPreviewDto {
  customers: SubscriptionCustomerDto[];
  plans: SubscriptionPlanDto[];
  variants: CatalogVariantPreviewDto[];
  taxes: { id: string; name: string; rate: string }[];
  discounts: { id: string; name: string; percentage: string }[];
}
