/**
 * API response shapes (MVP). Mirrors future persisted models; values may be mock.
 */

import type { GoalStatus, GoalType } from '@cashflow/db';

export type UserProfileResponse = {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type LinkedAccountResponse = {
  id: string;
  institutionId: string;
  institutionName: string;
  /** Internal PlaidItem row id (for manual sync API). */
  itemId: string;
  /** Plaid’s external item_id. */
  plaidItemId: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastSyncedAt: string | null;
};

export type BalanceResponse = {
  linkedAccountId: string;
  balance: string;
  currency: string;
  asOf: string;
  source: 'PLAID' | 'MANUAL' | 'IMPORT';
};

export type RecurringUpcomingResponse = {
  id: string;
  linkedAccountId: string;
  label: string;
  averageAmount: string;
  currency: string;
  frequency: string;
  nextExpectedDate: string | null;
};

export type CategoryListItemResponse = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export type TransactionResponse = {
  id: string;
  linkedAccountId: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'POSTED';
  date: string;
  postedAt: string | null;
  name: string;
  merchantName: string | null;
  aiCategoryId: string | null;
  aiCategoryName: string | null;
  userCategoryId: string | null;
  userCategoryName: string | null;
};

export type MonthlyBudgetLineResponse = {
  id: string;
  name: string;
  categoryId: string | null;
  allocatedAmount: string;
  sortOrder: number;
};

export type MonthlyBudgetResponse = {
  id: string;
  year: number;
  month: number;
  currency: string;
  /** Overall month cap when set. */
  totalBudgetCap: string | null;
  categories: MonthlyBudgetLineResponse[];
};

export type GoalResponse = {
  id: string;
  title: string;
  type: GoalType;
  targetAmount: string;
  currentAmount: string;
  dueDate: string | null;
  status: GoalStatus;
  priority: number;
  notes: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** API-facing severity; includes legacy DB values for older rows. */
export type AlertSeverityApi =
  | 'INFO'
  | 'WARNING'
  | 'CRITICAL'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export type AlertResponse = {
  id: string;
  dedupeKey: string;
  severity: AlertSeverityApi;
  alertType: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AlertEvaluationResponse = {
  userId: string;
  evaluatedAt: string;
  upserts: number;
  resolves: number;
};

/** Structured scenario input (v1) — persisted as JSON. */
export type ScenarioAdjustmentV1 =
  | {
      type: 'one_time_cash';
      label?: string;
      /** Positive = cash in, negative = cash out. */
      amount: string;
    }
  | {
      type: 'recurring_monthly';
      label?: string;
      /** Positive = improves monthly surplus. */
      netMonthlyImpact: string;
    }
  | {
      type: 'debt_payoff';
      label?: string;
      principalPayment: string;
      monthlyPaymentRemoved?: string;
    };

export type ScenarioInputV1 = {
  version: 1;
  horizonMonths: number;
  adjustments: ScenarioAdjustmentV1[];
};

export type ScenarioOutputsV1 = {
  version: 1;
  baseline: {
    periodYear: number;
    periodMonth: number;
    periodLabel: string;
    currency: string;
    projectedMonthlySurplus: string;
    bufferTotal: string;
  };
  deltas: {
    oneTimeNet: string;
    recurringMonthly: string;
  };
  projected: {
    projectedMonthlySurplusAfter: string;
    monthlySurplusDelta: string;
    bufferAfterOneTime: string;
    bufferDeltaAfterOneTime: string;
    bufferAfterHorizon: string;
  };
  adjustmentLines: Array<{
    kind: string;
    label: string | null;
    oneTimeImpact: string | null;
    recurringImpact: string | null;
  }>;
  summaries: string[];
};

export type ScenarioResponse = {
  id: string;
  name: string;
  inputs: ScenarioInputV1;
  outputs: ScenarioOutputsV1 | null;
  createdAt: string;
  updatedAt: string;
};

/** Structured + narrative AI explanation; numbers must originate from deterministic context only. */
export type AiStructuredExplanation = {
  headline: string;
  keyPoints: string[];
  cautions?: string[];
  nextSteps?: string[];
  narrative: string;
};

export type AiExplanationResponse = {
  structured: AiStructuredExplanation;
  /** Same as structured.narrative; convenient for clients that expect `text`. */
  text: string;
  model: string;
  disclaimer: string;
};

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginatedMeta;
};
