import { Injectable } from '@nestjs/common';
import { Prisma } from '@cashflow/db';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { PaginatedResponse, TransactionResponse } from '../contracts/api-responses';
import type { TransactionsQueryDto } from './dto/transactions-query.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    user: AuthUser,
    query: TransactionsQueryDto,
  ): Promise<PaginatedResponse<TransactionResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      linkedAccount: { userId: user.userId },
    };
    if (query.linkedAccountId) {
      where.linkedAccountId = query.linkedAccountId;
    }
    if (query.from || query.to) {
      where.date = {};
      if (query.from) {
        where.date.gte = new Date(`${query.from.slice(0, 10)}T00:00:00.000Z`);
      }
      if (query.to) {
        where.date.lte = new Date(`${query.to.slice(0, 10)}T23:59:59.999Z`);
      }
    }

    const [rows, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          aiCategory: true,
          userCategory: true,
        },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const items: TransactionResponse[] = rows.map((t) => ({
      id: t.id,
      linkedAccountId: t.linkedAccountId,
      amount: t.amount.toString(),
      currency: t.currency,
      status: t.status as TransactionResponse['status'],
      date: t.date.toISOString().slice(0, 10),
      postedAt: t.postedAt ? t.postedAt.toISOString() : null,
      name: t.name,
      merchantName: t.merchantName,
      aiCategoryId: t.aiCategoryId,
      aiCategoryName: t.aiCategory?.name ?? null,
      userCategoryId: t.userCategoryId,
      userCategoryName: t.userCategory?.name ?? null,
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        hasMore: skip + items.length < total,
      },
    };
  }
}
