import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { MonthlyBudgetResponse } from '../contracts/api-responses';
import type { MonthlyBudgetQueryDto } from './dto/monthly-budget-query.dto';

@Injectable()
export class BudgetsService {
  /**
   * @openapi
   * summary: Month-scoped budget with category lines (mock)
   */
  getMonthly(_user: AuthUser, query: MonthlyBudgetQueryDto): MonthlyBudgetResponse {
    const d = new Date();
    const year = query.year ?? d.getUTCFullYear();
    const month = query.month ?? d.getUTCMonth() + 1;

    return {
      id: `mb_${year}_${String(month).padStart(2, '0')}`,
      year,
      month,
      currency: 'USD',
      categories: [
        {
          id: 'bc_001',
          name: 'Groceries',
          categoryId: 'cat_food_001',
          allocatedAmount: '600.00',
          sortOrder: 0,
        },
        {
          id: 'bc_002',
          name: 'Dining Out',
          categoryId: 'cat_dining_001',
          allocatedAmount: '200.00',
          sortOrder: 1,
        },
        {
          id: 'bc_003',
          name: 'Transit',
          categoryId: null,
          allocatedAmount: '120.00',
          sortOrder: 2,
        },
      ],
    };
  }
}
