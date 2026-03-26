import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { PaginatedResponse, TransactionResponse } from '../contracts/api-responses';
import type { TransactionsQueryDto } from './dto/transactions-query.dto';

const ALL: TransactionResponse[] = [
  {
    id: 'txn_001',
    linkedAccountId: 'la_chk_001',
    amount: '-42.50',
    currency: 'USD',
    status: 'POSTED',
    date: '2025-03-20',
    postedAt: '2025-03-21T08:00:00.000Z',
    name: 'Whole Foods',
    merchantName: 'Whole Foods Market',
    aiCategoryId: 'cat_food_001',
    aiCategoryName: 'Groceries',
    userCategoryId: null,
    userCategoryName: null,
  },
  {
    id: 'txn_002',
    linkedAccountId: 'la_chk_001',
    amount: '-9.00',
    currency: 'USD',
    status: 'PENDING',
    date: '2025-03-25',
    postedAt: null,
    name: 'Coffee Shop',
    merchantName: 'Blue Bottle',
    aiCategoryId: 'cat_dining_001',
    aiCategoryName: 'Dining',
    userCategoryId: 'cat_food_001',
    userCategoryName: 'Groceries',
  },
  {
    id: 'txn_003',
    linkedAccountId: 'la_sv_002',
    amount: '2500.00',
    currency: 'USD',
    status: 'POSTED',
    date: '2025-03-01',
    postedAt: '2025-03-01T12:00:00.000Z',
    name: 'Employer Payroll',
    merchantName: null,
    aiCategoryId: null,
    aiCategoryName: null,
    userCategoryId: null,
    userCategoryName: null,
  },
];

@Injectable()
export class TransactionsService {
  /**
   * @openapi
   * summary: Paginated transactions with optional filters (mock)
   */
  list(_user: AuthUser, query: TransactionsQueryDto): PaginatedResponse<TransactionResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    let rows = [...ALL];

    if (query.linkedAccountId) {
      rows = rows.filter((t) => t.linkedAccountId === query.linkedAccountId);
    }
    if (query.from) {
      rows = rows.filter((t) => t.date >= query.from!.slice(0, 10));
    }
    if (query.to) {
      rows = rows.filter((t) => t.date <= query.to!.slice(0, 10));
    }

    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows.slice(start, start + limit);
    return {
      items,
      meta: {
        page,
        limit,
        total,
        hasMore: start + items.length < total,
      },
    };
  }
}
