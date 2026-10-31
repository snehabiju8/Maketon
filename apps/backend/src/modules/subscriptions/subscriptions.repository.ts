import { Prisma, SubscriptionStatus, BillingInterval } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import {
  SubscriptionDetailsDto,
  SubscriptionQueryFilters,
  SubscriptionCustomerDto,
  SubscriptionPlanDto,
  CatalogVariantPreviewDto,
} from "./subscriptions.types";
import {
  calculateSubscriptionPricing,
  calculateLineGross,
} from "./subscriptions.pricing";
import {
  DEV_FIXTURE_CUSTOMERS,
  DEV_FIXTURE_PLANS,
  DEV_FIXTURE_VARIANTS,
  DEV_FIXTURE_TAXES,
  DEV_FIXTURE_DISCOUNTS,
} from "./subscriptions.fixtures";

export interface CreateSubscriptionRepoData {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  nextBillingDate: Date;
  expiryDate?: Date | null;
  paymentTermsDays: number;
  currency: string;
  taxId?: string | null;
  taxRateSnapshot?: Prisma.Decimal | null;
  discountId?: string | null;
  discountPercentage: Prisma.Decimal;
  lines: {
    variantId: string;
    descriptionSnapshot: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
  }[];
  event: {
    eventType: string;
    previousStatus?: string | null;
    newStatus: string;
    actorUserId?: string | null;
    metadata?: unknown;
  };
}

export class SubscriptionRepository {
  // In-memory store used when PostgreSQL is disconnected or during unit/standalone testing
  private inMemorySubscriptions: Map<string, any> = new Map();
  private inMemoryEvents: Map<string, any[]> = new Map();
  private useInMemory = false;

  constructor() {
    this.seedInitialInMemory();
  }

  private seedInitialInMemory() {
    // Seed one active subscription so the dashboard and list have immediate test data if DB is offline
    const subId = "e6a2b842-83b5-492d-9442-5f6ffc1f0648";
    const subNumber = "SUB-202610-0001";
    const customer = DEV_FIXTURE_CUSTOMERS[0];
    const plan = DEV_FIXTURE_PLANS[0];
    const variant1 = DEV_FIXTURE_VARIANTS[0];
    const variant2 = DEV_FIXTURE_VARIANTS[1];

    const lines = [
      {
        id: "line-1",
        subscriptionId: subId,
        variantId: variant1.id,
        descriptionSnapshot: `${variant1.productName} - ${variant1.variantName}`,
        quantity: 2,
        unitPrice: new Prisma.Decimal(variant1.defaultPrice),
        createdAt: new Date(),
      },
      {
        id: "line-2",
        subscriptionId: subId,
        variantId: variant2.id,
        descriptionSnapshot: `${variant2.productName} - ${variant2.variantName}`,
        quantity: 1,
        unitPrice: new Prisma.Decimal(variant2.defaultPrice),
        createdAt: new Date(),
      },
    ];

    const events = [
      {
        id: "evt-1",
        subscriptionId: subId,
        eventType: "SUBSCRIPTION_CREATED",
        previousStatus: null,
        newStatus: SubscriptionStatus.DRAFT,
        actorUserId: null,
        metadata: { note: "Initial subscription draft created" },
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        id: "evt-2",
        subscriptionId: subId,
        eventType: "SUBSCRIPTION_CONFIRMED",
        previousStatus: SubscriptionStatus.DRAFT,
        newStatus: SubscriptionStatus.CONFIRMED,
        actorUserId: null,
        metadata: { note: "Confirmed by admin" },
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        id: "evt-3",
        subscriptionId: subId,
        eventType: "SUBSCRIPTION_ACTIVATED",
        previousStatus: SubscriptionStatus.CONFIRMED,
        newStatus: SubscriptionStatus.ACTIVE,
        actorUserId: null,
        metadata: { note: "Activated for recurring billing" },
        createdAt: new Date(Date.now() - 1800000),
      },
    ];

    this.inMemorySubscriptions.set(subId, {
      id: subId,
      subscriptionNumber: subNumber,
      customerId: customer.id,
      customer,
      planId: plan.id,
      plan,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      nextBillingDate: new Date(),
      expiryDate: null,
      paymentTermsDays: 15,
      currency: "INR",
      taxId: DEV_FIXTURE_TAXES[0].id,
      taxRateSnapshot: new Prisma.Decimal(DEV_FIXTURE_TAXES[0].rate),
      discountId: DEV_FIXTURE_DISCOUNTS[0].id,
      discountPercentage: new Prisma.Decimal(DEV_FIXTURE_DISCOUNTS[0].percentage),
      lines,
      createdAt: new Date(Date.now() - 3600000 * 2),
      updatedAt: new Date(Date.now() - 1800000),
    });

    this.inMemoryEvents.set(subId, events);
  }

