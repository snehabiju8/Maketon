import { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { subscriptionService } from "../subscriptions/subscriptions.service";
import { ListInvoicesQuery } from "./invoices.validation";

type Db = Prisma.TransactionClient;

// Due subscriptions are discovered via the subscriptions service (SUBSCRIPTION_API_CONTRACT 5).
// Inside the billing transaction the row is then locked and re-read directly, which the
// service cannot do because it does not accept a transaction client.
export const findDueSubscriptionIds = async (now: Date): Promise<string[]> => {
  const due = await subscriptionService.getDueSubscriptionsForBilling(now);
  return due.map((subscription) => subscription.id);
};

/** Row-locks the subscription for the rest of the transaction so concurrent runs serialize. */
export const lockSubscription = async (db: Db, subscriptionId: string): Promise<void> => {
  await db.$queryRaw`SELECT id FROM subscriptions WHERE id = ${subscriptionId}::uuid FOR UPDATE`;
};

export const findSubscriptionForBilling = (db: Db, subscriptionId: string) =>
  db.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: { select: { billingInterval: true, intervalCount: true } },
      tax: { select: { name: true, rate: true } },
      lines: { orderBy: { createdAt: "asc" } },
    },
  });

export type SubscriptionForBilling = NonNullable<
  Awaited<ReturnType<typeof findSubscriptionForBilling>>
>;

export const findInvoiceForPeriod = (db: Db, subscriptionId: string, periodStart: Date) =>
  db.invoice.findUnique({
    where: { subscriptionId_periodStart: { subscriptionId, periodStart } },
    select: { id: true },
  });

// Arbitrary constant key for the transaction-scoped advisory lock that serializes numbering.
const INVOICE_NUMBER_LOCK_KEY = 74_100_001;

/**
 * Returns the next invoice sequence number. The advisory lock is held until the surrounding
 * transaction commits, so concurrent billing runs cannot read the same MAX value
 * (docs/DATABASE.md 3.11: concurrency-safe, not COUNT + 1). No schema change required.
 */
export const nextInvoiceSequence = async (db: Db): Promise<bigint> => {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(${INVOICE_NUMBER_LOCK_KEY}::bigint)`;
  const rows = await db.$queryRaw<{ value: bigint }[]>`
    SELECT COALESCE(MAX(SUBSTRING(invoice_number FROM 5)::bigint), 0) + 1 AS value
    FROM invoices WHERE invoice_number ~ '^INV-[0-9]+$'`;
  return rows[0].value;
};

export const createInvoice = (db: Db, data: Prisma.InvoiceUncheckedCreateInput) =>
  db.invoice.create({ data, select: { id: true, invoiceNumber: true } });

export const updateNextBillingDate = (db: Db, subscriptionId: string, nextBillingDate: Date) =>
  db.subscription.update({ where: { id: subscriptionId }, data: { nextBillingDate } });

const buildListWhere = (query: ListInvoicesQuery): Prisma.InvoiceWhereInput => ({
  status: query.status,
  customerId: query.customerId,
  subscriptionId: query.subscriptionId,
  issueDate: query.from || query.to ? { gte: query.from, lt: query.to } : undefined,
});

export const listInvoices = async (query: ListInvoicesQuery) => {
  const where = buildListWhere(query);
  const [items, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      orderBy: [{ issueDate: "desc" }, { invoiceNumber: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        customer: { select: { id: true, name: true } },
        subscription: { select: { id: true, subscriptionNumber: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);
  return { items, total };
};

export const sumPaymentsByInvoice = async (invoiceIds: string[]) => {
  if (invoiceIds.length === 0) return new Map<string, Prisma.Decimal>();
  const groups = await prisma.payment.groupBy({
    by: ["invoiceId"],
    where: { invoiceId: { in: invoiceIds } },
    _sum: { amount: true },
  });
  return new Map(groups.map((g) => [g.invoiceId, g._sum.amount ?? new Prisma.Decimal(0)]));
};

export const findInvoiceById = (id: string) =>
  prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, billingAddress: true } },
      subscription: {
        select: { id: true, subscriptionNumber: true, plan: { select: { id: true, name: true } } },
      },
      lines: true,
      payments: {
        orderBy: { paidAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

export const findInvoiceStatus = (id: string) =>
  prisma.invoice.findUnique({ where: { id }, select: { status: true } });

/** Atomically moves an invoice from one status to another; returns false if it was not in `from`. */
export const transitionInvoiceStatus = async (
  db: Db,
  id: string,
  from: InvoiceStatus[],
  to: InvoiceStatus,
): Promise<boolean> => {
  const result = await db.invoice.updateMany({
    where: { id, status: { in: from } },
    data: { status: to },
  });
  return result.count === 1;
};

/** Row-locks the invoice; payments lock the same row, so cancellation and payments serialize. */
export const lockInvoice = async (db: Db, id: string) => {
  const rows = await db.$queryRaw<{ status: InvoiceStatus }[]>`
    SELECT status FROM invoices WHERE id = ${id}::uuid FOR UPDATE`;
  return rows[0] ?? null;
};

export const countInvoicePayments = (db: Db, invoiceId: string) =>
  db.payment.count({ where: { invoiceId } });
