import { API_BASE_URL } from './env';
import type {
  AiCoachRequest,
  AiExplanationResponse,
  AlertResponse,
  BalanceResponse,
  BudgetMonthDashboardResponse,
  CategoryListItemResponse,
  DashboardSnapshot,
  GoalResponse,
  LinkedAccountResponse,
  PaginatedResponse,
  RecurringUpcomingResponse,
  TransactionResponse,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Invalid JSON from API', res.status, text);
  }
}

export async function apiFetch<T>(
  path: string,
  options: {
    token: string | null;
    method?: string;
    searchParams?: Record<string, string | undefined>;
    body?: unknown;
  },
): Promise<T> {
  const { token, method = 'GET', searchParams, body } = options;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const url = new URL(path.replace(/^\//, ''), base);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url.toString(), init);
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status === 401 ? 'Unauthorized — sign in or set EXPO_PUBLIC_API_TOKEN' : res.statusText, res.status, body);
  }
  return parseJson<T>(res);
}

export async function fetchDashboardSnapshot(params: {
  token: string | null;
  year: number;
  month: number;
}): Promise<DashboardSnapshot> {
  const { token, year, month } = params;
  const q = { year: String(year), month: String(month), transactionView: 'posted' };

  const [balances, budget, alerts, goals, recurring] = await Promise.all([
    apiFetch<BalanceResponse[]>('/balances', { token }),
    apiFetch<BudgetMonthDashboardResponse>('/budgets/monthly/dashboard', { token, searchParams: q }),
    apiFetch<AlertResponse[]>('/alerts', { token, searchParams: { status: 'active' } }),
    apiFetch<GoalResponse[]>('/goals', { token }),
    apiFetch<RecurringUpcomingResponse[]>('/recurring/upcoming', { token, searchParams: { limit: '8' } }),
  ]);

  return { balances, budget, alerts, goals, recurring };
}

export type TransactionListFilters = {
  page: number;
  limit?: number;
  linkedAccountId?: string;
  from?: string;
  to?: string;
  /** POSTED | PENDING — omit for all */
  status?: 'POSTED' | 'PENDING';
  userCategoryId?: string;
  search?: string;
};

export async function fetchTransactionsPage(params: {
  token: string | null;
  filters: TransactionListFilters;
}): Promise<PaginatedResponse<TransactionResponse>> {
  const { token, filters } = params;
  const { page, limit = 25, linkedAccountId, from, to, status, userCategoryId, search } = filters;
  return apiFetch<PaginatedResponse<TransactionResponse>>('/transactions', {
    token,
    searchParams: {
      page: String(page),
      limit: String(limit),
      linkedAccountId,
      from,
      to,
      status,
      userCategoryId,
      search: search?.trim() || undefined,
    },
  });
}

export async function fetchTransactionById(
  token: string | null,
  id: string,
): Promise<TransactionResponse> {
  return apiFetch<TransactionResponse>(`/transactions/${encodeURIComponent(id)}`, { token });
}

export async function patchTransactionCategory(
  token: string | null,
  transactionId: string,
  body: { userCategoryId?: string },
): Promise<TransactionResponse> {
  return apiFetch<TransactionResponse>(`/transactions/${encodeURIComponent(transactionId)}`, {
    token,
    method: 'PATCH',
    body,
  });
}

export async function fetchCategories(token: string | null): Promise<CategoryListItemResponse[]> {
  return apiFetch<CategoryListItemResponse[]>('/categories', { token });
}

export async function fetchAccounts(token: string | null): Promise<LinkedAccountResponse[]> {
  return apiFetch<LinkedAccountResponse[]>('/accounts', { token });
}

export type GoalListKind = 'active' | 'archived' | 'completed' | 'deleted';

export async function fetchGoalsList(
  token: string | null,
  kind: GoalListKind,
): Promise<GoalResponse[]> {
  const path =
    kind === 'active'
      ? '/goals'
      : kind === 'archived'
        ? '/goals/archived'
        : kind === 'completed'
          ? '/goals/completed'
          : '/goals/deleted';
  return apiFetch<GoalResponse[]>(path, { token });
}

export async function fetchGoalById(token: string | null, id: string): Promise<GoalResponse> {
  return apiFetch<GoalResponse>(`/goals/${encodeURIComponent(id)}`, { token });
}

