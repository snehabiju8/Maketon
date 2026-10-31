export interface BillingRunSummary {
  /** Due subscriptions examined in this run. */
  subscriptionsProcessed: number;
  /** Billing periods with a committed outcome (created + skipped + failed). */
  totalProcessed: number;
  created: number;
  skipped: number;
  failed: number;
  failures: { subscriptionId: string; reason: string }[];
}
