import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { AppError } from "../../utils/app-error";
import {
  addDays,
  calculateInvoice,
  calculatePeriodEnd,
  formatInvoiceNumber,
} from "./invoices.calculation";
import * as invoicesRepository from "./invoices.repository";
import { ListInvoicesQuery } from "./invoices.validation";
import { BillingRunSummary } from "./invoices.types";

const Decimal = Prisma.Decimal;

// Neon round trips add latency, so allow more than Prisma's 5s default per billing transaction.
const TRANSACTION_OPTIONS = { maxWait: 10000, timeout: 20000 };
// Upper bound on missed periods backfilled for one subscription in a single run.
const MAX_PERIODS_PER_SUBSCRIPTION = 60;

type PeriodOutcome = "created" | "skipped" | "not_due";

/**
 * Bills the subscription's current due period inside one transaction:
 * lock -> re-check eligibility -> skip if invoiced -> create invoice + lines -> advance date.
 */
const billNextPeriod = async (subscriptionId: string, now: Date): Promise<PeriodOutcome> =>
  prisma.$transaction(async (tx) => {
    await invoicesRepository.lockSubscription(tx, subscriptionId);
    const subscription = await invoicesRepository.findSubscriptionForBilling(tx, subscriptionId);

    if (!subscription || subscription.status !== "ACTIVE" || subscription.nextBillingDate > now) {
      return "not_due";
    }

    const periodStart = subscription.nextBillingDate;
    if (subscription.expiryDate && periodStart > subscription.expiryDate) {
      return "not_due";
    }

    const periodEnd = calculatePeriodEnd(
      subscription.startDate,
      periodStart,
      subscription.plan.billingInterval,
      subscription.plan.intervalCount,
    );

    // Period already invoiced (e.g. an earlier run failed after commit): just move the date on.
    if (await invoicesRepository.findInvoiceForPeriod(tx, subscriptionId, periodStart)) {
      await invoicesRepository.updateNextBillingDate(tx, subscriptionId, periodEnd);
      return "skipped";
    }

    if (subscription.lines.length === 0) {
      throw AppError.unprocessable("Subscription has no lines to bill", "EMPTY_SUBSCRIPTION");
    }

    const taxRate = subscription.taxRateSnapshot ?? subscription.tax?.rate ?? new Decimal(0);
    const calculated = calculateInvoice(
      subscription.lines,
      subscription.discountPercentage,
      taxRate,
    );
    const invoiceNumber = formatInvoiceNumber(await invoicesRepository.nextInvoiceSequence(tx));

    await invoicesRepository.createInvoice(tx, {
      invoiceNumber,
      subscriptionId,
      customerId: subscription.customerId,
      periodStart,
      periodEnd,
      issueDate: now,
      dueDate: addDays(now, subscription.paymentTermsDays),
      status: "DRAFT",
      currency: subscription.currency,
      subtotal: calculated.subtotal,
      discountPercentage: subscription.discountPercentage,
      discountAmount: calculated.discountAmount,
      taxNameSnapshot: subscription.tax?.name ?? null,
      taxRate,
      taxAmount: calculated.taxAmount,
      totalAmount: calculated.totalAmount,
      lines: {
        create: calculated.lines.map((line) => ({
          descriptionSnapshot: line.descriptionSnapshot,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        })),
      },
    });

    await invoicesRepository.updateNextBillingDate(tx, subscriptionId, periodEnd);
    return "created";
  }, TRANSACTION_OPTIONS);

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/**
 * Admin-triggered billing run. Each period is committed separately, so a failure in one
 * subscription neither rolls back nor blocks the others. Safe to run repeatedly or concurrently.
 */
export const runBilling = async (now: Date = new Date()): Promise<BillingRunSummary> => {
  const summary: BillingRunSummary = {
    subscriptionsProcessed: 0,
    totalProcessed: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  const subscriptionIds = await invoicesRepository.findDueSubscriptionIds(now);

  for (const subscriptionId of subscriptionIds) {
    summary.subscriptionsProcessed += 1;

    for (let period = 0; period < MAX_PERIODS_PER_SUBSCRIPTION; period += 1) {
      let outcome: PeriodOutcome;
      try {
        outcome = await billNextPeriod(subscriptionId, now);
      } catch (error) {
        if (isUniqueViolation(error)) {
          // A concurrent run invoiced this period first; the next iteration re-reads the subscription.
          summary.totalProcessed += 1;
          summary.skipped += 1;
          continue;
        }
        const reason = error instanceof AppError ? error.message : "Unexpected billing error";
        logger.error({ subscriptionId, err: error }, "Billing failed for subscription");
        summary.totalProcessed += 1;
        summary.failed += 1;
        summary.failures.push({ subscriptionId, reason });
        break;
      }

      if (outcome === "not_due") break;
      summary.totalProcessed += 1;
      summary[outcome] += 1;
    }
  }

  logger.info({ ...summary, failures: summary.failures.length }, "Billing run completed");
  return summary;
};

const withBalance = <T extends { totalAmount: Prisma.Decimal }>(
  invoice: T,
  paid: Prisma.Decimal,
) => ({
  ...invoice,
  paidAmount: paid.toFixed(2),
  outstandingAmount: invoice.totalAmount.sub(paid).toFixed(2),
});

export const listInvoices = async (query: ListInvoicesQuery) => {
  const { items, total } = await invoicesRepository.listInvoices(query);
  const paidByInvoice = await invoicesRepository.sumPaymentsByInvoice(items.map((i) => i.id));

  return {
    items: items.map((invoice) =>
      withBalance(invoice, paidByInvoice.get(invoice.id) ?? new Decimal(0)),
    ),
    pagination: { page: query.page, pageSize: query.pageSize, total },
  };
};

export const getInvoice = async (id: string) => {
  const invoice = await invoicesRepository.findInvoiceById(id);
  if (!invoice) {
    throw AppError.notFound("Invoice not found");
  }
  const paid = invoice.payments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));
  return withBalance(invoice, paid);
};

export const confirmInvoice = async (id: string) => {
  const confirmed = await invoicesRepository.transitionInvoiceStatus(
    prisma,
    id,
    ["DRAFT"],
    "CONFIRMED",
  );
  if (!confirmed) {
    const current = await invoicesRepository.findInvoiceStatus(id);
    if (!current) throw AppError.notFound("Invoice not found");
    throw AppError.conflict(
      `Only draft invoices can be confirmed (current status: ${current.status})`,
      "INVALID_INVOICE_TRANSITION",
    );
  }
  return getInvoice(id);
};

export const cancelInvoice = async (id: string) => {
  await prisma.$transaction(async (tx) => {
    const invoice = await invoicesRepository.lockInvoice(tx, id);
    if (!invoice) throw AppError.notFound("Invoice not found");

    if (invoice.status !== "DRAFT" && invoice.status !== "CONFIRMED") {
      throw AppError.conflict(
        `Only draft or confirmed invoices can be cancelled (current status: ${invoice.status})`,
        "INVALID_INVOICE_TRANSITION",
      );
    }
    if ((await invoicesRepository.countInvoicePayments(tx, id)) > 0) {
      throw AppError.conflict(
        "Invoices with recorded payments cannot be cancelled",
        "INVOICE_HAS_PAYMENTS",
      );
    }
    await invoicesRepository.transitionInvoiceStatus(tx, id, [invoice.status], "CANCELLED");
  }, TRANSACTION_OPTIONS);

  return getInvoice(id);
};
