import { Body, Controller, Get, NotFoundException, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { PaginatedResponse, TransactionResponse } from '../contracts/api-responses';
import { TransactionsQueryDto } from './dto/transactions-query.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List transactions (paginated)',
    description:
      'Filter by account, date range, posted/pending, user category, and search name/merchant.',
  })
  @ApiResponse({ status: 200, description: 'Paginated transactions' })
  @ApiResponse({ status: 400, description: 'Invalid query' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: TransactionsQueryDto,
  ): Promise<PaginatedResponse<TransactionResponse>> {
    return this.transactions.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by id' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<TransactionResponse> {
    const row = await this.transactions.getById(user, id);
    if (!row) throw new NotFoundException('Transaction not found');
    return row;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update transaction (user category override)',
    description: 'Set `userCategoryId` to a category id, or empty string to clear.',
  })
  @ApiResponse({ status: 404, description: 'Transaction or category not found' })
  async patchCategory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionCategoryDto,
  ): Promise<TransactionResponse> {
    return this.transactions.updateUserCategory(user, id, dto);
  }
}
