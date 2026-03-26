/**
 * Budget & spending-cap engine — dashboard payload for mobile clients.
 * Amounts are decimal strings (two/four places) in `currency` for the budget month.
 */

export type BudgetTransactionView = 'posted' | 'pending' | 'all';

export type BudgetPaceStatus = 'under_spending' | 'on_track' | 'over_spending';

export type BudgetMonthPeriod = {
  year: number;
  month: number;
  currency: string;
};

export type BudgetEnvelopeMeta = {
  monthlyBudgetId: string | null;
  /** Overall month cap when set in DB. */
  totalBudgetCap: string | null;
  /** Sum of category line `allocatedAmount` (informational). */
  sumOfCategoryCaps: string;
  notes: string | null;
};

export type BudgetTotalsBlock = {
  monthToDateSpend: string;
  forecastedMonthEndSpend: string;
  /** Effective total cap: `totalBudgetCap` when set, otherwise null (category-only mode). */
  totalBudgetCap: string | null;
  remainingVsCapActual: string | null;
  remainingVsCapForecast: string | null;
  isOverCapActual: boolean;
  isOverCapForecast: boolean;
  /** `max(0, totalCap - forecast)` when total cap is set; else null. */
  safeToSpendVsForecast: string | null;
};

export type BudgetPaceBlock = {
  /** Expected spend by “today” if spending were linear: `cap * progress`. */
  expectedSpendToDate: string | null;
  /** `mtdSpend / expectedSpendToDate` when both defined. */
  paceRatio: number | null;
  paceStatus: BudgetPaceStatus;
  /** Fraction of month elapsed in [0,1] (UTC calendar days). */
  monthProgressFraction: number;
};

export type BudgetCategoryRow = {
  budgetLineId: string;
  name: string;
  categoryId: string | null;
  cap: string;
  monthToDateSpend: string;
  forecastedMonthEndSpend: string;
  remainingVsCapActual: string | null;
  remainingVsCapForecast: string | null;
  isOverCapActual: boolean;
  isOverCapForecast: boolean;
};

export type BudgetUncategorizedBlock = {
  monthToDateSpend: string;
  forecastedMonthEndSpend: string;
};

export type BudgetMonthDashboardResponse = {
  period: BudgetMonthPeriod;
  budget: BudgetEnvelopeMeta;
  transactionView: BudgetTransactionView;
  totals: BudgetTotalsBlock;
  pace: BudgetPaceBlock;
  categories: BudgetCategoryRow[];
  uncategorized: BudgetUncategorizedBlock;
};
