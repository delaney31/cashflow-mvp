import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { MonthlyBudgetResponse } from '../contracts/api-responses';
import type { BudgetMonthDashboardResponse } from './budget-dashboard.types';
import { BudgetEngineService } from './budget-engine.service';
import type { BudgetDashboardQueryDto } from './dto/budget-dashboard-query.dto';
import type { MonthlyBudgetQueryDto } from './dto/monthly-budget-query.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: BudgetEngineService,
  ) {}

  /**
   * Persisted budget lines for a calendar month (empty if none saved).
   */
  async getMonthly(user: AuthUser, query: MonthlyBudgetQueryDto): Promise<MonthlyBudgetResponse> {
    const d = new Date();
    const year = query.year ?? d.getUTCFullYear();
    const month = query.month ?? d.getUTCMonth() + 1;

    const row = await this.prisma.monthlyBudget.findFirst({
      where: { userId: user.userId, year, month },
      include: { categories: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!row) {
      return {
        id: `placeholder_${year}_${month}`,
        year,
        month,
        currency: 'USD',
        totalBudgetCap: null,
        categories: [],
      };
    }

    return {
      id: row.id,
      year: row.year,
      month: row.month,
      currency: row.currency,
      totalBudgetCap: row.totalBudgetCap ? row.totalBudgetCap.toString() : null,
      categories: row.categories.map((c) => ({
        id: c.id,
        name: c.name,
        categoryId: c.categoryId,
        allocatedAmount: c.allocatedAmount.toString(),
        sortOrder: c.sortOrder,
      })),
    };
  }

  /**
   * Spending-cap engine: MTD, forecast, pace, category vs uncategorized, posted/pending/all.
   */
  async getMonthDashboard(
    user: AuthUser,
    query: BudgetDashboardQueryDto,
  ): Promise<BudgetMonthDashboardResponse> {
    const d = new Date();
    const year = query.year ?? d.getUTCFullYear();
    const month = query.month ?? d.getUTCMonth() + 1;
    return this.engine.buildDashboard({
      userId: user.userId,
      year,
      month,
      transactionView: query.transactionView,
      now: d,
    });
  }
}
