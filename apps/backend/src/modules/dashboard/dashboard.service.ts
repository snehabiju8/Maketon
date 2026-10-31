import { InvoiceStatus, Prisma } from "@prisma/client";
import * as dashboardRepository from "./dashboard.repository";
import { DashboardQuery } from "./dashboard.validation";

const money = (value: Prisma.Decimal | null): string => (value ?? new Prisma.Decimal(0)).toFixed(2);

/**
 * Finance summary (PRD 5.9). Invoiced and received amounts respect the date range;
 * outstanding and overdue are current balances, filtered by customer only.
 */
export const getSummary = async (query: DashboardQuery, now: Date = new Date()) => {
  const [activeSubscriptions, invoiced, received, outstanding, breakdown] = await Promise.all([
    dashboardRepository.countActiveSubscriptions(query.customerId),
    dashboardRepository.sumInvoiced(query),
    dashboardRepository.sumPaymentsReceived(query),
    dashboardRepository.sumOutstanding(query, now),
    dashboardRepository.invoiceStatusBreakdown(query),
  ]);

  const byStatus = Object.values(InvoiceStatus).map((status) => {
    const row = breakdown.find((r) => r.status === status);
    return { status, count: Number(row?.count ?? 0), amount: money(row?.amount ?? null) };
  });

  return {
    activeSubscriptions,
    invoiced: { count: Number(invoiced.count), amount: money(invoiced.amount) },
    paymentsReceived: { count: Number(received.count), amount: money(received.amount) },
    outstanding: {
      count: Number(outstanding.outstanding_count),
      amount: money(outstanding.outstanding_amount),
    },
    overdue: {
      count: Number(outstanding.overdue_count),
      amount: money(outstanding.overdue_amount),
    },
    invoicesByStatus: byStatus,
    generatedAt: now.toISOString(),
  };
};
