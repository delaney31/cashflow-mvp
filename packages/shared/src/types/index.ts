/**
 * Shared domain types for API contracts and clients.
 * Business logic lives in apps; this package holds serializable shapes only.
 */

export type HealthStatus = {
  ok: boolean;
  service: string;
  timestamp: string;
};

/** Placeholder for future API error envelope */
export type ApiError = {
  code: string;
  message: string;
  requestId?: string;
};
