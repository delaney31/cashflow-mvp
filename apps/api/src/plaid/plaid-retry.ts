import type { Logger } from '@nestjs/common';
import type { AxiosError } from 'axios';

const RETRYABLE = new Set([
  'RATE_LIMIT_EXCEEDED',
  'INTERNAL_SERVER_ERROR',
  'INSTITUTION_NOT_RESPONDING',
]);

export function isRetryablePlaidError(err: unknown): boolean {
  const ax = err as AxiosError<{ error_code?: string }>;
  const code = ax?.response?.data?.error_code;
  return typeof code === 'string' && RETRYABLE.has(code);
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export async function withPlaidRetry<T>(
  logger: Logger,
  label: string,
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const retry = isRetryablePlaidError(e) && attempt < maxAttempts;
      if (!retry) {
        throw e;
      }
      const delayMs = 250 * 2 ** (attempt - 1);
      logger.warn(`${label} failed (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms`);
      await sleep(delayMs);
    }
  }
  throw last;
}
