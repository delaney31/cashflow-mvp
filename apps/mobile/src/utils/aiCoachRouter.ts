/**
 * Maps free-form user text to deterministic AI coach API calls (no generic chat endpoint).
 */

import type { AiCoachRequest } from '../api/types';

export function currentMonthUtc(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** Starter chips → concrete API request. */
export function requestFromStarter(id: string): AiCoachRequest {
  const { year, month } = currentMonthUtc();
  switch (id) {
    case 'afford_this':
      return {
        kind: 'affordability',
        proposedAmount: '1000.00',
        label: 'Planned purchase',
      };
    case 'over_budget':
      return { kind: 'budget_overrun', year, month };
    case 'car':
      return { kind: 'affordability', proposedAmount: '25000.00', label: 'Car purchase (hypothetical)' };
    case 'safe_spend':
      return { kind: 'monthly_summary', year, month };
    default:
      return { kind: 'monthly_summary', year, month };
  }
}

/**
 * Heuristic routing for typed questions. Defaults to monthly summary (broad cash-flow view).
 */
export function requestFromUserMessage(text: string): AiCoachRequest {
  const t = text.toLowerCase().trim();
  const { year, month } = currentMonthUtc();

  if (
    (t.includes('over') || t.includes('exceed') || t.includes('overrun')) &&
    (t.includes('budget') || t.includes('cap') || t.includes('spend'))
  ) {
    return { kind: 'budget_overrun', year, month };
  }

  if (
    t.includes('safe') ||
    t.includes('this week') ||
    t.includes('left to spend') ||
    (t.includes('how much') && (t.includes('spend') || t.includes('week')))
  ) {
    return { kind: 'monthly_summary', year, month };
  }

  if (t.includes('car') || t.includes('vehicle') || t.includes('auto loan')) {
    const m = text.match(/\$?\s*([\d,]+(?:\.\d{1,4})?)/);
    const amt = m ? m[1].replace(/,/g, '') : '25000';
    return { kind: 'affordability', proposedAmount: amt.includes('.') ? amt : `${amt}.00`, label: 'Car purchase (hypothetical)' };
  }

  if (
    t.includes('afford') ||
    t.includes('can i buy') ||
    t.includes('can i pay') ||
    t.includes('purchase') ||
    t.includes('if i spend')
  ) {
    const m = text.match(/\$?\s*([\d,]+(?:\.\d{1,4})?)/);
    const raw = m ? m[1].replace(/,/g, '') : '500';
    const proposedAmount = raw.includes('.') ? raw : `${raw}.00`;
    return { kind: 'affordability', proposedAmount, label: 'From your message' };
  }

  return { kind: 'monthly_summary', year, month };
}
