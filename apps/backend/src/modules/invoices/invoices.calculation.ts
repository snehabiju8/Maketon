import { BillingInterval, Prisma } from "@prisma/client";

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;

const DAY_MS = 24 * 60 * 60 * 1000;
const HUNDRED = new Decimal(100);

/** Rounds a monetary value to 2 decimal places using half-up rounding. */
export const roundMoney = (value: Decimal): Decimal =>
  value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

// Billing dates are calculated in UTC, the single business timezone for billing.
const daysInMonthUtc = (year: number, month: number): number =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/**
 * Adds calendar months to a date, clamping to the last day of the target month
 * (31 Jan + 1 month = 28/29 Feb), keeping the time of day.
 */
export const addMonthsClamped = (date: Date, months: number): Date => {
  const totalMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths % 12;
  const day = Math.min(date.getUTCDate(), daysInMonthUtc(year, month));
  return new Date(
    Date.UTC(
      year,
      month,
      day,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
};

export const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

/**
 * Returns the exclusive end of the billing period that starts at `periodStart`
 * (half-open interval [periodStart, periodEnd)).
 *
 * Monthly and yearly periods are derived from the subscription's original billing
 * anchor so month-end subscriptions do not drift (31 Jan -> 28 Feb -> 31 Mar).
 */
export const calculatePeriodEnd = (
  anchor: Date,
  periodStart: Date,
  interval: BillingInterval,
  intervalCount: number,
): Date => {
  switch (interval) {
    case "DAY":
      return addDays(periodStart, intervalCount);
    case "WEEK":
      return addDays(periodStart, 7 * intervalCount);
    case "MONTH":
    case "YEAR": {
      const step = interval === "YEAR" ? 12 * intervalCount : intervalCount;
      const monthsFromAnchor =
        (periodStart.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
        (periodStart.getUTCMonth() - anchor.getUTCMonth());
      return addMonthsClamped(anchor, monthsFromAnchor + step);
    }
  }
};

export interface BillableLine {
  descriptionSnapshot: string;
  quantity: number;
  unitPrice: Decimal;
}

export interface CalculatedInvoice {
  lines: (BillableLine & { lineTotal: Decimal })[];
  subtotal: Decimal;
  discountAmount: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
}

/**
 * Calculates invoice amounts as defined in docs/DATABASE.md section 7:
 * subtotal -> discount -> taxable amount -> tax (rounded) -> total.
 */
export const calculateInvoice = (
  lines: BillableLine[],
  discountPercentage: Decimal,
  taxRate: Decimal,
): CalculatedInvoice => {
  const calculatedLines = lines.map((line) => ({
    ...line,
    lineTotal: roundMoney(line.unitPrice.mul(line.quantity)),
  }));

  const subtotal = calculatedLines.reduce((sum, line) => sum.add(line.lineTotal), new Decimal(0));
  const discountAmount = Decimal.min(
    subtotal,
    roundMoney(subtotal.mul(discountPercentage).div(HUNDRED)),
  );
  const taxableAmount = subtotal.sub(discountAmount);
  const taxAmount = roundMoney(taxableAmount.mul(taxRate).div(HUNDRED));

  return {
    lines: calculatedLines,
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount: taxableAmount.add(taxAmount),
  };
};

export const formatInvoiceNumber = (sequenceValue: bigint | number): string =>
  `INV-${sequenceValue.toString().padStart(6, "0")}`;
