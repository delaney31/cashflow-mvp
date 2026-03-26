import { Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus } from '@cashflow/db';
import { PrismaService } from '../prisma/prisma.service';
import type {
  BudgetCategoryRow,
  BudgetMonthDashboardResponse,
  BudgetPaceBlock,
  BudgetPaceStatus,
  BudgetTotalsBlock,
  BudgetTransactionView,
  BudgetUncategorizedBlock,
} from './budget-dashboard.types';

const ZERO = new Prisma.Decimal(0);

/** Plaid-style: positive amount = outflow (spend) for typical depository accounts. */
function expensePortion(amount: Prisma.Decimal): Prisma.Decimal {
  return amount.gt(0) ? amount : ZERO;
}

function toMoneyString(x: Prisma.Decimal): string {
  return x.toDecimalPlaces(4).toFixed(2);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Inclusive UTC calendar days elapsed in [year-month] as of `now` (1..daysInMonth or 0 if before month). */
export function daysElapsedInMonthUtc(year: number, month: number, now: Date): number {
  const dim = daysInMonth(year, month);
  const start = Date.UTC(year, month - 1, 1);
  const end = Date.UTC(year, month - 1, dim, 23, 59, 59, 999);
  const t = now.getTime();
  if (t < start) return 0;
  if (t > end) return dim;
  const day = now.getUTCDate();
  return day;
}

export function linearForecastMonthEnd(
  mtdSpend: Prisma.Decimal,
  year: number,
  month: number,
  now: Date,
): Prisma.Decimal {
  const dim = daysInMonth(year, month);
  const elapsed = daysElapsedInMonthUtc(year, month, now);
  if (elapsed <= 0) return ZERO;
  return mtdSpend.mul(dim).div(elapsed);
}

@Injectable()
export class BudgetEngineService {
  constructor(private readonly prisma: PrismaService) {}

  monthBoundsUtc(year: number, month: number): { start: Date; end: Date } {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const lastDay = daysInMonth(year, month);
    const end = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));
    return { start, end };
  }

  /**
   * Posted transactions for the calendar month: sum of raw amounts (Plaid-style: positive = outflow).
   * Linear projection to month-end; surplus = negative of that sum (positive surplus = net cash building).
   */
  async getProjectedMonthlyNetCashFlow(
    userId: string,
    year: number,
    month: number,
    now: Date,
  ): Promise<{
    mtdNetSum: Prisma.Decimal;
    projectedNetSum: Prisma.Decimal;
    projectedMonthlySurplus: Prisma.Decimal;
  }> {
    const { start, end } = this.monthBoundsUtc(year, month);
    const rows = await this.prisma.transaction.findMany({
      where: {
        linkedAccount: { userId },
        status: TransactionStatus.POSTED,
        date: { gte: start, lte: end },
      },
      select: { amount: true },
    });
    let mtd = ZERO;
    for (const r of rows) {
      mtd = mtd.add(r.amount);
    }
    const elapsed = daysElapsedInMonthUtc(year, month, now);
    const projectedNetSum =
      elapsed > 0 ? linearForecastMonthEnd(mtd, year, month, now) : ZERO;
    return {
      mtdNetSum: mtd,
      projectedNetSum,
      projectedMonthlySurplus: projectedNetSum.neg(),
    };
  }

  paceStatus(mtdSpend: Prisma.Decimal, expectedToDate: Prisma.Decimal | null): BudgetPaceStatus {
    if (!expectedToDate || expectedToDate.lte(0)) return 'on_track';
    const ratio = mtdSpend.div(expectedToDate);
    if (ratio.lt(0.95)) return 'under_spending';
    if (ratio.gt(1.05)) return 'over_spending';
    return 'on_track';
  }

  buildTotalsBlock(params: {
    mtdSpend: Prisma.Decimal;
    forecastEnd: Prisma.Decimal;
    totalCap: Prisma.Decimal | null;
  }): BudgetTotalsBlock {
    const { mtdSpend, forecastEnd, totalCap } = params;
    const cap = totalCap;
    const remainingActual = cap ? cap.sub(mtdSpend) : null;
    const remainingForecast = cap ? cap.sub(forecastEnd) : null;
    return {
      monthToDateSpend: toMoneyString(mtdSpend),
      forecastedMonthEndSpend: toMoneyString(forecastEnd),
      totalBudgetCap: cap ? toMoneyString(cap) : null,
      remainingVsCapActual: remainingActual ? toMoneyString(remainingActual) : null,
      remainingVsCapForecast: remainingForecast ? toMoneyString(remainingForecast) : null,
      isOverCapActual: cap ? mtdSpend.gt(cap) : false,
      isOverCapForecast: cap ? forecastEnd.gt(cap) : false,
      safeToSpendVsForecast:
        cap && remainingForecast
          ? toMoneyString(remainingForecast.gt(0) ? remainingForecast : ZERO)
          : null,
    };
  }

  buildPaceBlock(params: {
    mtdSpend: Prisma.Decimal;
    totalCap: Prisma.Decimal | null;
    year: number;
    month: number;
    now: Date;
  }): BudgetPaceBlock {
    const { mtdSpend, totalCap, year, month, now } = params;
    const dim = daysInMonth(year, month);
    const elapsed = daysElapsedInMonthUtc(year, month, now);
    const progress = dim > 0 ? elapsed / dim : 0;
    const expectedToDate =
      totalCap && elapsed > 0 ? totalCap.mul(elapsed).div(dim) : totalCap && elapsed === 0
        ? ZERO
        : null;
    const paceRatio =
      expectedToDate && expectedToDate.gt(0) ? mtdSpend.div(expectedToDate).toNumber() : null;

    return {
      expectedSpendToDate: expectedToDate ? toMoneyString(expectedToDate) : null,
      paceRatio,
      paceStatus: this.paceStatus(mtdSpend, expectedToDate),
      monthProgressFraction: progress,
    };
  }

  /**
   * Loads month transactions for the user and aggregates expense by resolved category id
   * (`userCategoryId` ?? `aiCategoryId`).
   */
  async aggregateSpendByCategory(
    userId: string,
    year: number,
    month: number,
    transactionView: BudgetTransactionView | undefined,
  ): Promise<{
    totalSpend: Prisma.Decimal;
    byCategoryId: Map<string | 'uncategorized', Prisma.Decimal>;
  }> {
    const { start, end } = this.monthBoundsUtc(year, month);
    const view = transactionView ?? 'posted';
    const rows = await this.prisma.transaction.findMany({
      where: {
        linkedAccount: { userId },
        date: { gte: start, lte: end },
        ...(view === 'all'
          ? {}
          : {
              status:
                view === 'posted' ? TransactionStatus.POSTED : TransactionStatus.PENDING,
            }),
      },
      select: {
        amount: true,
        userCategoryId: true,
        aiCategoryId: true,
      },
    });

    const byCategoryId = new Map<string | 'uncategorized', Prisma.Decimal>();
    let totalSpend = ZERO;

    for (const r of rows) {
      const exp = expensePortion(r.amount);
      if (exp.isZero()) continue;
      totalSpend = totalSpend.add(exp);
      const key = (r.userCategoryId ?? r.aiCategoryId ?? 'uncategorized') as string | 'uncategorized';
      const prev = byCategoryId.get(key) ?? ZERO;
      byCategoryId.set(key, prev.add(exp));
    }

    return { totalSpend, byCategoryId };
  }

  async buildDashboard(params: {
    userId: string;
    year: number;
    month: number;
    transactionView: BudgetTransactionView | undefined;
    now: Date;
  }): Promise<BudgetMonthDashboardResponse> {
    const { userId, year, month, transactionView, now } = params;
    const view = transactionView ?? 'posted';

    const monthlyBudget = await this.prisma.monthlyBudget.findFirst({
      where: { userId, year, month },
      include: { categories: { orderBy: { sortOrder: 'asc' } } },
    });

    const { totalSpend, byCategoryId } = await this.aggregateSpendByCategory(
      userId,
      year,
      month,
      view,
    );

    const sumCategoryCaps = monthlyBudget?.categories.reduce(
      (s, c) => s.add(c.allocatedAmount),
      ZERO,
    ) ?? ZERO;

    const totalCap: Prisma.Decimal | null = monthlyBudget?.totalBudgetCap ?? null;

    const forecastTotal = linearForecastMonthEnd(totalSpend, year, month, now);

    const budgetCategoryIds = new Set<string>();
    for (const line of monthlyBudget?.categories ?? []) {
      if (line.categoryId) budgetCategoryIds.add(line.categoryId);
    }

    let uncategorizedSpend = byCategoryId.get('uncategorized') ?? ZERO;
    for (const [k, v] of byCategoryId) {
      if (k === 'uncategorized') continue;
      if (!budgetCategoryIds.has(k as string)) {
        uncategorizedSpend = uncategorizedSpend.add(v);
      }
    }

    const uncategorizedForecast = linearForecastMonthEnd(uncategorizedSpend, year, month, now);

    const categoryRows: BudgetCategoryRow[] = (monthlyBudget?.categories ?? []).map((line) => {
      const cap = line.allocatedAmount;
      let mtd = ZERO;
      if (line.categoryId) {
        mtd = byCategoryId.get(line.categoryId) ?? ZERO;
      }
      const fc = linearForecastMonthEnd(mtd, year, month, now);
      const remA = cap.sub(mtd);
      const remF = cap.sub(fc);
      return {
        budgetLineId: line.id,
        name: line.name,
        categoryId: line.categoryId,
        cap: toMoneyString(cap),
        monthToDateSpend: toMoneyString(mtd),
        forecastedMonthEndSpend: toMoneyString(fc),
        remainingVsCapActual: toMoneyString(remA),
        remainingVsCapForecast: toMoneyString(remF),
        isOverCapActual: mtd.gt(cap),
        isOverCapForecast: fc.gt(cap),
      };
    });

    const totals = this.buildTotalsBlock({
      mtdSpend: totalSpend,
      forecastEnd: forecastTotal,
      totalCap,
    });

    const pace = this.buildPaceBlock({
      mtdSpend: totalSpend,
      totalCap,
      year,
      month,
      now,
    });

    const uncategorizedBlock: BudgetUncategorizedBlock = {
      monthToDateSpend: toMoneyString(uncategorizedSpend),
      forecastedMonthEndSpend: toMoneyString(uncategorizedForecast),
    };

    return {
      period: {
        year,
        month,
        currency: monthlyBudget?.currency ?? 'USD',
      },
      budget: {
        monthlyBudgetId: monthlyBudget?.id ?? null,
        totalBudgetCap: monthlyBudget?.totalBudgetCap
          ? toMoneyString(monthlyBudget.totalBudgetCap)
          : null,
        sumOfCategoryCaps: toMoneyString(sumCategoryCaps),
        notes: monthlyBudget?.notes ?? null,
      },
      transactionView: view,
      totals,
      pace,
      categories: categoryRows,
      uncategorized: uncategorizedBlock,
    };
  }
}
