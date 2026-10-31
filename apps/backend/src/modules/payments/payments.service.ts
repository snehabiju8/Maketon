import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import * as paymentsRepository from "./payments.repository";
import { ListPaymentsQuery, RecordPaymentInput } from "./payments.validation";

const TRANSACTION_OPTIONS = { maxWait: 10000, timeout: 20000 };

/**
 * Records a manual payment. The invoice row is locked for the whole transaction, so
 * concurrent payments cannot together exceed the outstanding balance.
 */
export const recordPayment = async (
  invoiceId: string,
  input: RecordPaymentInput,
  recordedBy: string,
) =>
  prisma.$transaction(async (tx) => {
    const invoice = await paymentsRepository.lockInvoiceForPayment(tx, invoiceId);
    if (!invoice) {
      throw AppError.notFound("Invoice not found");
    }
    if (invoice.status !== "CONFIRMED") {
      throw AppError.conflict(
        `Payments can only be recorded against confirmed invoices (current status: ${invoice.status})`,
        "INVOICE_NOT_PAYABLE",
      );
    }

    const amount = new Prisma.Decimal(input.amount);
    const paid = await paymentsRepository.sumInvoicePayments(tx, invoiceId);
    const outstanding = invoice.total_amount.sub(paid);

    if (amount.gt(outstanding)) {
      throw AppError.unprocessable(
        `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}`,
        "PAYMENT_EXCEEDS_BALANCE",
      );
    }

    const payment = await paymentsRepository.createPayment(tx, {
      invoiceId,
      amount,
      paymentMethod: input.paymentMethod,
      reference: input.reference || null,
      paidAt: input.paidAt ?? new Date(),
      recordedBy,
    });

    const remaining = outstanding.sub(amount);
    const status = remaining.isZero() ? "PAID" : "CONFIRMED";
    if (status === "PAID") {
      await paymentsRepository.markInvoicePaid(tx, invoiceId);
    }

    return {
      payment,
      invoice: {
        id: invoiceId,
        status,
        totalAmount: invoice.total_amount.toFixed(2),
        paidAmount: paid.add(amount).toFixed(2),
        outstandingAmount: remaining.toFixed(2),
      },
    };
  }, TRANSACTION_OPTIONS);

export const listInvoicePayments = async (invoiceId: string) => {
  if (!(await paymentsRepository.invoiceExists(invoiceId))) {
    throw AppError.notFound("Invoice not found");
  }
  return paymentsRepository.listInvoicePayments(invoiceId);
};

export const listPayments = async (query: ListPaymentsQuery) => {
  const { items, total } = await paymentsRepository.listPayments(query);
  return { items, pagination: { page: query.page, pageSize: query.pageSize, total } };
};
