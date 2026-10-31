// Display-only formatting. Amounts arrive from the backend as exact decimal strings;
// they are converted to numbers here only to render them, never for calculations.

export const formatCurrency = (amount: string | number, currency = 'INR'): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(amount));

// Billing dates are stored in UTC, so render them in UTC to avoid off-by-one days.
export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso)
  );

const DAY_MS = 24 * 60 * 60 * 1000;

/** Billing periods are half-open [start, end); show the last included day. */
export const formatPeriod = (start: string, end: string): string =>
  `${formatDate(start)} – ${formatDate(new Date(new Date(end).getTime() - DAY_MS).toISOString())}`;
