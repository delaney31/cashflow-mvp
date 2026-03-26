/**
 * API response shapes (MVP). Mirrors future persisted models; values may be mock.
 */

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
  categories: MonthlyBudgetLineResponse[];
};

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

export type AlertResponse = {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alertType: string;
  title: string;
  body: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type ScenarioResponse = {
  id: string;
  name: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
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
