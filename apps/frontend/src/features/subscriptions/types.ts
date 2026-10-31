export type SubscriptionStatus = 'DRAFT' | 'CONFIRMED' | 'ACTIVE' | 'CLOSED';
export type BillingInterval = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface SubscriptionCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  billingAddress?: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  billingInterval: BillingInterval;
  intervalCount: number;
  minimumQuantity: number;
}

export interface SubscriptionLine {
  id: string;
  subscriptionId: string;
  variantId: string;
  descriptionSnapshot: string;
  quantity: number;
  unitPrice: string;
  lineGross: string;
}

export interface SubscriptionPricing {
  subtotal: string;
  discountPercentage: string;
  discountAmount: string;
  taxableAmount: string;
  taxRateSnapshot: string;
  taxAmount: string;
  recurringTotal: string;
}

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  eventType: string;
  previousStatus: string | null;
  newStatus: string | null;
  actorUserId: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customer: SubscriptionCustomer;
  planId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  expiryDate: string | null;
  paymentTermsDays: number;
  currency: string;
  taxId: string | null;
  taxRateSnapshot: string | null;
  discountId: string | null;
  discountPercentage: string;
  lines: SubscriptionLine[];
  pricing: SubscriptionPricing;
  events?: SubscriptionEvent[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CatalogVariant {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string | null;
  defaultPrice: string;
}

export interface CatalogPreview {
  customers: SubscriptionCustomer[];
  plans: SubscriptionPlan[];
  variants: CatalogVariant[];
  taxes: { id: string; name: string; rate: string }[];
  discounts: { id: string; name: string; percentage: string }[];
}

export interface CreateSubscriptionLineItem {
  variantId: string;
  quantity: number;
  customUnitPrice?: number;
}

export interface CreateSubscriptionPayload {
  customerId: string;
  planId: string;
  startDate?: string;
  expiryDate?: string | null;
  paymentTermsDays?: number;
  currency?: string;
  taxId?: string | null;
  discountId?: string | null;
  lines: CreateSubscriptionLineItem[];
}