export type CreateGoalBody = {
  title: string;
  type: string;
  targetAmount: string;
  currentAmount?: string;
  dueDate?: string;
  status?: string;
  priority?: number;
  notes?: string | null;
};

export async function createGoal(token: string | null, body: CreateGoalBody): Promise<GoalResponse> {
  return apiFetch<GoalResponse>('/goals', { token, method: 'POST', body });
}

export type UpdateGoalBody = Partial<CreateGoalBody> & { archivedAt?: string | null };

export async function updateGoal(
  token: string | null,
  id: string,
  body: UpdateGoalBody,
): Promise<GoalResponse> {
  return apiFetch<GoalResponse>(`/goals/${encodeURIComponent(id)}`, {
    token,
    method: 'PATCH',
    body,
  });
}

export async function softDeleteGoal(token: string | null, id: string): Promise<GoalResponse> {
  return apiFetch<GoalResponse>(`/goals/${encodeURIComponent(id)}`, { token, method: 'DELETE' });
}

export async function restoreGoal(token: string | null, id: string): Promise<GoalResponse> {
  return apiFetch<GoalResponse>(`/goals/${encodeURIComponent(id)}/restore`, {
    token,
    method: 'POST',
  });
}

export type AlertsListStatus = 'active' | 'resolved' | 'all';

export async function fetchAlerts(
  token: string | null,
  status: Exclude<AlertsListStatus, 'all'>,
): Promise<AlertResponse[]> {
  return apiFetch<AlertResponse[]>('/alerts', {
    token,
    searchParams: { status },
  });
}

export async function resolveAlert(token: string | null, alertId: string): Promise<AlertResponse> {
  return apiFetch<AlertResponse>(`/alerts/${encodeURIComponent(alertId)}/resolve`, {
    token,
    method: 'POST',
  });
}

export type AlertEvaluationResponse = {
  userId: string;
  evaluatedAt: string;
  upserts: number;
  resolves: number;
};

export async function postEvaluateAlerts(token: string | null): Promise<AlertEvaluationResponse> {
  return apiFetch<AlertEvaluationResponse>('/alerts/evaluate', { token, method: 'POST' });
}

export async function fetchAiMonthlySummary(
  token: string | null,
  q: { year: number; month: number; transactionView?: 'posted' | 'pending' | 'all' },
): Promise<AiExplanationResponse> {
  return apiFetch<AiExplanationResponse>('/ai/explain/monthly-summary', {
    token,
    searchParams: {
      year: String(q.year),
      month: String(q.month),
      transactionView: q.transactionView ?? 'posted',
    },
  });
}

export async function fetchAiBudgetOverrun(
  token: string | null,
  q: { year: number; month: number; transactionView?: 'posted' | 'pending' | 'all' },
): Promise<AiExplanationResponse> {
  return apiFetch<AiExplanationResponse>('/ai/explain/budget-overrun', {
    token,
    searchParams: {
      year: String(q.year),
      month: String(q.month),
      transactionView: q.transactionView ?? 'posted',
    },
  });
}

export type AffordabilityCoachBody = {
  proposedAmount: string;
  label?: string;
  currency?: string;
  compareHorizonMonths?: number;
};

export async function postAiAffordabilityCoach(
  token: string | null,
  body: AffordabilityCoachBody,
): Promise<AiExplanationResponse> {
  return apiFetch<AiExplanationResponse>('/ai/coach/affordability', {
    token,
    method: 'POST',
    body,
  });
}

export async function executeAiCoachRequest(
  token: string | null,
  req: AiCoachRequest,
): Promise<AiExplanationResponse> {
  switch (req.kind) {
    case 'monthly_summary':
      return fetchAiMonthlySummary(token, { year: req.year, month: req.month });
    case 'budget_overrun':
      return fetchAiBudgetOverrun(token, { year: req.year, month: req.month });
    case 'affordability':
      return postAiAffordabilityCoach(token, {
        proposedAmount: req.proposedAmount,
        label: req.label,
      });
  }
}

export async function registerPushDevice(
  token: string | null,
  body: { token: string; platform?: string },
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/notifications/push-devices', {
    token,
    method: 'POST',
    body,
  });
}
