import type { AlertResponse } from '../api/types';

export type AlertContextKind = 'budget' | 'account' | 'transaction' | 'goal' | 'recurring';

export type AlertContextLine = {
  key: string;
  kind: AlertContextKind;
  label: string;
  /** Primary line shown in lists */
  primary: string;
  /** Secondary detail (optional) */
  secondary?: string;
  /** IDs for navigation / lookups */
  linkedAccountId?: string;
  transactionId?: string;
  goalId?: string;
  recurringId?: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(y: unknown, m: unknown): string | null {
  if (typeof y !== 'number' || typeof m !== 'number' || m < 1 || m > 12) return null;
  return `${MONTHS[m - 1]} ${y}`;
}

/**
 * Derives human-readable source context from API metadata (see alert-engine.service).
 */
export function buildAlertContextLines(alert: AlertResponse): AlertContextLine[] {
  const meta = alert.metadata ?? {};
  const lines: AlertContextLine[] = [];

  const period = monthLabel(meta.year, meta.month);
  if (period && (alert.alertType === 'MONTHLY_CAP_EXCEEDED' || alert.alertType === 'FORECASTED_CAP_BREACH')) {
    lines.push({
      key: 'budget',
      kind: 'budget',
      label: 'Budget',
      primary: period,
      secondary: meta.view === 'posted' ? 'Posted transactions' : undefined,
    });
  }

  if (typeof meta.linkedAccountId === 'string') {
    lines.push({
      key: 'account',
      kind: 'account',
      label: 'Account',
      primary: meta.linkedAccountId,
      linkedAccountId: meta.linkedAccountId,
    });
  }

  if (typeof meta.transactionId === 'string') {
    lines.push({
      key: 'transaction',
      kind: 'transaction',
      label: 'Transaction',
      primary: meta.transactionId,
      transactionId: meta.transactionId,
    });
  }

  if (typeof meta.goalId === 'string') {
    const gt = typeof meta.goalType === 'string' ? meta.goalType.replace(/_/g, ' ') : null;
    lines.push({
      key: 'goal',
      kind: 'goal',
      label: 'Goal',
      primary: gt ? `${gt} · ${meta.goalId.slice(0, 8)}…` : meta.goalId,
      goalId: meta.goalId,
    });
  }

  if (typeof meta.recurringId === 'string') {
    const when =
      typeof meta.nextExpectedDate === 'string' ? meta.nextExpectedDate.slice(0, 10) : undefined;
    lines.push({
      key: 'recurring',
      kind: 'recurring',
      label: 'Recurring bill',
      primary: when ?? meta.recurringId,
      secondary:
        typeof meta.averageAmount === 'string' ? `~${meta.averageAmount}` : undefined,
      recurringId: meta.recurringId,
    });
  }

  return lines;
}

export function formatAlertTypeLabel(alertType: string): string {
  return alertType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
