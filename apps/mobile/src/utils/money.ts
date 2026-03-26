/** Sum decimal strings safely for display (MVP — not for accounting). */
export function sumBalanceStrings(amounts: string[]): number {
  return amounts.reduce((acc, s) => acc + (Number.isFinite(Number(s)) ? Number(s) : 0), 0);
}

export function formatUsd(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatUsdFromString(s: string | null | undefined, currency = 'USD'): string {
  if (s === null || s === undefined || s === '') return '—';
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return formatUsd(n, currency);
}
