/**
 * Mirrors API JSON shapes (`apps/api` contracts + budget dashboard).
 * Keep in sync when contracts change.
 */

export type BalanceResponse = {
  linkedAccountId: string;
  balance: string;
  currency: string;
  asOf: string;
  source: 'PLAID' | 'MANUAL' | 'IMPORT';
};

export type BudgetMonthDashboardResponse = {
  period: { year: number; month: number; currency: string };
  budget: {
    monthlyBudgetId: string | null;
    totalBudgetCap: string | null;
    sumOfCategoryCaps: string;
    notes: string | null;
  };
  transactionView: string;
  totals: {
    monthToDateSpend: string;
    forecastedMonthEndSpend: string;
    totalBudgetCap: string | null;
    remainingVsCapActual: string | null;
    remainingVsCapForecast: string | null;
    isOverCapActual: boolean;
    isOverCapForecast: boolean;
    safeToSpendVsForecast: string | null;
  };
  pace: {
    expectedSpendToDate: string | null;
    paceRatio: number | null;
    paceStatus: string;
    monthProgressFraction: number;
  };
  categories: unknown[];
  uncategorized: { monthToDateSpend: string; forecastedMonthEndSpend: string };
};

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

/** Aligns with API `GoalResponse` / Prisma `GoalType` & `GoalStatus` (string JSON). */
export type GoalResponse = {
  id: string;
  title: string;
  type: string;
  targetAmount: string;
  currentAmount: string;
  dueDate: string | null;
  status: string;
  priority: number;
  notes: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export type DashboardSnapshot = {
  balances: BalanceResponse[];
  budget: BudgetMonthDashboardResponse;
  alerts: AlertResponse[];
  goals: GoalResponse[];
  recurring: RecurringUpcomingResponse[];
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

export type CategoryListItemResponse = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export type LinkedAccountResponse = {
  id: string;
  institutionId: string;
  institutionName: string;
  itemId: string;
  plaidItemId: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastSyncedAt: string | null;
};

export type AiStructuredExplanation = {
  headline: string;
  keyPoints: string[];
  cautions?: string[];
  nextSteps?: string[];
  narrative: string;
};

export type AiExplanationResponse = {
  structured: AiStructuredExplanation;
  text: string;
  model: string;
  disclaimer: string;
};

/** Routes mobile coach UI to deterministic AI API calls (no generic chat endpoint). */
export type AiCoachRequest =
  | { kind: 'monthly_summary'; year: number; month: number }
  | { kind: 'budget_overrun'; year: number; month: number }
  | { kind: 'affordability'; proposedAmount: string; label?: string };
