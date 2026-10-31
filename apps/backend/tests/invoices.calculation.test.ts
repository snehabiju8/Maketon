import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import {
  addMonthsClamped,
  calculateInvoice,
  calculatePeriodEnd,
  formatInvoiceNumber,
} from "../src/modules/invoices/invoices.calculation";

const D = (value: string | number) => new Prisma.Decimal(value);
const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("calculateInvoice", () => {
  it("matches the worked example in DATABASE.md section 7", () => {
    const result = calculateInvoice(
      [
        { descriptionSnapshot: "Cloud Storage Basic", quantity: 2, unitPrice: D("199") },
        { descriptionSnapshot: "Email Service", quantity: 5, unitPrice: D("99") },
      ],
      D("10"),
      D("18"),
    );

    expect(result.lines.map((l) => l.lineTotal.toFixed(2))).toEqual(["398.00", "495.00"]);
    expect(result.subtotal.toFixed(2)).toBe("893.00");
    expect(result.discountAmount.toFixed(2)).toBe("89.30");
    expect(result.taxAmount.toFixed(2)).toBe("144.67");
    expect(result.totalAmount.toFixed(2)).toBe("948.37");
  });

  it("uses exact decimals where floating point would drift", () => {
    const result = calculateInvoice(
      [{ descriptionSnapshot: "Item", quantity: 3, unitPrice: D("0.10") }],
      D("0"),
      D("0"),
    );
    expect(result.totalAmount.toFixed(2)).toBe("0.30");
  });

  it("never discounts below zero", () => {
    const result = calculateInvoice(
      [{ descriptionSnapshot: "Item", quantity: 1, unitPrice: D("50") }],
      D("100"),
      D("18"),
    );
    expect(result.discountAmount.toFixed(2)).toBe("50.00");
    expect(result.totalAmount.toFixed(2)).toBe("0.00");
  });
});

describe("billing periods", () => {
  it("clamps month-end dates without rolling into the next month", () => {
    expect(addMonthsClamped(utc("2026-01-31"), 1).toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(addMonthsClamped(utc("2028-01-31"), 1).toISOString()).toBe("2028-02-29T00:00:00.000Z");
    expect(addMonthsClamped(utc("2026-11-30"), 3).toISOString()).toBe("2027-02-28T00:00:00.000Z");
  });

  it("keeps the original month-end anchor across monthly periods", () => {
    const anchor = utc("2026-01-31");
    const feb = calculatePeriodEnd(anchor, anchor, "MONTH", 1);
    const mar = calculatePeriodEnd(anchor, feb, "MONTH", 1);
    const apr = calculatePeriodEnd(anchor, mar, "MONTH", 1);
    expect([feb, mar, apr].map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  it("handles daily, weekly, interval counts and leap-day yearly periods", () => {
    const start = utc("2026-03-10");
    expect(calculatePeriodEnd(start, start, "DAY", 1).toISOString().slice(0, 10)).toBe(
      "2026-03-11",
    );
    expect(calculatePeriodEnd(start, start, "WEEK", 2).toISOString().slice(0, 10)).toBe(
      "2026-03-24",
    );
    expect(calculatePeriodEnd(start, start, "MONTH", 3).toISOString().slice(0, 10)).toBe(
      "2026-06-10",
    );
    const leap = utc("2028-02-29");
    expect(calculatePeriodEnd(leap, leap, "YEAR", 1).toISOString().slice(0, 10)).toBe("2029-02-28");
  });

  it("formats invoice numbers from the sequence", () => {
    expect(formatInvoiceNumber(42n)).toBe("INV-000042");
  });
});
