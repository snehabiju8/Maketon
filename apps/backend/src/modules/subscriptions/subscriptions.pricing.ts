import { Prisma } from "@prisma/client";
import { SubscriptionPricingBreakdown } from "./subscriptions.types";

export interface LineForCalculation {
  unitPrice: number | string | Prisma.Decimal;
  quantity: number;
}

export interface PricingCalculationInput {
  lines: LineForCalculation[];
  taxRate?: number | string | Prisma.Decimal | null;
  discountPercentage?: number | string | Prisma.Decimal | null;
}

/**
 * Calculates line totals and subscription pricing breakdown using Prisma.Decimal
 * to ensure exact monetary calculations without floating-point inaccuracies.
 */
export const calculateSubscriptionPricing = (
  input: PricingCalculationInput,
): SubscriptionPricingBreakdown => {
  const zero = new Prisma.Decimal(0);
  const hundred = new Prisma.Decimal(100);

  // 1. Calculate Subtotal (sum of unitPrice * quantity)
  let subtotal = zero;
  for (const line of input.lines) {
    const unitPrice = new Prisma.Decimal(line.unitPrice.toString());
    const qty = new Prisma.Decimal(line.quantity);
    const lineGross = unitPrice.mul(qty);
    subtotal = subtotal.add(lineGross);
  }

  // 2. Calculate Discount
  const discPct = input.discountPercentage
    ? new Prisma.Decimal(input.discountPercentage.toString())
    : zero;
  
  // discountAmount = round(subtotal * (discountPercentage / 100), 2)
  const discountAmount = discPct.gt(zero)
    ? subtotal.mul(discPct).div(hundred).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    : zero;

  // 3. Calculate Taxable Amount (Subtotal - Discount Amount)
  const taxableAmount = subtotal.sub(discountAmount);

  // 4. Calculate Tax
  const taxRate = input.taxRate
    ? new Prisma.Decimal(input.taxRate.toString())
    : zero;

  // taxAmount = round(taxableAmount * (taxRate / 100), 2)
  const taxAmount = taxRate.gt(zero)
    ? taxableAmount.mul(taxRate).div(hundred).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    : zero;

  // 5. Grand Recurring Total
  const recurringTotal = taxableAmount.add(taxAmount);

  return {
    subtotal: subtotal.toFixed(2),
    discountPercentage: discPct.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    taxableAmount: taxableAmount.toFixed(2),
    taxRateSnapshot: taxRate.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    recurringTotal: recurringTotal.toFixed(2),
  };
};

/**
 * Calculates a single line item's gross amount: unitPrice * quantity
 */
export const calculateLineGross = (
  unitPrice: number | string | Prisma.Decimal,
  quantity: number,
): string => {
  const price = new Prisma.Decimal(unitPrice.toString());
  const qty = new Prisma.Decimal(quantity);
  return price.mul(qty).toFixed(2);
};

