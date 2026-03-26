/**
 * Stable dedupe keys for idempotent alert evaluation (one open alert per key per user via DB unique).
 * Include period scopes so resolved issues can re-fire in a new month with a new key.
 */

export const AlertTypes = {
  MONTHLY_CAP_EXCEEDED: 'MONTHLY_CAP_EXCEEDED',
  FORECASTED_CAP_BREACH: 'FORECASTED_CAP_BREACH',
  LOW_CHECKING_BALANCE: 'LOW_CHECKING_BALANCE',
  UNUSUAL_LARGE_TRANSACTION: 'UNUSUAL_LARGE_TRANSACTION',
  RECURRING_BILL_RISK: 'RECURRING_BILL_RISK',
  CASH_BUFFER_BELOW_THRESHOLD: 'CASH_BUFFER_BELOW_THRESHOLD',
} as const;

export function dedupeMonthlyCapExceeded(year: number, month: number): string {
  return `${AlertTypes.MONTHLY_CAP_EXCEEDED}:${year}-${String(month).padStart(2, '0')}`;
}

export function dedupeForecastBreach(year: number, month: number): string {
  return `${AlertTypes.FORECASTED_CAP_BREACH}:${year}-${String(month).padStart(2, '0')}`;
}

export function dedupeLowChecking(linkedAccountId: string): string {
  return `${AlertTypes.LOW_CHECKING_BALANCE}:${linkedAccountId}`;
}

export function dedupeLargeTransaction(transactionId: string): string {
  return `${AlertTypes.UNUSUAL_LARGE_TRANSACTION}:${transactionId}`;
}

export function dedupeRecurringRisk(recurringId: string, weekIso: string): string {
  return `${AlertTypes.RECURRING_BILL_RISK}:${recurringId}:${weekIso}`;
}

export function dedupeCashBuffer(goalId: string): string {
  return `${AlertTypes.CASH_BUFFER_BELOW_THRESHOLD}:${goalId}`;
}

/** ISO week id `YYYY-Www` for recurring dedupe window. */
export function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const y = t.getUTCFullYear();
  return `${y}-W${String(weekNo).padStart(2, '0')}`;
}
