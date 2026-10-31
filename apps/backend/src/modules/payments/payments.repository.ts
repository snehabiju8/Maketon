import { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ListPaymentsQuery } from "./payments.validation";

type Db = Prisma.TransactionClient;

/** Row-locks the invoice so concurrent payments for it are processed one at a time. */
export const lockInvoiceForPayment = async (db: Db, invoiceId: string) => {
  const rows = await db.$queryRaw<{ status: InvoiceStatus; total_amount: Prisma.Decimal }[]>`
    SELECT status, total_amount FROM invoices WHERE id = ${invoiceId}::uuid FOR UPDATE`;
  return rows[0] ?? null;
};

export const sumInvoicePayments = async (db: Db, invoiceId: string): Promise<Prisma.Decimal> => {
  const result = await db.payment.aggregate({ where: { invoiceId }, _sum: { amount: true } });
  return result._sum.amount ?? new Prisma.Decimal(0);
};

export const createPayment = (db: Db, data: Prisma.PaymentUncheckedCreateInput) =>
  db.payment.create({ data });

export const markInvoicePaid = (db: Db, invoiceId: string) =>
  db.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } });

export const invoiceExists = async (invoiceId: string): Promise<boolean> =>
  (await prisma.invoice.count({ where: { id: invoiceId } })) > 0;

const paymentInclude = {
  invoice: {
    select: {
      id: true,
      invoiceNumber: true,
      customer: { select: { id: true, name: true } },
    },
  },
  user: { select: { id: true, name: true } },
} satisfies Prisma.PaymentInclude;

export const listPayments = async (query: ListPaymentsQuery) => {
  const where: Prisma.PaymentWhereInput = {
    invoiceId: query.invoiceId,
    paymentMethod: query.paymentMethod,
    invoice: query.customerId ? { customerId: query.customerId } : undefined,
    paidAt: query.from || query.to ? { gte: query.from, lt: query.to } : undefined,
  };
  const [items, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: paymentInclude,
    }),
    prisma.payment.count({ where }),
  ]);
  return { items, total };
};

export const listInvoicePayments = (invoiceId: string) =>
  prisma.payment.findMany({
    where: { invoiceId },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    include: paymentInclude,
  });