  /**
   * Safe execution wrapper: tries Prisma first; if database is unreachable,
   * falls back to the in-memory store.
   */
  private async safePrisma<T>(
    prismaAction: () => Promise<T>,
    fallbackAction: () => Promise<T> | T,
  ): Promise<T> {
    if (this.useInMemory) {
      return fallbackAction();
    }
    try {
      return await prismaAction();
    } catch (err: any) {
      // If error is DB connection related, switch to in-memory fallback
      if (
        err.message?.includes("Can't reach database") ||
        err.code === "P1001" ||
        err.code === "P1000"
      ) {
        logger.warn(
          "PostgreSQL database is currently unavailable; operating subscription repository in standalone memory mode.",
        );
        this.useInMemory = true;
        return fallbackAction();
      }
      throw err;
    }
  }

  // Customer resolution (Prisma or Dev Fixtures)
  async findCustomerById(customerId: string): Promise<SubscriptionCustomerDto | null> {
    return this.safePrisma(
      async () => {
        const c = await prisma.customer.findUnique({
          where: { id: customerId },
        });
        if (!c) {
          return (
            DEV_FIXTURE_CUSTOMERS.find((cust) => cust.id === customerId) || null
          );
        }
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          billingAddress: c.billingAddress,
        };
      },
      () => DEV_FIXTURE_CUSTOMERS.find((c) => c.id === customerId) || null,
    );
  }

  // Plan resolution
  async findPlanById(planId: string): Promise<SubscriptionPlanDto | null> {
    return this.safePrisma(
      async () => {
        const p = await prisma.plan.findUnique({
          where: { id: planId },
        });
        if (!p) {
          return DEV_FIXTURE_PLANS.find((pl) => pl.id === planId) || null;
        }
        return {
          id: p.id,
          name: p.name,
          billingInterval: p.billingInterval,
          intervalCount: p.intervalCount,
          minimumQuantity: p.minimumQuantity,
          status: p.status,
        };
      },
      () => DEV_FIXTURE_PLANS.find((p) => p.id === planId) || null,
    );
  }

  // Variant resolution
  async findVariantById(variantId: string): Promise<CatalogVariantPreviewDto | null> {
    return this.safePrisma(
      async () => {
        const v = await prisma.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true },
        });
        if (!v) {
          return (
            DEV_FIXTURE_VARIANTS.find((varItem) => varItem.id === variantId) || null
          );
        }
        return {
          id: v.id,
          productId: v.productId,
          productName: v.product.name,
          variantName: v.name,
          sku: v.sku,
          defaultPrice: v.defaultPrice.toFixed(2),
          status: v.status,
          productStatus: v.product.status,
        };
      },
      () => DEV_FIXTURE_VARIANTS.find((v) => v.id === variantId) || null,
    );
  }

  // Tax resolution
  async findTaxById(taxId: string): Promise<{ id: string; name: string; rate: Prisma.Decimal } | null> {
    return this.safePrisma(
      async () => {
        const t = await prisma.tax.findUnique({ where: { id: taxId } });
        if (!t) {
          const fix = DEV_FIXTURE_TAXES.find((item) => item.id === taxId);
          return fix ? { id: fix.id, name: fix.name, rate: new Prisma.Decimal(fix.rate) } : null;
        }
        return { id: t.id, name: t.name, rate: t.rate };
      },
      () => {
        const fix = DEV_FIXTURE_TAXES.find((item) => item.id === taxId);
        return fix ? { id: fix.id, name: fix.name, rate: new Prisma.Decimal(fix.rate) } : null;
      },
    );
  }

  // Discount resolution
  async findDiscountById(discountId: string): Promise<{ id: string; name: string; percentage: Prisma.Decimal } | null> {
    return this.safePrisma(
      async () => {
        const d = await prisma.discount.findUnique({ where: { id: discountId } });
        if (!d) {
          const fix = DEV_FIXTURE_DISCOUNTS.find((item) => item.id === discountId);
          return fix ? { id: fix.id, name: fix.name, percentage: new Prisma.Decimal(fix.percentage) } : null;
        }
        return { id: d.id, name: d.name, percentage: d.percentage };
      },
      () => {
        const fix = DEV_FIXTURE_DISCOUNTS.find((item) => item.id === discountId);
        return fix ? { id: fix.id, name: fix.name, percentage: new Prisma.Decimal(fix.percentage) } : null;
      },
    );
  }

  // Get sequence count for subscription number generation
  async getNextSubscriptionSequenceNumber(): Promise<number> {
    return this.safePrisma(
      async () => {
        const count = await prisma.subscription.count();
        return count + 1;
      },
      () => this.inMemorySubscriptions.size + 1,
    );
  }

  // Create Subscription in transaction
  async createSubscription(data: CreateSubscriptionRepoData): Promise<SubscriptionDetailsDto> {
    return this.safePrisma(
      async () => {
        const result = await prisma.$transaction(async (tx) => {
          const sub = await tx.subscription.create({
            data: {
              id: data.id,
              subscriptionNumber: data.subscriptionNumber,
              customerId: data.customerId,
              planId: data.planId,
              status: data.status,
              startDate: data.startDate,
              nextBillingDate: data.nextBillingDate,
              expiryDate: data.expiryDate,
              paymentTermsDays: data.paymentTermsDays,
              currency: data.currency,
              taxId: data.taxId,
              taxRateSnapshot: data.taxRateSnapshot,
              discountId: data.discountId,
              discountPercentage: data.discountPercentage,
              lines: {
                create: data.lines.map((l) => ({
                  variantId: l.variantId,
                  descriptionSnapshot: l.descriptionSnapshot,
                  quantity: l.quantity,
                  unitPrice: l.unitPrice,
                })),
              },
              events: {
                create: {
                  eventType: data.event.eventType,
                  previousStatus: data.event.previousStatus,
                  newStatus: data.event.newStatus,
                  actorUserId: data.event.actorUserId,
                  metadata: data.event.metadata as any,
                },
              },
            },
            include: {
              customer: true,
              plan: true,
              lines: true,
              events: true,
            },
          });
          return sub;
        });

        return this.mapPrismaToDetailsDto(result);
      },
      () => {
        const customer =
          DEV_FIXTURE_CUSTOMERS.find((c) => c.id === data.customerId) || {
            id: data.customerId,
            name: "Customer",
            email: "customer@example.com",
          };

        const plan =
          DEV_FIXTURE_PLANS.find((p) => p.id === data.planId) || {
            id: data.planId,
            name: "Plan",
            billingInterval: BillingInterval.MONTH,
            intervalCount: 1,
            minimumQuantity: 1,
          };

        const lines = data.lines.map((l, idx) => ({
          id: `line-${Date.now()}-${idx}`,
          subscriptionId: data.id,
          variantId: l.variantId,
          descriptionSnapshot: l.descriptionSnapshot,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          createdAt: new Date(),
        }));

        const events = [
          {
            id: `evt-${Date.now()}`,
            subscriptionId: data.id,
            eventType: data.event.eventType,
            previousStatus: data.event.previousStatus || null,
            newStatus: data.event.newStatus,
            actorUserId: data.event.actorUserId || null,
            metadata: data.event.metadata || {},
            createdAt: new Date(),
          },
        ];

        const record = {
          id: data.id,
          subscriptionNumber: data.subscriptionNumber,
          customerId: data.customerId,
          customer,
          planId: data.planId,
          plan,
          status: data.status,
          startDate: data.startDate,
          nextBillingDate: data.nextBillingDate,
          expiryDate: data.expiryDate || null,
          paymentTermsDays: data.paymentTermsDays,
          currency: data.currency,
          taxId: data.taxId || null,
          taxRateSnapshot: data.taxRateSnapshot || null,
          discountId: data.discountId || null,
          discountPercentage: data.discountPercentage,
          lines,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.inMemorySubscriptions.set(data.id, record);
        this.inMemoryEvents.set(data.id, events);

        return this.mapRecordToDetailsDto(record, events);
      },
    );
  }

  // Find Subscription by ID
  async findById(id: string): Promise<SubscriptionDetailsDto | null> {
    return this.safePrisma(
      async () => {
        const sub = await prisma.subscription.findUnique({
          where: { id },
          include: {
            customer: true,
            plan: true,
            lines: true,
            events: {
              orderBy: { createdAt: "desc" },
            },
          },
        });
        if (!sub) {
          const mem = this.inMemorySubscriptions.get(id);
          if (mem) {
            return this.mapRecordToDetailsDto(mem, this.inMemoryEvents.get(id) || []);
          }
          return null;
        }
        return this.mapPrismaToDetailsDto(sub);
      },
      () => {
        const mem = this.inMemorySubscriptions.get(id);
        if (!mem) return null;
        return this.mapRecordToDetailsDto(mem, this.inMemoryEvents.get(id) || []);
      },
    );
  }

  // Find Subscription by Subscription Number
  async findBySubscriptionNumber(subscriptionNumber: string): Promise<SubscriptionDetailsDto | null> {
    return this.safePrisma(
      async () => {
        const sub = await prisma.subscription.findUnique({
          where: { subscriptionNumber },
          include: {
            customer: true,
            plan: true,
            lines: true,
            events: { orderBy: { createdAt: "desc" } },
          },
        });
        if (!sub) return null;
        return this.mapPrismaToDetailsDto(sub);
      },
      () => {
        for (const sub of this.inMemorySubscriptions.values()) {
          if (sub.subscriptionNumber === subscriptionNumber) {
            return this.mapRecordToDetailsDto(sub, this.inMemoryEvents.get(sub.id) || []);
          }
        }
        return null;
      },
    );
  }

  // Query and list subscriptions
  async findMany(filters: SubscriptionQueryFilters): Promise<{ subscriptions: SubscriptionDetailsDto[]; total: number }> {
    return this.safePrisma(
      async () => {
        const where: Prisma.SubscriptionWhereInput = {};
        if (filters.status) where.status = filters.status;
        if (filters.customerId) where.customerId = filters.customerId;
        if (filters.planId) where.planId = filters.planId;
        if (filters.search) {
          where.OR = [
            { subscriptionNumber: { contains: filters.search, mode: "insensitive" } },
            { customer: { name: { contains: filters.search, mode: "insensitive" } } },
          ];
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
          prisma.subscription.findMany({
            where,
            include: {
              customer: true,
              plan: true,
              lines: true,
              events: { orderBy: { createdAt: "desc" }, take: 1 },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.subscription.count({ where }),
        ]);

        if (total === 0 && this.inMemorySubscriptions.size > 0) {
          return this.filterInMemory(filters);
        }

        return {
          subscriptions: records.map((r) => this.mapPrismaToDetailsDto(r)),
          total,
        };
      },
      () => this.filterInMemory(filters),
    );
  }

  private filterInMemory(filters: SubscriptionQueryFilters) {
    let all = Array.from(this.inMemorySubscriptions.values());
    if (filters.status) {
      all = all.filter((s) => s.status === filters.status);
    }
    if (filters.customerId) {
      all = all.filter((s) => s.customerId === filters.customerId);
    }
    if (filters.planId) {
      all = all.filter((s) => s.planId === filters.planId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      all = all.filter(
        (s) =>
          s.subscriptionNumber.toLowerCase().includes(q) ||
          s.customer.name.toLowerCase().includes(q),
      );
    }

    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = all.length;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);

    return {
      subscriptions: paged.map((s) =>
        this.mapRecordToDetailsDto(s, this.inMemoryEvents.get(s.id) || []),
      ),
      total,
    };
  }

  // Update Status with Event
  async updateStatus(
    subscriptionId: string,
    newStatus: SubscriptionStatus,
    previousStatus: SubscriptionStatus,
    eventType: string,
    nextBillingDate?: Date,
    actorUserId?: string | null,
    metadata?: unknown,
  ): Promise<SubscriptionDetailsDto> {
    return this.safePrisma(
      async () => {
        const updateData: Prisma.SubscriptionUpdateInput = {
          status: newStatus,
        };
        if (nextBillingDate) {
          updateData.nextBillingDate = nextBillingDate;
        }

        const updated = await prisma.$transaction(async (tx) => {
          const sub = await tx.subscription.update({
            where: { id: subscriptionId },
            data: {
              ...updateData,
              events: {
                create: {
                  eventType,
                  previousStatus,
                  newStatus,
                  actorUserId,
                  metadata: metadata as any,
                },
              },
            },
            include: {
              customer: true,
              plan: true,
              lines: true,
              events: { orderBy: { createdAt: "desc" } },
            },
          });
          return sub;
        });

        return this.mapPrismaToDetailsDto(updated);
      },
      () => {
        const sub = this.inMemorySubscriptions.get(subscriptionId);
        if (!sub) {
          throw new Error("Subscription not found");
        }
        sub.status = newStatus;
        if (nextBillingDate) {
          sub.nextBillingDate = nextBillingDate;
        }
        sub.updatedAt = new Date();

        const event = {
          id: `evt-${Date.now()}`,
          subscriptionId,
          eventType,
          previousStatus,
          newStatus,
          actorUserId: actorUserId || null,
          metadata: metadata || {},
          createdAt: new Date(),
        };

        const events = this.inMemoryEvents.get(subscriptionId) || [];
        events.unshift(event);
        this.inMemoryEvents.set(subscriptionId, events);

        return this.mapRecordToDetailsDto(sub, events);
      },
    );
  }

  // Find due subscriptions for billing run (Member 4 interface)
  async findDueSubscriptions(dueBefore: Date): Promise<SubscriptionDetailsDto[]> {
    return this.safePrisma(
      async () => {
        const records = await prisma.subscription.findMany({
          where: {
            status: SubscriptionStatus.ACTIVE,
            nextBillingDate: { lte: dueBefore },
          },
          include: {
            customer: true,
            plan: true,
            lines: true,
            events: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: { nextBillingDate: "asc" },
        });

        if (records.length === 0 && this.inMemorySubscriptions.size > 0) {
          return this.findDueInMemory(dueBefore);
        }

        return records.map((r) => this.mapPrismaToDetailsDto(r));
      },
      () => this.findDueInMemory(dueBefore),
    );
  }

  private findDueInMemory(dueBefore: Date): SubscriptionDetailsDto[] {
    const active = Array.from(this.inMemorySubscriptions.values()).filter(
      (s) =>
        s.status === SubscriptionStatus.ACTIVE &&
        s.nextBillingDate.getTime() <= dueBefore.getTime(),
    );
    return active.map((s) =>
      this.mapRecordToDetailsDto(s, this.inMemoryEvents.get(s.id) || []),
    );
  }

  // Catalog preview for independent development
  async getCatalogPreview(): Promise<{
    customers: SubscriptionCustomerDto[];
    plans: SubscriptionPlanDto[];
    variants: CatalogVariantPreviewDto[];
    taxes: { id: string; name: string; rate: string }[];
    discounts: { id: string; name: string; percentage: string }[];
  }> {
    return this.safePrisma(
      async () => {
        const [customers, plans, variants, taxes, discounts] = await Promise.all([
          prisma.customer.findMany({ take: 50 }),
          prisma.plan.findMany({ take: 50 }),
          prisma.productVariant.findMany({ include: { product: true }, take: 50 }),
          prisma.tax.findMany({ where: { isActive: true }, take: 50 }),
          prisma.discount.findMany({ where: { isActive: true }, take: 50 }),
        ]);

        return {
          customers:
            customers.length > 0
              ? customers.map((c) => ({
                  id: c.id,
                  name: c.name,
                  email: c.email,
                  phone: c.phone,
                  billingAddress: c.billingAddress,
                }))
              : DEV_FIXTURE_CUSTOMERS,
          plans:
            plans.length > 0
              ? plans.map((p) => ({
                  id: p.id,
                  name: p.name,
                  billingInterval: p.billingInterval,
                  intervalCount: p.intervalCount,
                  minimumQuantity: p.minimumQuantity,
                  status: p.status,
                }))
              : DEV_FIXTURE_PLANS,
          variants:
            variants.length > 0
              ? variants.map((v) => ({
                  id: v.id,
                  productId: v.productId,
                  productName: v.product.name,
                  variantName: v.name,
                  sku: v.sku,
                  defaultPrice: v.defaultPrice.toFixed(2),
                  status: v.status,
                  productStatus: v.product.status,
                }))
              : DEV_FIXTURE_VARIANTS,
          taxes:
            taxes.length > 0
              ? taxes.map((t) => ({ id: t.id, name: t.name, rate: t.rate.toFixed(2) }))
              : DEV_FIXTURE_TAXES,
          discounts:
            discounts.length > 0
              ? discounts.map((d) => ({
                  id: d.id,
                  name: d.name,
                  percentage: d.percentage.toFixed(2),
                }))
              : DEV_FIXTURE_DISCOUNTS,
        };
      },
      () => ({
        customers: DEV_FIXTURE_CUSTOMERS,
        plans: DEV_FIXTURE_PLANS,
        variants: DEV_FIXTURE_VARIANTS,
        taxes: DEV_FIXTURE_TAXES,
        discounts: DEV_FIXTURE_DISCOUNTS,
      }),
    );
  }

  // DTO Mappers
  private mapPrismaToDetailsDto(sub: any): SubscriptionDetailsDto {
    const lines = sub.lines.map((l: any) => ({
      id: l.id,
      subscriptionId: l.subscriptionId,
      variantId: l.variantId,
      descriptionSnapshot: l.descriptionSnapshot,
      quantity: l.quantity,
      unitPrice: l.unitPrice.toFixed(2),
      lineGross: calculateLineGross(l.unitPrice, l.quantity),
    }));

    const pricing = calculateSubscriptionPricing({
      lines: sub.lines,
      taxRate: sub.taxRateSnapshot,
      discountPercentage: sub.discountPercentage,
    });

    const events = sub.events
      ? sub.events.map((e: any) => ({
          id: e.id,
          subscriptionId: e.subscriptionId,
          eventType: e.eventType,
          previousStatus: e.previousStatus,
          newStatus: e.newStatus,
          actorUserId: e.actorUserId,
          metadata: e.metadata,
          createdAt: e.createdAt.toISOString(),
        }))
      : [];

    return {
      id: sub.id,
      subscriptionNumber: sub.subscriptionNumber,
      customerId: sub.customerId,
      customer: {
        id: sub.customer.id,
        name: sub.customer.name,
        email: sub.customer.email,
        phone: sub.customer.phone,
        billingAddress: sub.customer.billingAddress,
      },
      planId: sub.planId,
      plan: {
        id: sub.plan.id,
        name: sub.plan.name,
        billingInterval: sub.plan.billingInterval,
        intervalCount: sub.plan.intervalCount,
        minimumQuantity: sub.plan.minimumQuantity,
      },
      status: sub.status,
      startDate: sub.startDate.toISOString(),
      nextBillingDate: sub.nextBillingDate.toISOString(),
      expiryDate: sub.expiryDate ? sub.expiryDate.toISOString() : null,
      paymentTermsDays: sub.paymentTermsDays,
      currency: sub.currency,
      taxId: sub.taxId,
      taxRateSnapshot: sub.taxRateSnapshot ? sub.taxRateSnapshot.toFixed(2) : null,
      discountId: sub.discountId,
      discountPercentage: sub.discountPercentage.toFixed(2),
      lines,
      pricing,
      events,
      itemCount: lines.length,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    };
  }

  private mapRecordToDetailsDto(record: any, events: any[]): SubscriptionDetailsDto {
    const lines = record.lines.map((l: any) => ({
      id: l.id,
      subscriptionId: l.subscriptionId,
      variantId: l.variantId,
      descriptionSnapshot: l.descriptionSnapshot,
      quantity: l.quantity,
      unitPrice: l.unitPrice.toFixed(2),
      lineGross: calculateLineGross(l.unitPrice, l.quantity),
    }));

    const pricing = calculateSubscriptionPricing({
      lines: record.lines,
      taxRate: record.taxRateSnapshot,
      discountPercentage: record.discountPercentage,
    });

    return {
      id: record.id,
      subscriptionNumber: record.subscriptionNumber,
      customerId: record.customerId,
      customer: record.customer,
      planId: record.planId,
      plan: record.plan,
      status: record.status,
      startDate: record.startDate.toISOString(),
      nextBillingDate: record.nextBillingDate.toISOString(),
      expiryDate: record.expiryDate ? record.expiryDate.toISOString() : null,
      paymentTermsDays: record.paymentTermsDays,
      currency: record.currency,
      taxId: record.taxId || null,
      taxRateSnapshot: record.taxRateSnapshot
        ? record.taxRateSnapshot.toFixed(2)
        : null,
      discountId: record.discountId || null,
      discountPercentage: record.discountPercentage.toFixed(2),
      lines,
      pricing,
      events: events.map((e) => ({
        id: e.id,
        subscriptionId: e.subscriptionId,
        eventType: e.eventType,
        previousStatus: e.previousStatus,
        newStatus: e.newStatus,
        actorUserId: e.actorUserId,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
      })),
      itemCount: lines.length,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

export const subscriptionRepository = new SubscriptionRepository();
