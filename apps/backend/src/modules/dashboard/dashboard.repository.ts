import { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { DashboardQuery } from "./dashboard.validation";

const { sql, empty, join } = Prisma;

const and = (conditions: Prisma.Sql[]): Prisma.Sql =>
  conditions.length ? sql`AND ${join(conditions, " AND ")}` : empty;

const customerFilter = (query: DashboardQuery, alias: string): Prisma.Sql[] =>
  query.customerId ? [sql`${Prisma.raw(alias)}.customer_id = ${query.customerId}::uuid`] : [];

const rangeFilter = (query: DashboardQuery, column: string): Prisma.Sql[] => [
  ...(query.from ? [sql`${Prisma.raw(column)} >= ${query.from}`] : []),
  ...(query.to ? [sql`${Prisma.raw(column)} < ${query.to}`] : []),
];

// Per-invoice paid totals, reused by the outstanding and overdue aggregates.
const PAID_PER_INVOICE = sql`
  LEFT JOIN (
    SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
  ) p ON p.invoice_id = i.id`;

export const countActiveSubscriptions = (customerId?: string) =>
  prisma.subscription.count({ where: { status: "ACTIVE", customerId } });

/** Invoices issued in the date range (cancelled excluded unless filtered for). */
export const sumInvoiced = async (query: DashboardQuery) => {
  const conditions = [
    query.status ? sql`i.status = ${query.status}::"InvoiceStatus"` : sql`i.status <> 'CANCELLED'`,
    ...customerFilter(query, "i"),
    ...rangeFilter(query, "i.issue_date"),
  ];
  const rows = await prisma.$queryRaw<{ count: bigint; amount: Prisma.Decimal | null }[]>`
    SELECT COUNT(*) AS count, SUM(i.total_amount) AS amount
    FROM invoices i WHERE TRUE ${and(conditions)}`;
  return rows[0];
};

/** Payments recorded in the date range. */
export const sumPaymentsReceived = async (query: DashboardQuery) => {
  const rows = await prisma.$queryRaw<{ count: bigint; amount: Prisma.Decimal | null }[]>`
    SELECT COUNT(*) AS count, SUM(pay.amount) AS amount
    FROM payments pay JOIN invoices i ON i.id = pay.invoice_id
    WHERE TRUE ${and([...customerFilter(query, "i"), ...rangeFilter(query, "pay.paid_at")])}`;
  return rows[0];
};

/** Current unpaid balance of confirmed invoices, plus the overdue subset (due before now). */
export const sumOutstanding = async (query: DashboardQuery, now: Date) => {
  const rows = await prisma.$queryRaw<
    {
      outstanding_count: bigint;
      outstanding_amount: Prisma.Decimal | null;
      overdue_count: bigint;
      overdue_amount: Prisma.Decimal | null;
    }[]
  >`
    SELECT
      COUNT(*) AS outstanding_count,
      SUM(i.total_amount - COALESCE(p.paid, 0)) AS outstanding_amount,
      COUNT(*) FILTER (WHERE i.due_date < ${now}) AS overdue_count,
      SUM(i.total_amount - COALESCE(p.paid, 0)) FILTER (WHERE i.due_date < ${now}) AS overdue_amount
    FROM invoices i ${PAID_PER_INVOICE}
    WHERE i.status = 'CONFIRMED' AND i.total_amount - COALESCE(p.paid, 0) > 0
    ${and(customerFilter(query, "i"))}`;
  return rows[0];
};

/** Invoice count and total per status for invoices issued in the date range. */
export const invoiceStatusBreakdown = async (query: DashboardQuery) =>
  prisma.$queryRaw<{ status: InvoiceStatus; count: bigint; amount: Prisma.Decimal | null }[]>`
    SELECT i.status, COUNT(*) AS count, SUM(i.total_amount) AS amount
    FROM invoices i
    WHERE TRUE ${and([...customerFilter(query, "i"), ...rangeFilter(query, "i.issue_date")])}
    GROUP BY i.status`;
