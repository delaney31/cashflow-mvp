import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { MonthlyBudgetResponse } from '../contracts/api-responses';
import type { BudgetMonthDashboardResponse } from './budget-dashboard.types';
import { BudgetsService } from './budgets.service';
import { BudgetDashboardQueryDto } from './dto/budget-dashboard-query.dto';
import { MonthlyBudgetQueryDto } from './dto/monthly-budget-query.dto';

@ApiTags('budgets')
@ApiBearerAuth('JWT-auth')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  /**
   * @openapi
   * operationId: getMonthlyBudget
   * summary: Monthly budget for a calendar month
   */
  @Get('monthly')
  @ApiOperation({
    summary: 'Get monthly budget',
    description: 'Returns envelope lines for the requested year/month (defaults to current UTC month).',
  })
  @ApiResponse({ status: 200, description: 'Monthly budget' })
  @ApiResponse({ status: 400, description: 'Invalid query' })
  async getMonthly(
    @CurrentUser() user: AuthUser,
    @Query() query: MonthlyBudgetQueryDto,
  ): Promise<MonthlyBudgetResponse> {
    return this.budgets.getMonthly(user, query);
  }

  @Get('monthly/dashboard')
  @ApiOperation({
    summary: 'Month spending-cap dashboard',
    description:
      'MTD spend, linear forecast to month-end, pace vs linear budget, category & uncategorized breakdown. `transactionView`: posted | pending | all.',
  })
  @ApiResponse({ status: 200, description: 'Budget engine snapshot for mobile dashboard' })
  async getMonthDashboard(
    @CurrentUser() user: AuthUser,
    @Query() query: BudgetDashboardQueryDto,
  ): Promise<BudgetMonthDashboardResponse> {
    return this.budgets.getMonthDashboard(user, query);
  }
}
