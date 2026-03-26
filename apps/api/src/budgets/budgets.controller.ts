import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { MonthlyBudgetResponse } from '../contracts/api-responses';
import { BudgetsService } from './budgets.service';
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
  getMonthly(
    @CurrentUser() user: AuthUser,
    @Query() query: MonthlyBudgetQueryDto,
  ): MonthlyBudgetResponse {
    return this.budgets.getMonthly(user, query);
  }
}
