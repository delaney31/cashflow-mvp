export const QUEUE_PLAID_SYNC = 'plaid-sync';
export const QUEUE_RECURRING_DETECTION = 'recurring-detection';
export const QUEUE_FORECAST_RECOMPUTE = 'forecast-recompute';
export const QUEUE_ALERT_GENERATION = 'alert-generation';

export const defaultJobOptions = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
};
