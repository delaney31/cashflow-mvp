import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { PaginatedResponse, TransactionResponse } from '../contracts/api-responses';
import { TransactionsQueryDto } from './dto/transactions-query.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  /**
   * @openapi
   * operationId: listTransactions
   * summary: List transactions (paginated)
   */
  @Get()
  @ApiOperation({
    summary: 'List transactions',
    description: 'Pending and posted rows with AI vs user category fields (Plaid-backed when linked).',
  })
  @ApiResponse({ status: 200, description: 'Paginated transactions' })
  @ApiResponse({ status: 400, description: 'Invalid query' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: TransactionsQueryDto,
  ): Promise<PaginatedResponse<TransactionResponse>> {
    return this.transactions.list(user, query);
  }
}
