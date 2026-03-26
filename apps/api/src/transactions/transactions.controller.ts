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
   * summary: List transactions (paginated, mock)
   */
  @Get()
  @ApiOperation({
    summary: 'List transactions',
    description: 'Pending and posted rows with AI vs user category fields (mock).',
  })
  @ApiResponse({ status: 200, description: 'Paginated transactions' })
  @ApiResponse({ status: 400, description: 'Invalid query' })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: TransactionsQueryDto,
  ): PaginatedResponse<TransactionResponse> {
    return this.transactions.list(user, query);
  }
}
